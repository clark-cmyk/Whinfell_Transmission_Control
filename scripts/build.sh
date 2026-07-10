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
cp "${ROOT}/css/console_ia.css" "$OUT/css/console_ia.css"
cp "${ROOT}/css/transmission_radar.css" "$OUT/css/transmission_radar.css"
cp "${ROOT}/js/bootstrap.js" "$OUT/js/bootstrap.js"
# Chunk 26/29 — theme + TradingView Lightweight Charts (offline vendor)
[[ -f "${ROOT}/js/theme.js" ]] && cp "${ROOT}/js/theme.js" "$OUT/js/theme.js"
[[ -f "${ROOT}/js/time_format.js" ]] && cp "${ROOT}/js/time_format.js" "$OUT/js/time_format.js"
[[ -f "${ROOT}/css/theme.css" ]] && cp "${ROOT}/css/theme.css" "$OUT/css/theme.css"
mkdir -p "$OUT/js/vendor" "$OUT/js/charts"
[[ -f "${ROOT}/js/vendor/lightweight-charts.standalone.production.js" ]] \
  && cp "${ROOT}/js/vendor/lightweight-charts.standalone.production.js" "$OUT/js/vendor/"
[[ -f "${ROOT}/js/charts/lwc_factory.js" ]] \
  && cp "${ROOT}/js/charts/lwc_factory.js" "$OUT/js/charts/lwc_factory.js"
