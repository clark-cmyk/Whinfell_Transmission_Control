#!/bin/bash
# Double-click launcher — Barchart + Koyfin CSV fetch + optional pipeline chain.
# Chunk 22: always use THIS checkout (not a hard-coded Desktop path) so curve
# refresh + collect agent match the code serving the desk.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="${WHINFELL_TC_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
cd "$REPO"

echo "=== Whinfell Morning Collect (.command) ==="
echo "repo=$REPO"

# Permanent: curve-capable agent on :8767 (replaces stale Desktop v0.1.0 if needed).
bash scripts/ensure_collect_agent.sh

bash scripts/morning_auto_collect.sh
