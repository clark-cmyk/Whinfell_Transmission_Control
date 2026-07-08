# Whinfell Transmission Control — User Guide v1.5

**Date:** July 7, 2026  
**Console build:** `1.5-BUILD-COUSINS-2026-07-04-PHASE23` · **Phase:** 2.3  
**Hydration bundle:** `1.3.0` · **Bang Bang Da:** `1.2.0` · **Desk ops:** `1.0-DESK-OPS-2026-07-07`  
**Repo:** [github.com/clark-cmyk/Whinfell_Transmission_Control](https://github.com/clark-cmyk/Whinfell_Transmission_Control)

---

## 1. What this is

Modular operator console for the Whinfell transmission ladder. Disaggregated from the legacy monolith into `index.html` + `css/` + `js/`.

| Module | Where | Script |
|--------|-------|--------|
| Node cockpits (5) | Scan / Iterate layers | `js/core.js` |
| Transmission Signal Radar | Scan layer · widget grid | `js/transmission_radar.js` |
| BasisWatch | Dig layer · standalone | `js/basis_watch_panel.js` |
| Midwest Compute Crush | Dig layer · standalone | `midwest_compute/` · `js/wmc_ia_panel.js` |
| IA shell (TopShell + LeftNav + widget grid) | Global layout | `js/console_ia_shell.js` |
| **Keyboard shortcuts** | Top bar + left nav | `js/shell_shortcuts.js` |
| **Desk data ops** | Header + all standalone tools | `js/desk_data_ops.js` |
| Auto collect | Wired by desk ops | `js/auto_collect_panel.js` |
| **Publish Web** | Header (local only) | `js/publish_web_panel.js` |
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

## 3. Console layout (Phase 2.3 IA shell)

The desk uses a Koyfin-style shell: collapsible **TopShell**, collapsible **LeftNav**, and a central **widget grid**.

### 3.1 TopShell (top frame)

| Zone | Contents |
|------|----------|
| Identity | Title · Phase 2.3 badge · utility strip |
| Pipeline status | Freshness · import time · save state |
| Action row | Import hydration · Import WTM · Export · Pipeline bundle · Save · **Light/Dark mode** |

**Utility strip (right of title)**

| Control | Purpose |
|---------|---------|
| **Build** | Console build stamp — hard-refresh if stale |
| **DD** | Master Data Dictionary (GitHub) |
| **Docs** | In-app desk documentation panel |
| **Collect CSVs** | Morning CSV chain via collect agent |
| **Refresh** | Reload hydration + all desk surfaces |
| **Publish** | One-click gh-pages deploy (local only) |
| **Agent ●/○** | Collect agent online/offline (`127.0.0.1:8767`) |
| **Koyfin ↗** · **Barchart ↗** | External desk links |

**Collapse:** click **▾** on the top frame bar to hide the full header and leave a thin **pipeline status strip**. Collapse state persists for the session.

### 3.2 LeftNav (left rail)

| Section | Contents |
|---------|----------|
| **Views** | Risk Cockpit · Transmission Radar · HY OAS · Flipcharts · Ladders & Depth — scroll/focus matching widget in the grid |
| **Console layer** | Scan · Dig · Iterate tabs |
| **Specialized tools** | BasisWatch · Midwest Compute Crush · Bang Bang Da ↗ · Ladder deep dive ↗ |
| **Risk curve** | Compact summary of active node rail tab |

**Collapse:** click **‹** to switch to icon-only mode (RC · RD · HY · FL · DP abbreviations). Collapse state persists for the session.

### 3.3 Console layers

| Layer | Purpose |
|-------|---------|
| **Scan** | KPI strip + Transmission Signal Radar + node cockpit overview in widget grid |
| **Dig** | BasisWatch or Midwest Compute Crush (full-panel depth) |
| **Iterate** | Radar + BasisWatch strip + cockpit for refinement |

### 3.4 Widget grid (center canvas)

| Widget | Left-nav view shortcut |
|--------|------------------------|
| Risk Cockpit | Risk Cockpit |
| Risk Curve | Curve summary (risk curve section) |
| Transmission Signal Radar | Transmission Radar |
| HY OAS proxy | HY OAS |
| Flipchart | Flipcharts |
| Depth · Command bar & Ladders | Ladders & Depth |

Clicking a **Views** item scrolls to the widget, highlights the nav button, and briefly highlights the target card.

---

## 4. Keyboard shortcuts

Shortcuts are handled by `js/shell_shortcuts.js`. Hover any control with a shortcut — the tooltip shows the chord for your platform.

**Shortcuts are disabled while typing in inputs, textareas, or content-editable fields.**

### Windows / Linux

| Scope | Modifier | Keys |
|-------|----------|------|
| **Top utilities** | Alt+Shift | **B** Build · **D** Docs · **C** Collect CSVs · **R** Refresh · **P** Publish · **A** Agent |
| **Left nav views** | Alt | **R** Risk Cockpit · **T** Transmission Radar · **H** HY OAS · **F** Flipcharts · **L** Ladders |
| **Specialized tools** | Alt | **B** BasisWatch · **M** Midwest Compute Crush |

Top utilities use **Alt+Shift** so they do not collide with left-nav **Alt** chords (e.g. Build vs BasisWatch).

### macOS

On Mac, Option+letter can produce special characters. The shell matches the **physical key** (`event.code`) and also accepts the standard HTML accesskey chord:

| Scope | Mac chord | Same as |
|-------|-----------|---------|
| Top utilities | **⌃⌥⇧** + key (Ctrl+Option+Shift) | Alt+Shift on Windows |
| Left nav / tools | **⌃⌥** + key (Ctrl+Option) | Alt on Windows |

Plain **⌥+key** also works for nav/tools when the physical key is recognized.

**Build** is a badge (not a button) — its shortcut focuses and highlights the build stamp rather than running an action.

---

## 5. Desk data ops — shared buttons

All tools share the same Collect and Refresh controls. No per-panel Collect or Refresh buttons.

| Button | ID | Action |
|--------|-----|--------|
| **Collect CSVs** | `btnMorningCollect` | Barchart + Koyfin CSV fetch → `whinfell_drop` → hydrate chain (collect agent `:8767`) |
| **Refresh data** | `btnDeskRefresh` | Reload hydration, BasisWatch curve, Midwest Compute, console panels, and tool surfaces |

**Transmission Control:** both buttons in the TopShell utility strip.

**Standalone pages:** shared ops bar under the page title — Collect CSVs · Refresh data · ← Transmission Control.

### Collect agent (local)

```bash
python3 scripts/whinfell_collect_agent.py
# or: open scripts/Whinfell_Morning_Collect.command
```

Agent status chip (**Agent ●** online / **Agent ○** offline) sits in the utility strip. Offline → click for the start command (or use **Alt+Shift+A** / **⌃⌥⇧A** on Mac).

### What Refresh data reloads

1. `data/hydration/latest.json` (console + WMC)
2. `data/barchart/v1/barchart_curve_history.json` (BasisWatch)
3. `renderAll()` + radar/KPI strips (console)
4. `whinfell-desk-refresh` event (Bang Bang Da report, Crypto Analytics charts, etc.)

**Pages-only users:** Refresh re-fetches the published bundle; Collect requires local agent + publish.

### Manual sync (operator)

```bash
bash scripts/sync_live_desk_data.sh   # copy fresh curve + hydration into repo
bash scripts/publish_ghpages.sh       # push to team URL
```

---

## 6. Morning workflow

### One-click (desk)

| Step | Action |
|------|--------|
| 1 | Start collect agent (if not running) — `python3 scripts/whinfell_collect_agent.py` |
| 2 | Click **Collect CSVs** (or **Alt+Shift+C** / **⌃⌥⇧C**) — wait for completion toast |
| 3 | Click **Refresh data** (or **Alt+Shift+R** / **⌃⌥⇧R**) |
| 4 | Review tracer suggestions → **Accept** → **Save State** |
| 5 | Optional: **Publish Web** for team GitHub Pages |

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

## 7. Publish to GitHub Pages

### One-click (local desk)

| Step | Action |
|------|--------|
| 1 | Collect agent running on `:8767` |
| 2 | Click **Publish** in the utility strip (or **Alt+Shift+P** / **⌃⌥⇧P**) |
| 3 | Wait for toast — job polls until `gh-pages` push completes |
| 4 | Team opens Pages URL; **Refresh data** loads the new bundle |

**Offline agent:** Publish copies `bash scripts/publish_ghpages.sh` to the clipboard for Terminal.

**On GitHub Pages:** Publish, Collect, and Agent controls are hidden (read-only bundle).

### Terminal (always works)

```bash
bash scripts/publish_ghpages.sh
```

Optional full collect before publish:

```bash
WHINFELL_PUBLISH_COLLECT=1 bash scripts/publish_ghpages.sh
```

See `BEST_PRACTICES.md` — never `git add -A`.

**Published URL:** `https://clark-cmyk.github.io/Whinfell_Transmission_Control/`

---

## 8. Specialized tools

| Tool | Open from console | Standalone URL |
|------|-------------------|--------------|
| BasisWatch | Specialized tools → BasisWatch (Dig layer) · **Alt+B** / **⌃⌥B** | `/Whinfell_BasisWatch.html` |
| Midwest Compute Crush | Specialized tools → Midwest Crush · **Alt+M** / **⌃⌥M** | `/Whinfell_Midwest_Compute_Crush.html` |
| Bang Bang Da | Specialized tools → Bang Bang Da ↗ | `/bang_bang_da_machine.html` |
| Ladder deep dive | Specialized tools → Ladder deep dive ↗ · KPI band link | `/whinfell-transmission-ladder-deep-dive.html` |

BasisWatch pop-out: **Open in focus view** in Dig panel header.

---

## 9. BasisWatch

CME-style crypto futures basis and implied rate. Curve from `data/barchart/v1/barchart_curve_history.json`; spot from hydration `crypto_sleeve`.

| Control | Location |
|---------|----------|
| Collect / Refresh | TopShell utility strip or standalone ops bar |
| Export CSV / PNG | BasisWatch panel toolbar (export current view — not source download) |
| Asset / view / roll | Panel header (BTC/ETH · Basis/Implied · roll logic) |

Empty curve → run **Collect CSVs**, then **Refresh data**. On Pages, curve is static until publish.

---

## 10. Bang Bang Da Machine

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

## 11. Hydration v1.3.0 blocks

Required: `node_cockpits`, `cockpit_context`, `global`, `china`, `suggested_tracer`.

| Key | UI |
|-----|-----|
| `ai_compute` | AI Compute tab |
| `corporate_credit` · `trade_tracker` · `btc_attribution` · `margin_rules` | v1.5 Desk |
| `rv_history` | Bang Bang Da + basis charts |

---

## 12. Legacy console tabs

| Tab | Purpose |
|-----|---------|
| Prompts | Perplexity / Grok operator prompts |
| Risk | Gross risk, posture, handover |
| Tracer | Hybrid signal tracer (confirm required) |
| Scenario | Session-only what-if |
| AI Compute | H200 curve, MISO power, crush trade |
| v1.5 Desk | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |

---

## 13. Theme

Toggle **Light mode** / **Dark mode** from the TopShell action row (`btnTheme`). Preference is stored in `localStorage` and applies across shell + widget cards.

---

## 14. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank desk on Pages | Enable Pages or use local server |
| Collect does nothing | Start collect agent on `:8767` |
| Refresh shows stale data | Run Collect first, or `sync_live_desk_data.sh` + publish |
| Publish fails immediately | Agent offline — run `bash scripts/publish_ghpages.sh` in Terminal |
| Shortcut does nothing (Mac) | Use **⌃⌥** chord; avoid typing in an input field |
| Shortcut does nothing (any OS) | Hard-refresh after deploy — check Build badge matches latest |
| BasisWatch empty curve | Collect → Refresh; check `data/barchart/v1/barchart_curve_history.json` |
| Ladder deep dive 404 | Use root URL `/whinfell-transmission-ladder-deep-dive.html` (not `docs/` only) |
| BBDM window no-op | `bang_bang_da_server.py` on `:8766` |
| BBDM DATA_GAP (ETH) | `enrich_hydration_rv.py` after hydrate |
| Import blocked | Confirm `lineage_hash`; Shift+click Import to force |
| Collapsed shell after refresh | Normal — collapse prefs are per-session in `sessionStorage` |
| Diagnostics | Console: `renderVisualizationDiagnostics()` |

---

## 15. Related docs

- `documentation/Whinfell_Quick_Reference_v1.5.md`
- `documentation/DATA_DICTIONARY_v1.5.md`
- `documentation/DESK_URLS.md`
- `bang_bang_da/README.md`