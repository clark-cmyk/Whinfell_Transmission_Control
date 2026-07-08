# Whinfell Transmission Control — User Guide v1.5

**Date:** July 7, 2026  
**Console build:** `1.5-BUILD-COUSINS-2026-07-04-PHASE23`  
**Hydration bundle:** `1.3.0` · **Bang Bang Da:** `1.2.0` · **Desk ops:** `1.0-DESK-OPS-2026-07-07`  
**Repo:** [github.com/clark-cmyk/Whinfell_Transmission_Control](https://github.com/clark-cmyk/Whinfell_Transmission_Control)

---

## 1. What this is

Modular operator console for the Whinfell transmission ladder. Disaggregated from the legacy monolith into `index.html` + `css/` + `js/`.

| Module | Where | Script |
|--------|-------|--------|
| Node cockpits (5) | Scan / Iterate layers | `js/core.js` |
| Transmission Signal Radar | Scan layer | `js/transmission_radar.js` |
| BasisWatch | Dig layer · standalone | `js/basis_watch_panel.js` |
| Midwest Compute Crush | Dig layer · standalone | `midwest_compute/` · `js/wmc_ia_panel.js` |
| IA shell (Scan · Dig · Iterate) | Left rail + center canvas | `js/console_ia_shell.js` |
| **Desk data ops** | Header + all standalone tools | `js/desk_data_ops.js` |
| Auto collect | Wired by desk ops | `js/auto_collect_panel.js` |
| AI Compute / v1.5 Desk | Legacy tabs | `js/ai_compute_panel.js` · `js/v15_desk_panel.js` |
| **Bang Bang Da Machine** | Specialized tools · standalone | `bang_bang_da_machine.html` |
| **Ladder deep dive** | Specialized tools · KPI band link | `whinfell-transmission-ladder-deep-dive.html` |

**Pipeline source:** `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`

---

## 2. Open the desk

### Local (recommended)

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

### GitHub Pages

| URL | Notes |
|-----|-------|
| `https://clark-cmyk.github.io/Whinfell_Transmission_Control/` | Primary — private repo needs GitHub Pro + Pages |
| `https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/` | Public fallback |

Hydration auto-loads from `data/hydration/latest.json` on HTTP (skipped on `file://`).

**Standalone tools (same site):** `/Whinfell_BasisWatch.html` · `/Whinfell_Midwest_Compute_Crush.html` · `/Crypto_Analytics.html` · `/bang_bang_da_machine.html` · `/whinfell-transmission-ladder-deep-dive.html`

---

## 3. Console layout (IA shell)

| Layer | Purpose |
|-------|---------|
| **Scan** | Transmission Signal Radar + node cockpit overview |
| **Dig** | BasisWatch or Midwest Compute Crush (full-panel depth) |
| **Iterate** | Radar + BasisWatch strip + cockpit for refinement |

**Left rail**

| Section | Contents |
|---------|----------|
| Console layer | Scan · Dig · Iterate tabs |
| **Specialized tools** | BasisWatch · Midwest Compute Crush · Bang Bang Da ↗ · Ladder deep dive ↗ |
| Risk curve | Five node rail (dynamic) |

Specialized tools sits above the scrollable risk-curve list (sticky ~⅓ from bottom) so it stays visible.

---

## 4. Desk data ops — two buttons everywhere

All tools share the same controls. No per-panel Collect or Refresh buttons.

| Button | ID | Action |
|--------|-----|--------|
| **Collect CSVs** | `btnMorningCollect` | Barchart + Koyfin CSV fetch → `whinfell_drop` → hydrate chain (collect agent `:8767`) |
| **Refresh data** | `btnDeskRefresh` | Reload hydration, BasisWatch curve, Midwest Compute, console panels, and tool surfaces |

**Transmission Control:** both buttons in the header utility strip (top right).

**Standalone pages:** shared ops bar under the page title — Collect CSVs · Refresh data · ← Transmission Control.

### Collect agent (local)

```bash
python3 scripts/whinfell_collect_agent.py
# or: open scripts/Whinfell_Morning_Collect.command
```

Agent status chip in header shows online/offline. Offline → click for start command.

### What Refresh data reloads

1. `data/hydration/latest.json` (console + WMC)
2. `data/barchart/v1/barchart_curve_history.json` (BasisWatch)
3. `renderAll()` + radar/KPI strips (console)
4. `whinfell-desk-refresh` event (Bang Bang Da report, Crypto Analytics charts, etc.)

**Pages-only users:** Refresh re-fetches the published bundle; Collect requires local agent + publish (`bash scripts/publish_ghpages.sh`).

### Manual sync (Clark)

```bash
bash scripts/sync_live_desk_data.sh   # copy fresh curve + hydration into repo
bash scripts/publish_ghpages.sh       # push to team URL
```

---

## 5. Morning workflow

### One-click (desk)

| Step | Action |
|------|--------|
| 1 | Start collect agent (if not running) |
| 2 | Click **Collect CSVs** — wait for completion toast |
| 3 | Click **Refresh data** |
| 4 | Review tracer suggestions → **Accept** → **Save State** |
| 5 | Optional: **Publish Web** for team Pages |

### Manual chain (pipeline repo)

| Step | Action |
|------|--------|
| 1 | CSVs → `~/Downloads/whinfell_drop` |
| 2 | `cd ~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` |
| 3 | `bash scripts/normalize_whinfell_drop.sh ~/Downloads/whinfell_drop` |
| 4 | `python3 -m whinfell_pipeline.hydrate -o data/hydration/latest.json` |
| 5 | `bash ~/Desktop/Whinfell_Transmission_Control/scripts/sync_live_desk_data.sh` |
| 6 | In TC: **Refresh data** (or Import hydration on `file://`) |

**After hydrate (BBDM):** `python3 scripts/enrich_hydration_rv.py` — adds `rv_history` + ETH calendar to bundle.

Optional Excel: `python3 scripts/export_hydration_xlsx.py` → `08_Deliverables/Whinfell_Hydration_v15.xlsx`

---

## 6. Specialized tools

| Tool | Open from console | Standalone URL |
|------|-------------------|--------------|
| BasisWatch | Specialized tools → BasisWatch (Dig layer) | `/Whinfell_BasisWatch.html` |
| Midwest Compute Crush | Specialized tools → Midwest Crush | `/Whinfell_Midwest_Compute_Crush.html` |
| Bang Bang Da | Specialized tools → Bang Bang Da ↗ | `/bang_bang_da_machine.html` |
| Ladder deep dive | Specialized tools → Ladder deep dive ↗ · KPI band link | `/whinfell-transmission-ladder-deep-dive.html` |

BasisWatch pop-out: **Open in focus view** in Dig panel header.

---

## 7. BasisWatch

CME-style crypto futures basis and implied rate. Curve from `data/barchart/v1/barchart_curve_history.json`; spot from hydration `crypto_sleeve`.

| Control | Location |
|---------|----------|
| Collect / Refresh | Header or standalone ops bar only |
| Export CSV / PNG | BasisWatch panel toolbar (export current view — not source download) |
| Asset / view / roll | Panel header (BTC/ETH · Basis/Implied · roll logic) |

Empty curve → run **Collect CSVs**, then **Refresh data**. On Pages, curve is static until publish.

---

## 8. Bang Bang Da Machine

RV Z-score scanner — five trades, verdicts **BANG** / **WATCH** / **PASS** / **BLOCKED** (gate &lt; 50).

```bash
open scripts/Bang_Bang_Da.command
```

| Step | Command |
|------|---------|
| Enrich | `python3 scripts/enrich_hydration_rv.py` |
| Score | `python3 bang_bang_da_calculator.py -w 60` |
| API (window selector) | `python3 scripts/bang_bang_da_server.py` → `:8766` |
| UI | `http://127.0.0.1:8765/bang_bang_da_machine.html` |

**Refresh data** reloads the static report JSON. Live window changes need API on `:8766`.

Schema: `bang_bang_da/README.md`

---

## 9. Hydration v1.3.0 blocks

Required: `node_cockpits`, `cockpit_context`, `global`, `china`, `suggested_tracer`.

| Key | UI |
|-----|-----|
| `ai_compute` | AI Compute tab |
| `corporate_credit` · `trade_tracker` · `btc_attribution` · `margin_rules` | v1.5 Desk |
| `rv_history` | Bang Bang Da + basis charts |

---

## 10. Legacy console tabs

| Tab | Purpose |
|-----|---------|
| Prompts | Perplexity / Grok operator prompts |
| Risk | Gross risk, posture, handover |
| Tracer | Hybrid signal tracer (confirm required) |
| Scenario | Session-only what-if |
| AI Compute | H200 curve, MISO power, crush trade |
| v1.5 Desk | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |

---

## 11. Publish to GitHub

```bash
bash scripts/publish_ghpages.sh
```

See `BEST_PRACTICES.md` — never `git add -A`.

---

## 12. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank desk on Pages | Enable Pages or use local server |
| Collect does nothing | Start collect agent on `:8767` |
| Refresh shows stale data | Run Collect first, or `sync_live_desk_data.sh` + publish |
| BasisWatch empty curve | Collect → Refresh; check `data/barchart/v1/barchart_curve_history.json` |
| Ladder deep dive 404 | Use root URL `/whinfell-transmission-ladder-deep-dive.html` (not `docs/` only) |
| BBDM window no-op | `bang_bang_da_server.py` on `:8766` |
| BBDM DATA_GAP (ETH) | `enrich_hydration_rv.py` after hydrate |
| Import blocked | Confirm `lineage_hash`; Shift+click Import to force |
| Diagnostics | Console: `renderVisualizationDiagnostics()` |

---

## 13. Related docs

- `documentation/Whinfell_Quick_Reference_v1.5.md`
- `documentation/DATA_DICTIONARY_v1.5.md`
- `documentation/DESK_URLS.md`
- `bang_bang_da/README.md`