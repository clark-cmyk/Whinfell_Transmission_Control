#!/usr/bin/env bash
# TCM-Task Force v1.1.0 — sequential Grok Task chain (manual / scheduled).
# Run each prompt in prompts/task_force/ in pipeline_seq order; pass JSON output to next step.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$ROOT/prompts/task_force"
HYDRATION="${TASK_FORCE_HYDRATION:-$ROOT/docs/data/hydration/latest.json}"
OUT="${TASK_FORCE_OUT:-$ROOT/data/hydration/task_force.json}"
MERGE_TARGET="${TASK_FORCE_MERGE_TARGET:-$HYDRATION}"

# specialist_id → TCM-Task Specialist_Name (Grok Task title prefix)
tcm_name() {
  case "$1" in
    data_gatherer) echo DataGatherer ;;
    btc_eth_basis) echo BtcEthBasis ;;
    btc_eth_vol_arb) echo BtcEthVolArb ;;
    compute_gpu) echo ComputeGpu ;;
    power_nat_gas) echo PowerNatGas ;;
    metals_debt) echo MetalsDebt ;;
    china_sq3_deep) echo ChinaSq3Deep ;;
    sofr_fedfunds) echo SofrFedFunds ;;
    hy_vs_ig) echo HyVsIg ;;
    global_transmission) echo GlobalTransmission ;;
    master_sizing) echo MasterSizing ;;
    tx_integrator) echo TxIntegrator ;;
    *) echo "UNKNOWN: $1" >&2; return 1 ;;
  esac
}

SEQ=(
  data_gatherer
  btc_eth_basis
  btc_eth_vol_arb
  compute_gpu
  power_nat_gas
  metals_debt
  china_sq3_deep
  sofr_fedfunds
  hy_vs_ig
  global_transmission
  master_sizing
  tx_integrator
)

echo "TCM-Task Force v1.1.0 — run Grok Tasks sequentially:"
for id in "${SEQ[@]}"; do
  name="$(tcm_name "$id")"
  f="$PROMPTS/TCM-Task-${name}.md"
  [[ -f "$f" ]] || { echo "MISSING: $f" >&2; exit 1; }
  echo "  → TCM-Task-${name} v1.1.0  ($id · $f)"
done

echo ""
echo "INPUT:  $HYDRATION (TCM-Task-DataGatherer) or prior step JSON"
echo "OUTPUT: $OUT"
echo "FORMAT: each Grok Task returns the full task_force object in one \`\`\`json fenced block (no prose outside)"
echo ""
echo "Local steps (no Grok):"
echo "  $0 --gatherer          # TCM-Task-DataGatherer via run_data_gatherer.py"
echo "  $0 --complete-stubs    # specialist stubs + WTM on gatherer snapshot"
echo "  $0 --merge             # merge task_force.json → hydration (after TxIntegrator)"
echo "  $0 --refresh           # gatherer → complete-stubs → merge → atomic dual re-copy"
echo "  scripts/copy_hydration_bundle.sh   # post daily --chain (Clark URLs gate)"
echo ""
echo "Verify:"
echo "  node tests/task_force_wtm_export.test.mjs"
echo "  node tests/task_force_panel_feed.test.mjs"
echo "  node tests/phase23_console.test.mjs"
echo "  python3 tests/test_merge_task_force.py"
echo "  python3 tests/test_complete_task_force_stubs.py"

if [[ "${1:-}" == "--gatherer" ]]; then
  python3 "$ROOT/scripts/run_data_gatherer.py" --input "$HYDRATION" --output "$OUT"
  exit $?
fi

if [[ "${1:-}" == "--complete-stubs" ]]; then
  python3 "$ROOT/scripts/complete_task_force_stubs.py" --input "$OUT" --output "$OUT"
  exit $?
fi

if [[ "${1:-}" == "--merge" ]]; then
  python3 "$ROOT/scripts/merge_task_force.py" \
    --hydration "$MERGE_TARGET" \
    --task-force "$OUT" \
    --output "$MERGE_TARGET"
  exit $?
fi

if [[ "${1:-}" == "--refresh" ]]; then
  # Full local path: live gatherer snapshot + complete stubs → merge → dual atomic publish.
  # Re-copy uses WHINFELL_HYDRATION_SRC so Cousins pipeline SRC cannot wipe TF.
  python3 "$ROOT/scripts/run_data_gatherer.py" --input "$HYDRATION" --output "$OUT"
  python3 "$ROOT/scripts/complete_task_force_stubs.py" --input "$OUT" --output "$OUT"
  MERGED_TMP="$(mktemp "${TMPDIR:-/tmp}/wtm_tf_merged.XXXXXX")"
  trap 'rm -f "$MERGED_TMP"' EXIT
  python3 "$ROOT/scripts/merge_task_force.py" \
    --hydration "$MERGE_TARGET" \
    --task-force "$OUT" \
    --output "$MERGED_TMP"
  WHINFELL_HYDRATION_SRC="$MERGED_TMP" bash "$ROOT/scripts/copy_hydration_bundle.sh"
  python3 - <<PY
import json
from pathlib import Path
root = Path(r'''$ROOT''')
for rel in ("docs/data/hydration/latest.json", "data/hydration/latest.json"):
    p = root / rel
    d = json.loads(p.read_text(encoding="utf-8"))
    assert d.get("task_force"), f"missing task_force in {p}"
    assert d["task_force"].get("snapshot_id") == d.get("snapshot_id"), f"snap mismatch {p}"
    ms = (d.get("task_force") or {}).get("master_sizing") or {}
    print(
        f"tf_refresh_ok path={p} snapshot_id={d.get('snapshot_id')} "
        f"validation={d['task_force'].get('validation_status')} "
        f"score={ms.get('full_whinfell_score')} verdict={ms.get('verdict')}"
    )
PY
  exit 0
fi