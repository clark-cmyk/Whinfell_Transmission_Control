#!/usr/bin/env bash
# Full static site for GitHub Pages — console + standalone tools + BUILD_MANIFEST.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/dist"
REPO_SLUG="clark-cmyk/Whinfell_Transmission_Control"
PAGES_URL="https://clark-cmyk.github.io/Whinfell_Transmission_Control/"

echo "==> build_web: Whinfell Transmission Control (GitHub Pages bundle)"
bash "${ROOT}/scripts/build_desk_preview.sh"

# Standalone desk tools
for PAGE in Whinfell_Midwest_Compute_Crush.html Crypto_Analytics.html Whinfell_BasisWatch.html bang_bang_da_machine.html whinfell-transmission-ladder-deep-dive.html; do
  if [[ -f "${ROOT}/${PAGE}" ]]; then
    cp "${ROOT}/${PAGE}" "$OUT/${PAGE}"
    echo "==> Copied ${PAGE}"
  fi
done

# Bang Bang Da report (static fallback for Pages)
if [[ -d "${ROOT}/bang_bang_da" ]]; then
  mkdir -p "$OUT/bang_bang_da"
  cp "${ROOT}/bang_bang_da/bang_bang_da_report.json" "$OUT/bang_bang_da/" 2>/dev/null || true
  cp "${ROOT}/bang_bang_da/README.md" "$OUT/bang_bang_da/" 2>/dev/null || true
  echo "==> Copied bang_bang_da/"
fi

# Asset directories for standalone tools
for DIR in midwest_compute crypto_analytics; do
  if [[ -d "${ROOT}/${DIR}" ]]; then
    rm -rf "$OUT/${DIR}"
    cp -R "${ROOT}/${DIR}" "$OUT/${DIR}"
    echo "==> Copied ${DIR}/"
  fi
done

# GitHub Pages SPA / deep-link fallback
if [[ -f "$OUT/index.html" ]]; then
  cp "$OUT/index.html" "$OUT/404.html"
  echo "==> Copied 404.html"
fi

# BUILD_MANIFEST.json — surfaced as "Last Updated" on web
PUBLISHED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BUILD_ID="$(grep -o "TC_CONSOLE_BUILD = '[^']*'" "${ROOT}/js/core.js" | head -1 | sed "s/.*'\([^']*\)'.*/\1/" || echo "unknown")"
HYDRATION_VERSION="missing"
if [[ -f "$OUT/data/hydration/latest.json" ]]; then
  HYDRATION_VERSION="$(python3 - "$OUT/data/hydration/latest.json" <<'PY'
import json, sys
try:
    with open(sys.argv[1], encoding="utf-8") as f:
        d = json.load(f)
    print(d.get("hydration_version") or d.get("bundle_version") or "unknown")
except Exception:
    print("unknown")
PY
)"
fi

python3 - <<PY
import json
manifest = {
    "repo": "${REPO_SLUG}",
    "pages_url": "${PAGES_URL}",
    "published_at": "${PUBLISHED_AT}",
    "hydration_version": "${HYDRATION_VERSION}",
    "build_id": "${BUILD_ID}",
}
with open("${OUT}/BUILD_MANIFEST.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
print("==> Wrote BUILD_MANIFEST.json")
PY

# Post-build verify — web bundle completeness
for req in \
  index.html \
  404.html \
  BUILD_MANIFEST.json \
  Whinfell_Midwest_Compute_Crush.html \
  Crypto_Analytics.html \
  Whinfell_BasisWatch.html \
  bang_bang_da_machine.html \
  whinfell-transmission-ladder-deep-dive.html \
  js/desk_chart_links.js \
  js/desk_china_chart_links.js \
  js/theme.js \
  js/vendor/lightweight-charts.standalone.production.js \
  js/charts/lwc_factory.js \
  midwest_compute/wmc.css \
  midwest_compute/wmc-boot.js \
  crypto_analytics/ca.css \
  crypto_analytics/ca-app.js \
  js/wmc_ia_panel.js \
  js/publish_web_panel.js \
  js/ark.js \
  js/ark_ia_panel.js \
  js/articulate.js \
  js/a_ia_panel.js \
  data/hydration/latest.json \
  .nojekyll; do
  if [[ ! -f "$OUT/$req" ]]; then
    echo "build_web: missing required output: $OUT/$req" >&2
    exit 1
  fi
done

echo "==> build_web OK → $OUT"
cat "$OUT/BUILD_MANIFEST.json"