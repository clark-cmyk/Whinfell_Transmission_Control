#!/usr/bin/env bash
# Copy fresh Cousins hydration bundle into TC docs for build/deploy.
# Run after daily --chain with required exports ready (post Clark URL wiring).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COUSINS="${WHINFELL_PIPELINE_ROOT:-$HOME/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE}"
SRC="$COUSINS/data/hydration/latest.json"
DEST_DIR="$ROOT/docs/data/hydration"
DEST="$DEST_DIR/latest.json"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: missing $SRC" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
cp "$SRC" "$DEST"
echo "hydration_copy_ok src=$SRC dest=$DEST"
python3 -c "import json; d=json.load(open('$DEST')); print(f\"as_of={d.get('as_of')} freshness_status={d.get('freshness_status')}\")"