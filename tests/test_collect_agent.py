#!/usr/bin/env python3
"""HTTP smoke tests for whinfell_collect_agent (incl. Chunk 22 curve APIs)."""

from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
AGENT = REPO / "scripts" / "whinfell_collect_agent.py"
EXPECTED_VERSION_PREFIX = "0.3"


def _get(url: str, timeout: float = 3.0) -> tuple[int, dict]:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode())


def _post(url: str, body: dict | None = None, timeout: float = 30.0) -> tuple[int, dict]:
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode())


def main() -> int:
    proc = subprocess.Popen(
        [sys.executable, str(AGENT), "--port", "18767"],
        cwd=REPO,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base = "http://127.0.0.1:18767"
    try:
        for _ in range(40):
            try:
                code, payload = _get(f"{base}/health")
                if code == 200 and payload.get("ok"):
                    break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.1)
        else:
            print("FAIL test_collect_agent.py: agent did not start")
            return 1

        code, health = _get(f"{base}/health")
        assert code == 200 and health.get("ok"), health
        ver = str(health.get("version") or "")
        assert ver.startswith(EXPECTED_VERSION_PREFIX) or "curve" in ver.lower(), health
        assert "Whinfell" in str(health.get("repo") or REPO) or str(REPO) in str(health.get("repo") or ""), health

        code, job = _post(f"{base}/v1/collect/fetch", {"id": "not_a_real_export"})
        assert code == 202 and job.get("job_id"), job

        job_id = job["job_id"]
        for _ in range(50):
            _, status = _get(f"{base}/v1/job/{job_id}")
            if status.get("status") in ("done", "failed", "error"):
                break
            time.sleep(0.1)
        else:
            print("FAIL test_collect_agent.py: job did not finish")
            return 1

        # Chunk 22 — curve status + sync refresh must exist.
        code, curve_status = _get(f"{base}/v1/curve/status")
        assert code == 200, curve_status
        assert curve_status.get("error") != "not_found", curve_status
        assert curve_status.get("ok") is True or curve_status.get("path"), curve_status

        code, refreshed = _post(f"{base}/v1/curve/refresh", {}, timeout=60.0)
        # ok if drop has CSV; 400 is acceptable when drop empty in CI — endpoint must not 404.
        assert code in (200, 400), refreshed
        if code == 200:
            assert refreshed.get("ok") is True, refreshed
            assert "BTN26_close" in refreshed or refreshed.get("quote_symbols") is not None, refreshed

        print("PASS test_collect_agent.py")
        print(f"health_version={health.get('version')}")
        print(f"job_status={status.get('status')}")
        print(f"curve_status_ok={curve_status.get('ok')}")
        print(f"curve_refresh_http={code}")
        if code == 200:
            print(f"BTN26_close={refreshed.get('BTN26_close')}")
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
