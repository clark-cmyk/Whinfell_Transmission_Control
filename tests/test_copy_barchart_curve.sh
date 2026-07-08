#!/usr/bin/env bash
# Smoke test for copy_barchart_curve_bundle.sh with a temp fixture.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

FAKE_COUSINS="$SCRATCH/cousins"
mkdir -p "$FAKE_COUSINS/data/barchart/v1"
cat > "$FAKE_COUSINS/data/barchart/v1/barchart_curve_history.json" <<'JSON'
{
  "version": "test",
  "bucket": "curve",
  "as_of": "2026-07-05T12:00:00Z",
  "symbol_count": 1,
  "records": [{ "raw_symbol": "BTM26", "latest": { "close": 102000, "date": "2026-07-01" } }]
}
JSON

WHINFELL_PIPELINE_ROOT="$FAKE_COUSINS" bash "$ROOT/scripts/copy_barchart_curve_bundle.sh"

test -f "$ROOT/data/barchart/v1/barchart_curve_history.json"
test -f "$ROOT/docs/data/barchart/v1/barchart_curve_history.json"
python3 -c "
import json
from pathlib import Path
p = Path('$ROOT/data/barchart/v1/barchart_curve_history.json')
d = json.loads(p.read_text())
assert d['symbol_count'] == 1, d
assert d['records'][0]['raw_symbol'] == 'BTM26'
print('PASS test_copy_barchart_curve.sh')
"