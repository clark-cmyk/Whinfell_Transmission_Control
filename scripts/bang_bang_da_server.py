#!/usr/bin/env python3
"""Local API for Bang Bang Da Machine — window selector live refresh.

  python3 scripts/bang_bang_da_server.py
  → http://127.0.0.1:8766/api/report?window=60
"""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da_calculator import BangBangCalculator, default_bundle_path, load_bundle  # noqa: E402

HOST = "127.0.0.1"
PORT = 8766
DEFAULT_INPUT = default_bundle_path()


class BangBangHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write(f"[bbdm] {self.address_string()} - {fmt % args}\n")

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in ("/api/report", "/api/bang_bang_da/report", "/health"):
            self.send_error(404, "Not found")
            return

        if parsed.path == "/health":
            self._json(200, {"ok": True, "service": "bang_bang_da"})
            return

        qs = parse_qs(parsed.query)
        window_raw = (qs.get("window") or ["60"])[0]
        try:
            window = int(window_raw)
        except ValueError:
            window = 60
        if window not in (30, 60, 90):
            window = 60

        input_path = Path((qs.get("input") or [str(DEFAULT_INPUT)])[0])
        if not input_path.is_file():
            self._json(404, {"error": f"hydration not found: {input_path}"})
            return

        bundle = load_bundle(input_path)
        report = BangBangCalculator(bundle, window_days=window).run()
        self._json(200, report)

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)


def main() -> int:
    server = ThreadingHTTPServer((HOST, PORT), BangBangHandler)
    print(f"Bang Bang Da API → http://{HOST}:{PORT}/api/report?window=60")
    print(f"Hydration: {DEFAULT_INPUT}")
    print("Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())