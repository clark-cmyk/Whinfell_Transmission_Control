#!/bin/bash
# Double-click launcher — Barchart + Koyfin CSV fetch + optional pipeline chain.
set -euo pipefail

REPO="${WHINFELL_TC_ROOT:-$HOME/Desktop/Whinfell_Transmission_Control}"
cd "$REPO"

echo "=== Whinfell Morning Collect (.command) ==="
echo "repo=$REPO"

# Start collect agent in background if not already listening.
if ! curl -sf "http://127.0.0.1:${WHINFELL_COLLECT_PORT:-8767}/health" >/dev/null 2>&1; then
  echo "Starting collect agent on :${WHINFELL_COLLECT_PORT:-8767} ..."
  nohup python3 scripts/whinfell_collect_agent.py >/tmp/whinfell_collect_agent.log 2>&1 &
  sleep 0.5
fi

bash scripts/morning_auto_collect.sh