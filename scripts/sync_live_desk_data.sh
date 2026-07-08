#!/usr/bin/env bash
# Post-chain publish — copy hydration + Barchart curve into TC docs/data and optional dist/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

HYDRATION_OK=0
CURVE_OK=0
DIST_SYNC_OK=0

if bash "$SCRIPT_DIR/copy_hydration_bundle.sh"; then
  HYDRATION_OK=1
  echo "hydration_copy_ok"
  if python3 "$ROOT/scripts/enrich_hydration_rv.py"; then
    echo "rv_enrich_ok"
  else
    echo "WARN: rv enrich failed — BBDM series may be stale" >&2
    HYDRATION_OK=0
  fi
else
  echo "WARN: hydration copy failed" >&2
fi

if bash "$SCRIPT_DIR/copy_barchart_curve_bundle.sh"; then
  CURVE_OK=1
  echo "curve_copy_ok"
else
  echo "WARN: barchart curve copy failed" >&2
fi

if [[ -d "$ROOT/dist" ]]; then
  mkdir -p "$ROOT/dist/data/hydration" "$ROOT/dist/data/barchart/v1"
  if [[ -f "$ROOT/docs/data/hydration/latest.json" ]]; then
    cp "$ROOT/docs/data/hydration/latest.json" "$ROOT/dist/data/hydration/latest.json"
  fi
  if [[ -f "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" ]]; then
    cp "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" \
      "$ROOT/dist/data/barchart/v1/barchart_curve_history.json"
    cp "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" \
      "$ROOT/dist/data/barchart/barchart_curve_history.json" 2>/dev/null || \
      cp "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" \
        "$ROOT/dist/data/barchart/barchart_curve_history.json"
  fi
  DIST_SYNC_OK=1
  echo "dist_sync_ok root=$ROOT/dist"
fi

echo "sync_live_desk_data hydration=$HYDRATION_OK curve=$CURVE_OK dist=$DIST_SYNC_OK"

if [[ "$HYDRATION_OK" -eq 0 && "$CURVE_OK" -eq 0 ]]; then
  exit 1
fi
exit 0