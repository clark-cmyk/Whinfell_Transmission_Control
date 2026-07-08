#!/usr/bin/env bash
# Copy fresh Cousins Barchart curve history into TC serveable paths.
# Run after daily --chain (barchart_history step in Cousins pipeline).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COUSINS="${WHINFELL_PIPELINE_ROOT:-$HOME/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE}"
SRC="$COUSINS/data/barchart/v1/barchart_curve_history.json"
DEST_V1="$ROOT/data/barchart/v1/barchart_curve_history.json"
DEST_DOCS="$ROOT/docs/data/barchart/v1/barchart_curve_history.json"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: missing $SRC" >&2
  echo "hint: run daily --chain in Cousins pipeline first" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST_V1")" "$(dirname "$DEST_DOCS")"
cp "$SRC" "$DEST_V1"
cp "$SRC" "$DEST_DOCS"
echo "curve_copy_ok src=$SRC dest_v1=$DEST_V1 dest_docs=$DEST_DOCS"
python3 -c "import json; d=json.load(open('$DEST_V1')); print(f\"symbol_count={d.get('symbol_count')} as_of={d.get('as_of')}\")"