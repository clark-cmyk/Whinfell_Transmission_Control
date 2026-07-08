#!/usr/bin/env python3
"""Local desk agent — bridges browser UI to morning_auto_collect / run_auto_download."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PORT = 8767
AGENT_VERSION = "0.1.0"

_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()


def _drop_dir() -> str:
    return os.environ.get("WHINFELL_DROP", str(Path.home() / "Downloads" / "whinfell_drop"))


def _cors_origin(origin: str | None) -> str:
    if not origin:
        return "*"
    if "localhost" in origin or "127.0.0.1" in origin or origin == "null":
        return origin
    return "null"


class CollectAgentHandler(BaseHTTPRequestHandler):
    server_version = "WhinfellCollectAgent/0.1"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write(f"[collect-agent] {self.address_string()} - {fmt % args}\n")

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode() or "{}")
        except json.JSONDecodeError:
            return {}

    def _send_json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        origin = self.headers.get("Origin")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", _cors_origin(origin))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json(204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "version": AGENT_VERSION,
                    "auto_download": _module_version(),
                    "repo": str(REPO_ROOT),
                },
            )
            return
        if path == "/v1/status":
            self._drop_status()
            return
        if path.startswith("/v1/job/"):
            job_id = path.rsplit("/", 1)[-1]
            with _jobs_lock:
                job = _jobs.get(job_id)
            if not job:
                self._send_json(404, {"error": "job_not_found"})
            else:
                self._send_json(200, job)
            return
        self._send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        body = self._read_json_body()

        if path == "/v1/collect/morning":
            script = REPO_ROOT / "scripts" / "morning_auto_collect.sh"
            self._spawn_job("morning", ["bash", str(script)], cwd=REPO_ROOT)
            return
        if path == "/v1/collect/fetch":
            export_id = body.get("id")
            if not export_id:
                self._send_json(400, {"error": "missing id"})
                return
            cmd = [
                sys.executable,
                str(REPO_ROOT / "run_auto_download.py"),
                "--drop",
                _drop_dir(),
                "fetch",
                "--id",
                str(export_id),
            ]
            self._spawn_job(f"fetch-{export_id}", cmd, cwd=REPO_ROOT)
            return
        if path == "/v1/collect/terminal":
            self._open_terminal()
            return
        if path == "/v1/publish/web":
            self._spawn_publish_web(body)
            return
        self._send_json(404, {"error": "not_found"})

    def _drop_status(self) -> None:
        cmd = [
            sys.executable,
            str(REPO_ROOT / "run_auto_download.py"),
            "--drop",
            _drop_dir(),
            "status",
            "--json",
        ]
        try:
            proc = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True, timeout=60)
            if proc.returncode not in (0, 1) and not proc.stdout.strip():
                self._send_json(500, {"error": proc.stderr.strip() or "status_failed"})
                return
            payload = json.loads(proc.stdout or "{}")
            self._send_json(200, payload)
        except (json.JSONDecodeError, subprocess.TimeoutExpired, OSError) as exc:
            self._send_json(500, {"error": str(exc)})

    def _spawn_job(self, label: str, cmd: list[str], cwd: Path | None = None) -> None:
        job_id = uuid.uuid4().hex[:12]
        job: dict = {"id": job_id, "label": label, "status": "running", "exit_code": None}

        def run() -> None:
            try:
                proc = subprocess.run(
                    cmd,
                    cwd=cwd or REPO_ROOT,
                    capture_output=True,
                    text=True,
                )
                with _jobs_lock:
                    job["status"] = "done" if proc.returncode == 0 else "failed"
                    job["exit_code"] = proc.returncode
                    job["stdout_tail"] = (proc.stdout or "")[-2000:]
                    job["stderr_tail"] = (proc.stderr or "")[-2000:]
            except OSError as exc:
                with _jobs_lock:
                    job["status"] = "error"
                    job["error"] = str(exc)

        with _jobs_lock:
            _jobs[job_id] = job
        threading.Thread(target=run, daemon=True).start()
        self._send_json(202, {"ok": True, "job_id": job_id, "label": label})

    def _spawn_publish_web(self, body: dict) -> None:
        script = REPO_ROOT / "scripts" / "publish_ghpages.sh"
        env = os.environ.copy()
        if body.get("collect"):
            env["WHINFELL_PUBLISH_COLLECT"] = "1"
        job_id = uuid.uuid4().hex[:12]
        job: dict = {"id": job_id, "label": "publish-web", "status": "running", "exit_code": None}

        def run() -> None:
            try:
                proc = subprocess.run(
                    ["bash", str(script)],
                    cwd=REPO_ROOT,
                    capture_output=True,
                    text=True,
                    env=env,
                )
                with _jobs_lock:
                    job["status"] = "done" if proc.returncode == 0 else "failed"
                    job["exit_code"] = proc.returncode
                    job["stdout_tail"] = (proc.stdout or "")[-4000:]
                    job["stderr_tail"] = (proc.stderr or "")[-4000:]
            except OSError as exc:
                with _jobs_lock:
                    job["status"] = "error"
                    job["error"] = str(exc)

        with _jobs_lock:
            _jobs[job_id] = job
        threading.Thread(target=run, daemon=True).start()
        self._send_json(202, {"ok": True, "job_id": job_id, "label": "publish-web"})

    def _open_terminal(self) -> None:
        if sys.platform != "darwin":
            self._send_json(501, {"error": "terminal_open_unsupported"})
            return
        escaped = str(REPO_ROOT).replace('"', '\\"')
        script = f'cd "{escaped}" && bash scripts/morning_auto_collect.sh'
        try:
            subprocess.Popen(
                ["osascript", "-e", f'tell application "Terminal" to do script "{script}"'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            self._send_json(200, {"ok": True, "mode": "terminal"})
        except OSError as exc:
            self._send_json(500, {"error": str(exc)})


def _module_version() -> str:
    try:
        from whinfell_pipeline.auto_download.targets import MODULE_VERSION

        return MODULE_VERSION
    except ImportError:
        return "unknown"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Whinfell collect agent — browser ↔ terminal bridge")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("WHINFELL_COLLECT_PORT", DEFAULT_PORT)),
    )
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args(argv)

    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))

    server = ThreadingHTTPServer((args.bind, args.port), CollectAgentHandler)
    print(f"collect_agent listening http://{args.bind}:{args.port} repo={REPO_ROOT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\ncollect_agent stopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())