#!/usr/bin/env bash
# Build static output for local preview / GitHub Pages from disaggregated sources.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/dist"
ARCHIVE="${ROOT}/../Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE"

echo "==> Whinfell Transmission Control — build"
rm -rf "$OUT"
mkdir -p "$OUT/css" "$OUT/js" "$OUT/data/hydration"

cp "${ROOT}/index.html" "$OUT/index.html"
cp "${ROOT}/css/main.css" "$OUT/css/main.css"
cp "${ROOT}/js/bootstrap.js" "$OUT/js/bootstrap.js"
cp "${ROOT}/js/core.js" "$OUT/js/core.js"
cp "${ROOT}/js/desk_china_ladder_models.js" "$OUT/js/desk_china_ladder_models.js"
cp "${ROOT}/css/ai_compute.css" "$OUT/css/ai_compute.css"
cp "${ROOT}/js/ai_compute_data.js" "$OUT/js/ai_compute_data.js"
cp "${ROOT}/js/ai_compute_panel.js" "$OUT/js/ai_compute_panel.js"
cp "${ROOT}/css/ui_polish.css" "$OUT/css/ui_polish.css"
cp "${ROOT}/css/v15_desk.css" "$OUT/css/v15_desk.css"
cp "${ROOT}/js/v15_desk_data.js" "$OUT/js/v15_desk_data.js"
cp "${ROOT}/js/v15_desk_panel.js" "$OUT/js/v15_desk_panel.js"
cp "${ROOT}/css/basis_watch.css" "$OUT/css/basis_watch.css"
cp "${ROOT}/js/basis_watch_analytics.js" "$OUT/js/basis_watch_analytics.js"
cp "${ROOT}/js/basis_watch_panel.js" "$OUT/js/basis_watch_panel.js"
cp "${ROOT}/js/ui_polish.js" "$OUT/js/ui_polish.js"
[[ -f "${ROOT}/Whinfell_BasisWatch.html" ]] && cp "${ROOT}/Whinfell_BasisWatch.html" "$OUT/"

touch "$OUT/.nojekyll"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT/BUILD_STAMP.txt"
grep -o "TC_CONSOLE_BUILD = '[^']*'" "${ROOT}/js/core.js" | head -1 >> "$OUT/BUILD_STAMP.txt" 2>/dev/null || true

# Optional desk companion assets (repo root first, then cousins archive)
for ASSET in \
  "data_dictionary_meta.json" \
  "whinfell-transmission-ladder-deep-dive.html"; do
  for SRC in \
    "${ROOT}/${ASSET}" \
    "${ARCHIVE}/${ASSET}" \
    "${ARCHIVE}/08_Deliverables/${ASSET}" \
    "${ARCHIVE}/docs/${ASSET}"; do
    if [[ -f "$SRC" ]]; then
      cp "$SRC" "$OUT/${ASSET}"
      echo "==> Copied ${ASSET}: $SRC"
      break
    fi
  done
done

# Hydration bundle (local or sibling repo paths)
for HYDRATE in \
  "${ROOT}/data/hydration/latest.json" \
  "${ROOT}/../Whinfell_BUILD_Cousins/data/hydration/latest.json" \
  "${ARCHIVE}/data/hydration/latest.json"; do
  if [[ -f "$HYDRATE" ]]; then
    cp "$HYDRATE" "$OUT/data/hydration/latest.json"
    echo "==> Copied hydration: $HYDRATE"
    break
  fi
done

for HYDRATE_LOG in \
  "${ROOT}/data/hydration/hydration_log.json" \
  "${ARCHIVE}/data/hydration/hydration_log.json"; do
  if [[ -f "$HYDRATE_LOG" ]]; then
    cp "$HYDRATE_LOG" "$OUT/data/hydration/hydration_log.json"
    echo "==> Copied hydration log: $HYDRATE_LOG"
    break
  fi
done

if [[ ! -f "$OUT/data/hydration/latest.json" ]]; then
  echo '{"hydration_version":"0","validation_status":"missing"}' > "$OUT/data/hydration/latest.json"
  echo "==> WARN: no hydration bundle — UI-only build"
fi

# Post-build verify
for req in \
  index.html \
  css/main.css \
  js/bootstrap.js \
  js/core.js \
  js/desk_china_ladder_models.js \
  css/ai_compute.css \
  js/ai_compute_data.js \
  js/ai_compute_panel.js \
  css/ui_polish.css \
  css/basis_watch.css \
  js/basis_watch_analytics.js \
  js/basis_watch_panel.js \
  js/ui_polish.js \
  css/v15_desk.css \
  js/v15_desk_data.js \
  js/v15_desk_panel.js \
  data/hydration/latest.json \
  .nojekyll; do
  if [[ ! -f "$OUT/$req" ]]; then
    echo "build: missing required output: $OUT/$req" >&2
    exit 1
  fi
done

grep -q 'function renderAll' "$OUT/js/core.js" || {
  echo "build: renderAll missing from core.js" >&2
  exit 1
}

grep -q 'Transmission Control' "$OUT/index.html" || {
  echo "build: index.html missing expected content" >&2
  exit 1
}

echo "==> Build complete: $OUT"
ls -la "$OUT" "$OUT/css" "$OUT/js" "$OUT/data/hydration"