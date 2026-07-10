#!/usr/bin/env bash
# Full desk preview build — copies all assets, optional inlining, BUILD_STAMP.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/dist"
ARCHIVE="${ROOT}/../Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE"

echo "==> build_desk_preview: Whinfell Transmission Control"
bash "${ROOT}/scripts/build.sh"

# Extra root-level assets (Pages-relative paths)
[[ -f "${ROOT}/Whinfell_BasisWatch.html" ]] && cp "${ROOT}/Whinfell_BasisWatch.html" "$OUT/" && echo "==> Copied Whinfell_BasisWatch.html"
# basis_watch.css already in OUT/css/ from build.sh

# Barchart curve for BasisWatch
BARCHART="${ROOT}/data/barchart/v1/barchart_curve_history.json"
if [[ -f "$BARCHART" ]]; then
  mkdir -p "$OUT/data/barchart/v1" "$OUT/data/barchart"
  cp "$BARCHART" "$OUT/data/barchart/v1/barchart_curve_history.json"
  cp "$BARCHART" "$OUT/data/barchart/barchart_curve_history.json"
  echo "==> Copied barchart curve history"
elif [[ -f "${ARCHIVE}/data/barchart/v1/barchart_curve_history.json" ]]; then
  mkdir -p "$OUT/data/barchart/v1" "$OUT/data/barchart"
  cp "${ARCHIVE}/data/barchart/v1/barchart_curve_history.json" "$OUT/data/barchart/v1/"
  cp "${ARCHIVE}/data/barchart/v1/barchart_curve_history.json" "$OUT/data/barchart/"
  echo "==> Copied barchart curve from archive"
fi

# Verify all desk assets (relative paths from site root)
for req in \
  index.html css/main.css css/ai_compute.css css/ui_polish.css css/basis_watch.css \
  js/bootstrap.js js/core.js js/desk_china_ladder_models.js \
  js/theme.js js/vendor/lightweight-charts.standalone.production.js js/charts/lwc_factory.js \
  js/ark.js js/ark_ia_panel.js js/articulate.js js/a_ia_panel.js \
  js/basis_watch_analytics.js js/basis_watch_panel.js \
  js/ai_compute_data.js js/ai_compute_panel.js js/v15_desk_data.js js/v15_desk_panel.js js/ui_polish.js \
  css/v15_desk.css \
  data_dictionary_meta.json data/hydration/latest.json Whinfell_BasisWatch.html; do
  [[ -f "$OUT/$req" ]] || { echo "build_desk_preview: missing $OUT/$req" >&2; exit 1; }
done

# Optional: inline support JS into index.html for Pages 404 hardening
if [[ "${INLINE_ASSETS:-0}" == "1" ]]; then
  echo "==> Inlining support scripts into index.html..."
  python3 << PYEOF
import os, re
out = "${OUT}"
index_path = os.path.join(out, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()
for label in ["desk_china_ladder_models.js", "basis_watch_analytics.js", "basis_watch_panel.js", "ai_compute_data.js", "ai_compute_panel.js", "ui_polish.js"]:
    p = os.path.join(out, "js", label)
    if not os.path.exists(p):
        continue
    with open(p, "r", encoding="utf-8") as f:
        js = f.read()
    inline = f'<script data-inlined="true" id="inlined-{label.split(".")[0]}">\\n{js}\\n</script>'
    html = html.replace(f'<script src="js/{label}"></script>', inline, 1)
with open(index_path, "w", encoding="utf-8") as f:
    f.write(html)
print("  inlined support scripts")
PYEOF
fi

# BUILD_STAMP
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT/BUILD_STAMP.txt"
grep -o "TC_CONSOLE_BUILD = '[^']*'" "${ROOT}/js/core.js" | head -1 >> "$OUT/BUILD_STAMP.txt"
grep -o "BW_BUILD = '[^']*'" "${ROOT}/js/basis_watch_panel.js" | head -1 >> "$OUT/BUILD_STAMP.txt" 2>/dev/null || true
echo "integration=ai_compute+basiswatch+ui_polish+v1.5_full" >> "$OUT/BUILD_STAMP.txt"

# Operator documentation (served on Pages under /documentation/)
if [[ -d "${ROOT}/documentation" ]]; then
  mkdir -p "$OUT/documentation"
  cp "${ROOT}/documentation/"*.md "$OUT/documentation/" 2>/dev/null || true
  echo "==> Copied documentation/*.md"
fi
[[ -f "${ROOT}/data_dictionary_meta.json" ]] && cp "${ROOT}/data_dictionary_meta.json" "$OUT/"

echo "==> build_desk_preview OK → $OUT"
cat "$OUT/BUILD_STAMP.txt"
du -sh "$OUT"