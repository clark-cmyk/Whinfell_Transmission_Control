#!/usr/bin/env bash
# Rename raw Barchart/Koyfin downloads → canonical staged filename contract.
# TC-local implementation — relaxed quarantine vs strict cousins matcher.
# Usage: scripts/normalize_whinfell_drop.sh [drop_dir] [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
DROP="${1:-$HOME/Downloads/whinfell_drop}"
DRY=""
if [[ "${2:-}" == "--dry-run" ]] || [[ "${1:-}" == "--dry-run" ]]; then
  DRY="--dry-run"
  if [[ "${1:-}" == "--dry-run" ]]; then
    DROP="${2:-$HOME/Downloads/whinfell_drop}"
  fi
fi

exec python3 "$SCRIPT_DIR/normalize_drop.py" "$DROP" $DRY