#!/bin/bash
# Double-click launcher: enrich hydration → score → open desk UI + API server.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Enriching hydration (eth_calendar + rv_history)…"
python3 scripts/enrich_hydration_rv.py

echo "==> Scoring Bang Bang Da trades…"
python3 bang_bang_da_calculator.py -i docs/data/hydration/latest.json

echo "==> Starting API server on :8766 (background)…"
if lsof -ti:8766 >/dev/null 2>&1; then
  echo "    Port 8766 already in use — reusing existing server"
else
  python3 scripts/bang_bang_da_server.py &
  sleep 0.5
fi

echo "==> Opening desk UI…"
open "http://127.0.0.1:8766/health" 2>/dev/null || true
if command -v python3 >/dev/null; then
  if ! lsof -ti:8765 >/dev/null 2>&1; then
    python3 -m http.server 8765 &
    sleep 0.3
  fi
  open "http://127.0.0.1:8765/bang_bang_da_machine.html"
fi

echo "Done. API: http://127.0.0.1:8766/api/report?window=60"