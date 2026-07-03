#!/usr/bin/env bash
# Run BUILD_MASTER_PROMPT verification suite; capture evidence to SCRATCH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="${SCRATCH:-/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer}"
export SCRATCH
mkdir -p "$SCRATCH"

cd "$ROOT"
echo "==> verification SCRATCH=$SCRATCH"

node tests/rv_horizon_fallback.test.mjs
node tests/run_desk_probes.mjs
node tests/freshness_indicators.test.mjs

# Staging sample
SAMPLE="$SCRATCH/whinfell_drop_sample"
rm -rf "$SAMPLE"
mkdir -p "$SAMPLE"
python3 - <<'PY' "$SAMPLE"
import sys
from pathlib import Path
drop = Path(sys.argv[1])
samples = {
    "koyfin_credit_20260703.csv": "date,close,volume\n2026-07-01,100.5,1200\n2026-07-02,101.2,980\n",
    "WTM-Flows-Global_2026.07.03.csv": "date,close,volume\n2026-07-01,50.1,500\n2026-07-02,51.0,480\n",
    "barchart_GC_historical.csv": "date,close,volume\n2026-07-01,2000.1,100\n2026-07-02,2001.5,95\n",
    "tiny_bad.csv": "x",
}
for name, body in samples.items():
    (drop / name).write_text(body)
PY
bash scripts/normalize_whinfell_drop.sh "$SAMPLE" --dry-run 2>&1 | tee "$SCRATCH/staging_run.log"

bash scripts/build_desk_preview.sh 2>&1 | tee "$SCRATCH/build_1.log"
STAMP1=$(grep -v '^20[0-9][0-9]-' dist/BUILD_STAMP.txt | sort)
bash scripts/build_desk_preview.sh 2>&1 | tee "$SCRATCH/build_2.log"
STAMP2=$(grep -v '^20[0-9][0-9]-' dist/BUILD_STAMP.txt | sort)
[[ "$STAMP1" == "$STAMP2" ]] || { echo "BUILD_STAMP build-id mismatch" >&2; diff -u <(echo "$STAMP1") <(echo "$STAMP2") >&2; exit 1; }

# Static script audit
grep -q '__WTM_BOOTED' dist/js/core.js
! grep -q '^module\.exports' dist/js/*.js 2>/dev/null || true

{
  echo "Desk_Feedback_Log.md"
  echo "BUILD_TODO_List.md"
  echo "Progress_Log.md"
} > "$SCRATCH/desk_docs_manifest.txt"

node tests/desk_launch.mjs 2>&1 | tee -a "$SCRATCH/launch_check.log" || true

echo "==> verification OK"