# The Ark + Articulate (SSOT data layer + intelligence; all four required)
cp "${ROOT}/js/ark.js" "$OUT/js/ark.js"
cp "${ROOT}/js/ark_ia_panel.js" "$OUT/js/ark_ia_panel.js"
cp "${ROOT}/js/articulate.js" "$OUT/js/articulate.js"
cp "${ROOT}/js/a_ia_panel.js" "$OUT/js/a_ia_panel.js"
cp "${ROOT}/js/core.js" "$OUT/js/core.js"
cp "${ROOT}/js/desk_china_ladder_models.js" "$OUT/js/desk_china_ladder_models.js"
[[ -f "${ROOT}/js/desk_chart_links.js" ]] && cp "${ROOT}/js/desk_chart_links.js" "$OUT/js/desk_chart_links.js"
[[ -f "${ROOT}/js/desk_china_chart_links.js" ]] && cp "${ROOT}/js/desk_china_chart_links.js" "$OUT/js/desk_china_chart_links.js"
cp "${ROOT}/css/ai_compute.css" "$OUT/css/ai_compute.css"
cp "${ROOT}/js/ai_compute_data.js" "$OUT/js/ai_compute_data.js"
cp "${ROOT}/js/ai_compute_panel.js" "$OUT/js/ai_compute_panel.js"
cp "${ROOT}/css/ui_polish.css" "$OUT/css/ui_polish.css"
cp "${ROOT}/css/v15_desk.css" "$OUT/css/v15_desk.css"
cp "${ROOT}/js/v15_desk_data.js" "$OUT/js/v15_desk_data.js"
cp "${ROOT}/js/v15_desk_panel.js" "$OUT/js/v15_desk_panel.js"
cp "${ROOT}/css/basis_watch.css" "$OUT/css/basis_watch.css"
cp "${ROOT}/css/desk_ops.css" "$OUT/css/desk_ops.css"
cp "${ROOT}/js/basis_watch_analytics.js" "$OUT/js/basis_watch_analytics.js"
cp "${ROOT}/js/basis_watch_panel.js" "$OUT/js/basis_watch_panel.js"
cp "${ROOT}/js/ui_polish.js" "$OUT/js/ui_polish.js"
cp "${ROOT}/js/desk_data_ops.js" "$OUT/js/desk_data_ops.js"
cp "${ROOT}/js/auto_collect_panel.js" "$OUT/js/auto_collect_panel.js"
cp "${ROOT}/js/data_states.js" "$OUT/js/data_states.js"
cp "${ROOT}/js/command_bar_kpis.js" "$OUT/js/command_bar_kpis.js"
cp "${ROOT}/js/scan_kpi_strip.js" "$OUT/js/scan_kpi_strip.js"
cp "${ROOT}/js/top_utility_registry.js" "$OUT/js/top_utility_registry.js"
cp "${ROOT}/js/signal_detail_copy.js" "$OUT/js/signal_detail_copy.js"
cp "${ROOT}/js/transmission_radar.js" "$OUT/js/transmission_radar.js"
cp "${ROOT}/js/task_force_panel_feed.js" "$OUT/js/task_force_panel_feed.js"
cp "${ROOT}/js/commentary_feed.js" "$OUT/js/commentary_feed.js"
cp "${ROOT}/js/data_dictionary_panel.js" "$OUT/js/data_dictionary_panel.js"
cp "${ROOT}/js/console_ia_shell.js" "$OUT/js/console_ia_shell.js"
cp "${ROOT}/js/shell_shortcuts.js" "$OUT/js/shell_shortcuts.js"
cp "${ROOT}/js/wmc_ia_panel.js" "$OUT/js/wmc_ia_panel.js"
cp "${ROOT}/js/publish_web_panel.js" "$OUT/js/publish_web_panel.js"
# BBDM + desk ops companions used by Bang Bang Da page
[[ -f "${ROOT}/css/bbdm_ia.css" ]] && cp "${ROOT}/css/bbdm_ia.css" "$OUT/css/bbdm_ia.css"
[[ -f "${ROOT}/js/bbdm_litmus_table.js" ]] && cp "${ROOT}/js/bbdm_litmus_table.js" "$OUT/js/bbdm_litmus_table.js"
[[ -f "${ROOT}/js/bbdm_ia_shell.js" ]] && cp "${ROOT}/js/bbdm_ia_shell.js" "$OUT/js/bbdm_ia_shell.js"
[[ -f "${ROOT}/Whinfell_BasisWatch.html" ]] && cp "${ROOT}/Whinfell_BasisWatch.html" "$OUT/"
# Chunk 18 — Bang Bang Da page + static report (Ark bbdm_report path)
[[ -f "${ROOT}/bang_bang_da_machine.html" ]] && cp "${ROOT}/bang_bang_da_machine.html" "$OUT/bang_bang_da_machine.html"
if [[ -d "${ROOT}/bang_bang_da" ]]; then
  mkdir -p "$OUT/bang_bang_da/litmus"
  [[ -f "${ROOT}/bang_bang_da/bang_bang_da_report.json" ]] && cp "${ROOT}/bang_bang_da/bang_bang_da_report.json" "$OUT/bang_bang_da/"
  [[ -f "${ROOT}/bang_bang_da/README.md" ]] && cp "${ROOT}/bang_bang_da/README.md" "$OUT/bang_bang_da/" 2>/dev/null || true
  # Coinglass / litmus stubs (Ark coinglass_perp + BBDM Litmus)
  if [[ -d "${ROOT}/bang_bang_da/litmus" ]]; then
    cp "${ROOT}/bang_bang_da/litmus/"*.json "$OUT/bang_bang_da/litmus/" 2>/dev/null || true
  fi
  echo "==> Copied bang_bang_da/ (report + litmus)"
fi
# Standalone tool pages (major desk surfaces)
for PAGE in Whinfell_Midwest_Compute_Crush.html Crypto_Analytics.html; do
  [[ -f "${ROOT}/${PAGE}" ]] && cp "${ROOT}/${PAGE}" "$OUT/${PAGE}" && echo "==> Copied ${PAGE}"
done
for DIR in midwest_compute crypto_analytics; do
  if [[ -d "${ROOT}/${DIR}" ]]; then
    rm -rf "$OUT/${DIR}"
    cp -R "${ROOT}/${DIR}" "$OUT/${DIR}"
    echo "==> Copied ${DIR}/"
  fi
done

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
  "${ROOT}/docs/data/hydration/latest.json" \
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
  "${ROOT}/docs/data/hydration/hydration_log.json" \
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

