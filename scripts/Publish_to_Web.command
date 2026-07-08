#!/bin/bash
# Double-click launcher — build + push static site to gh-pages.
set -euo pipefail

REPO="${WHINFELL_TC_ROOT:-$HOME/Desktop/Whinfell_Transmission_Control}"
cd "$REPO"

echo "=== Whinfell Publish to Web (.command) ==="
echo "repo=$REPO"

if ! curl -sf "http://127.0.0.1:${WHINFELL_COLLECT_PORT:-8767}/health" >/dev/null 2>&1; then
  echo "Starting collect agent on :${WHINFELL_COLLECT_PORT:-8767} ..."
  nohup python3 scripts/whinfell_collect_agent.py >/tmp/whinfell_collect_agent.log 2>&1 &
  sleep 0.5
fi

bash scripts/publish_ghpages.sh

echo ""
echo "Team URL: https://clark-cmyk.github.io/Whinfell_Transmission_Control/"
read -r -p "Press Enter to close…" _