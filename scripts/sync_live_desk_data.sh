#!/usr/bin/env bash
# Post-chain publish — atomic hydration + Barchart curve into TC docs/data and optional dist/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0") && pwd)"

HYDRATION_OK=0
CURVE_OK=0
DIST_SYNC_OK=0

atomic_mirror_json() {
  # atomic_mirror_json SRC DEST — same-dir temp + mv; keep prior DEST on failure
  local src="$1"
  local dest="$2"
  python3 - "$src" "$dest" <<'PY'
import json, os, sys
from pathlib import Path

src = Path(sys.argv[1])
dest = Path(sys.argv[2])
if not src.is_file():
    raise SystemExit(f"missing src {src}")
# Validate JSON before swap
json.loads(src.read_text(encoding="utf-8"))
dest.parent.mkdir(parents=True, exist_ok=True)
tmp = dest.with_name(f"{dest.name}.tmp.{os.getpid()}")
try:
    tmp.write_bytes(src.read_bytes())
    os.replace(tmp, dest)
except Exception:
    if tmp.is_file():
        try:
            tmp.unlink()
        except OSError:
            pass
    raise
print(f"atomic_mirror_ok src={src} dest={dest}")
PY
}

if bash "$SCRIPT_DIR/copy_hydration_bundle.sh"; then
  HYDRATION_OK=1
  echo "hydration_copy_ok"
  if python3 "$ROOT/scripts/enrich_hydration_rv.py"; then
    echo "rv_enrich_ok"
  else
    echo "WARN: rv enrich failed — BBDM series may be stale; published unenriched Cousins copy kept" >&2
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

# Mirror docs → dist only when hydration publish succeeded (enriched preferred).
# On enrich failure we still have a validated Cousins copy in docs/data from copy step;
# mirror only when docs file exists AND copy step ran (HYDRATION_OK or docs present after copy).
if [[ -d "$ROOT/dist" ]]; then
  mkdir -p "$ROOT/dist/data/hydration" "$ROOT/dist/data/barchart/v1"
  if [[ -f "$ROOT/docs/data/hydration/latest.json" ]] && [[ "$HYDRATION_OK" -eq 1 || -f "$ROOT/docs/data/hydration/latest.json" ]]; then
    # Always atomic-mirror docs hydration when present so dist stays readable;
    # prefer after successful enrich (HYDRATION_OK=1). If enrich failed, still
    # mirror the validated (unenriched) publish so desk is not stuck on older dist.
    if atomic_mirror_json \
      "$ROOT/docs/data/hydration/latest.json" \
      "$ROOT/dist/data/hydration/latest.json"; then
      DIST_SYNC_OK=1
    fi
  fi
  if [[ -f "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" ]]; then
    if atomic_mirror_json \
      "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" \
      "$ROOT/dist/data/barchart/v1/barchart_curve_history.json"; then
      atomic_mirror_json \
        "$ROOT/docs/data/barchart/v1/barchart_curve_history.json" \
        "$ROOT/dist/data/barchart/barchart_curve_history.json" 2>/dev/null || true
      DIST_SYNC_OK=1
      echo "curve_dist_sync_ok"
    fi
  fi
  if [[ "$DIST_SYNC_OK" -eq 1 ]]; then
    echo "dist_sync_ok root=$ROOT/dist"
  fi
fi

echo "sync_live_desk_data hydration=$HYDRATION_OK curve=$CURVE_OK dist=$DIST_SYNC_OK"

if [[ "$HYDRATION_OK" -eq 0 && "$CURVE_OK" -eq 0 ]]; then
  exit 1
fi
exit 0