# Barchart curve for BasisWatch (parity with build_desk_preview.sh)
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
elif [[ -f "${ROOT}/docs/data/barchart/v1/barchart_curve_history.json" ]]; then
  mkdir -p "$OUT/data/barchart/v1" "$OUT/data/barchart"
  cp "${ROOT}/docs/data/barchart/v1/barchart_curve_history.json" "$OUT/data/barchart/v1/"
  cp "${ROOT}/docs/data/barchart/v1/barchart_curve_history.json" "$OUT/data/barchart/"
  echo "==> Copied barchart curve from docs"
fi

# Post-build verify
for req in \
  index.html \
  css/main.css \
  css/console_ia.css \
  css/transmission_radar.css \
  js/bootstrap.js \
  js/theme.js \
  js/vendor/lightweight-charts.standalone.production.js \
  js/charts/lwc_factory.js \
  js/ark.js \
  js/ark_ia_panel.js \
  js/articulate.js \
  js/a_ia_panel.js \
  bang_bang_da_machine.html \
  bang_bang_da/bang_bang_da_report.json \
  js/core.js \
  js/desk_china_ladder_models.js \
  js/data_states.js \
  js/command_bar_kpis.js \
  js/scan_kpi_strip.js \
  js/top_utility_registry.js \
  js/signal_detail_copy.js \
  js/transmission_radar.js \
  js/commentary_feed.js \
  js/data_dictionary_panel.js \
  js/console_ia_shell.js \
  js/shell_shortcuts.js \
  js/wmc_ia_panel.js \
  js/publish_web_panel.js \
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
  js/auto_collect_panel.js \
  js/task_force_panel_feed.js \
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

grep -q 'WTM_ScanKpiStrip' "$OUT/js/scan_kpi_strip.js" || {
  echo "build: WTM_ScanKpiStrip missing" >&2
  exit 1
}

grep -q 'WTM_TransmissionRadar' "$OUT/js/transmission_radar.js" || {
  echo "build: WTM_TransmissionRadar missing" >&2
  exit 1
}

grep -q 'WTM_CommentaryFeed' "$OUT/js/commentary_feed.js" || {
  echo "build: WTM_CommentaryFeed missing" >&2
  exit 1
}

grep -q 'WTM_IaShell' "$OUT/js/console_ia_shell.js" || {
  echo "build: WTM_IaShell missing" >&2
  exit 1
}

grep -q 'wtm-ia-shell' "$OUT/index.html" || {
  echo "build: IA shell markup missing from index.html" >&2
  exit 1
}

grep -q 'WTM_Ark' "$OUT/js/ark.js" || {
  echo "build: WTM_Ark missing from ark.js" >&2
  exit 1
}

grep -q 'WTM_ArkIaPanel' "$OUT/js/ark_ia_panel.js" || {
  echo "build: WTM_ArkIaPanel missing from ark_ia_panel.js" >&2
  exit 1
}

grep -q 'WTM_Articulate' "$OUT/js/articulate.js" || {
  echo "build: WTM_Articulate missing from articulate.js" >&2
  exit 1
}

grep -q 'WTM_AIaPanel' "$OUT/js/a_ia_panel.js" || {
  echo "build: WTM_AIaPanel missing from a_ia_panel.js" >&2
  exit 1
}

grep -q 'js/ark.js' "$OUT/index.html" || {
  echo "build: index.html missing js/ark.js script tag" >&2
  exit 1
}

grep -q 'js/ark_ia_panel.js' "$OUT/index.html" || {
  echo "build: index.html missing js/ark_ia_panel.js script tag" >&2
  exit 1
}

grep -q 'js/articulate.js' "$OUT/index.html" || {
  echo "build: index.html missing js/articulate.js script tag" >&2
  exit 1
}

grep -q 'js/a_ia_panel.js' "$OUT/index.html" || {
  echo "build: index.html missing js/a_ia_panel.js script tag" >&2
  exit 1
}

echo "==> Build complete: $OUT"
ls -la "$OUT" "$OUT/css" "$OUT/js" "$OUT/data/hydration"