# Whinfell Transmission Control — User Guide v1.5

**Date:** July 3, 2026  
**Console build:** `1.5-BUILD-COUSINS-2026-07-03`  
**Hydration bundle:** `1.3.0`  
**Repo:** [github.com/clark-cmyk/Whinfell_Transmission_Control](https://github.com/clark-cmyk/Whinfell_Transmission_Control)

---

## 1. What this is

Modular operator console for the Whinfell transmission ladder. Disaggregated from the legacy monolith into `index.html` + `css/` + `js/`. Integrates:

| Module | Tab / zone | Script |
|--------|------------|--------|
| Node cockpits (5) | Main workspace | `js/core.js` |
| BasisWatch | Basis panel | `js/basis_watch_panel.js` |
| AI Compute / Architect Exchange | **AI Compute** tab | `js/ai_compute_panel.js` |
| v1.5 desk modules | **v1.5 Desk** tab | `js/v15_desk_panel.js` |
| UI polish + diagnostics | Global | `js/ui_polish.js` |

**Pipeline source:** `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` (hydrate, CSV chain, Excel export).

---

## 2. Open the desk

### Local (recommended)

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

### GitHub Pages (when enabled)

| URL | Status |
|-----|--------|
| `https://clark-cmyk.github.io/Whinfell_Transmission_Control/` | Primary — requires Pages on **private** repo (GitHub Pro) |
| `https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/` | Public fallback (cousins archive desk) |

Hydration auto-loads from `data/hydration/latest.json` on HTTP deploy (skipped on `file://`).

---

## 3. Directory layout (this repo)

```
Whinfell_Transmission_Control/
├── index.html              # Operator console markup
├── css/                    # main, basis_watch, ai_compute, v15_desk, ui_polish
├── js/                     # bootstrap, core, panels
├── documentation/          # User guide, data dictionary, quick reference
├── scripts/
│   ├── build.sh
│   ├── build_desk_preview.sh
│   └── publish.sh
├── docs/                   # Built Pages payload (from dist/) — do not edit by hand
├── data/hydration/         # Local symlink/copy to pipeline latest.json (gitignored)
└── data_dictionary_meta.json
```

**Pipeline repo (sibling):**

```
Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE/
├── whinfell_pipeline/hydrate.py
├── whinfell_pipeline/fetchers/     # v1.5 Ornn H200, MISO, blocks
├── data/hydration/latest.json
├── scripts/export_hydration_xlsx.py
└── dashboards/whinvis/v15_hydration_page.py
```

---

## 4. Morning workflow

| Step | Action |
|------|--------|
| 1 | Export CSVs to `~/Downloads/whinfell_drop` |
| 2 | `cd ~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` |
| 3 | `bash scripts/normalize_whinfell_drop.sh ~/Downloads/whinfell_drop` |
| 4 | `python3 run_csv_download.py daily --window 48h --overwrite --hydrate-output data/hydration/latest.json` |
| 5 | `python3 -m whinfell_pipeline.hydrate -o data/hydration/latest.json` |
| 6 | Open TC → **Import** hydration (or auto-hydrate on Pages) |
| 7 | Confirm **`lineage_hash`** · review **Suggested Tracer** · **Accept** · **Save State** |

Optional Excel: `python3 scripts/export_hydration_xlsx.py` → `08_Deliverables/Whinfell_Hydration_v15.xlsx`

---

## 5. Console tabs

| Tab | Purpose |
|-----|---------|
| Prompts | Perplexity / Grok operator prompts |
| Risk | Gross risk, posture, handover |
| Tracer | Hybrid signal tracer (confirm required) |
| Scenario | Session-only what-if |
| AI Compute | H200 forward curve, MISO power, crush trade |
| **v1.5 Desk** | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |

---

## 6. Hydration v1.3.0 blocks

Required (backward compatible with v1.2.0): `node_cockpits`, `cockpit_context`, `global`, `china`, `suggested_tracer`.

**v1.5 additive keys:**

| Key | Source | UI |
|-----|--------|-----|
| `ai_compute` | Ornn H200 + MISO fetchers | AI Compute tab |
| `corporate_credit` | Credit node cockpit RV | v1.5 Desk |
| `trade_tracker` | Pipeline desk trades | v1.5 Desk |
| `btc_attribution` | Suggested tracer + BTC bias | v1.5 Desk |
| `margin_rules` | Score-derived sizing tier | v1.5 Desk |

---

## 7. Publish to GitHub

```bash
cd ~/Desktop/Whinfell_Transmission_Control
git status -sb
bash scripts/publish.sh
```

See `BEST_PRACTICES.md` — never `git add -A`.

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank desk on Pages | Enable Pages (Settings → Pages → GitHub Actions) or use local server |
| 404 on TC Pages URL | Repo is private — enable Pro Pages or use BUILD_Cousins_v2 public URL |
| Import blocked | Confirm `lineage_hash` upgrade; Shift+click Import to force |
| v1.5 tab empty | Re-run hydrate v1.3; check bundle has `corporate_credit` etc. |
| Diagnostics | Browser console: `renderVisualizationDiagnostics()` |

---

## 9. Related docs

- `documentation/Whinfell_Quick_Reference_v1.5.md`
- `documentation/DATA_DICTIONARY_v1.5.md`
- `documentation/DESK_URLS.md`
- Archive: `08_Deliverables/Whinfell_Expanded_Operators_Guide_v1.5.md` (cousins repo)