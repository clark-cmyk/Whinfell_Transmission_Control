#!/usr/bin/env bash
# Morning collect — auto-download core exports then optional pipeline chain.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Prefer this checkout (script parent) over legacy Desktop default.
REPO="${WHINFELL_TC_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
DROP="${WHINFELL_DROP:-$HOME/Downloads/whinfell_drop}"
CHAIN="${WHINFELL_MORNING_CHAIN:-1}"

cd "$REPO"

echo "=== Whinfell Morning Collect ==="
echo "repo=$REPO"
echo "drop=$DROP"
echo "auto_download_version=$(python3 -c 'from whinfell_pipeline.auto_download.targets import MODULE_VERSION; print(MODULE_VERSION)')"

# Chunk 22 permanent: ARK/Desk one-click need a curve-capable agent on :8767.
if [[ -x "$SCRIPT_DIR/ensure_collect_agent.sh" ]] || [[ -f "$SCRIPT_DIR/ensure_collect_agent.sh" ]]; then
  bash "$SCRIPT_DIR/ensure_collect_agent.sh" || echo "WARN: ensure_collect_agent failed — curve one-click may be offline"
fi

# Auto-archive runs inside run_auto_download.py (status/fetch/daily) before each step.
python3 run_auto_download.py --drop "$DROP" status || true

fetch_one() {
  local id="$1"
  echo ""
  echo "--- fetch $id ---"
  if python3 run_auto_download.py --drop "$DROP" fetch --id "$id"; then
    return 0
  fi
  echo "WARN: fetch failed for $id — opening manual tab"
  python3 run_auto_download.py open --id "$id" || true
  return 1
}

FAIL=0
# Barchart fetch also rebuilds barchart_curve_history.json (Chunk 22 auto hook).
fetch_one barchart_futures_intraday || FAIL=1
# Belt-and-suspenders: rebuild curve from newest drop CSV even if fetch was partial.
if python3 scripts/refresh_barchart_curve_from_watchlist.py; then
  echo "curve_refresh_ok"
else
  echo "WARN: curve refresh skipped — no usable watchlist CSV in drop"
fi

for kid in koyfin_import_core koyfin_flows_global koyfin_rates koyfin_china koyfin_equities; do
  if python3 - <<PY
from whinfell_pipeline.auto_download.adapters.koyfin import validate_koyfin_target
from whinfell_pipeline.auto_download.manifest import load_core_exports
kid = "$kid"
targets, _ = load_core_exports()
target = next((t for t in targets if t.id == kid), None)
if target and validate_koyfin_target(target)[0]:
    raise SystemExit(0)
raise SystemExit(1)
PY
  then
    fetch_one "$kid" || FAIL=1
  else
    echo "SKIP $kid — paste WTM Watchlist (/myw/) or Chart (/charts/) URL into desk_urls.yaml wired_url"
  fi
done

echo ""
python3 run_auto_download.py --drop "$DROP" status || true

if [[ "$CHAIN" == "1" ]]; then
  echo ""
  echo "--- pipeline chain ---"
  if python3 run_auto_download.py --drop "$DROP" daily --chain; then
    echo "chain_ok"
    echo ""
    echo "--- desk data publish ---"
    if bash scripts/sync_live_desk_data.sh; then
      echo "desk_publish_ok"
    else
      echo "WARN: desk data publish incomplete — curve or hydration may be missing for BasisWatch"
      FAIL=1
    fi
  else
    echo "chain_pending — add missing CSVs to $DROP and re-run with --chain"
    FAIL=1
  fi
else
  echo "chain_skipped WHINFELL_MORNING_CHAIN=$CHAIN"
fi

exit "$FAIL"