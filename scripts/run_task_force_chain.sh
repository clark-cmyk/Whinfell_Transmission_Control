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
echo "  $0 --merge             # merge task_force.json → hydration (after TxIntegrator)"
echo "  scripts/copy_hydration_bundle.sh   # post daily --chain (Clark URLs gate)"
echo ""
echo "Verify:"
echo "  node tests/task_force_wtm_export.test.mjs"
echo "  python3 tests/test_merge_task_force.py"

if [[ "${1:-}" == "--gatherer" ]]; then
  python3 "$ROOT/scripts/run_data_gatherer.py" --input "$HYDRATION" --output "$OUT"
  exit $?
fi

if [[ "${1:-}" == "--merge" ]]; then
  python3 "$ROOT/scripts/merge_task_force.py" \
    --hydration "$MERGE_TARGET" \
    --task-force "$OUT" \
    --output "$MERGE_TARGET"
  exit $?
fi