# BUILD TODO List — Whinfell Transmission Control

**Maintained by:** BUILD Cousins  
**Last updated:** July 9, 2026 (COMET C6 links + forms shipped · next C7)  
**Repo:** `Whinfell_Transmission_Control`  
**HEAD:** `main` tip **`cf5c57e`** · C6 code **`cf5c57e`** · tree clean (noise untracked only)

**Build:** `1.5-BUILD-COUSINS-2026-07-04-PHASE23` · **Hydration:** `1.3.0` · **Auto-download:** `0.4.2` · **Collect agent:** `0.1.0` · **Task Force:** `1.1.0`  
**Handoff specs:**  
- `Whinfell UI Optimization Plan.md.txt`  
- `Whinfell Transmission Control — UI Optimization Report for GROK.txt`  
- `Whinfell Transmission Control — Light Theme Spec for GROK.txt` *(truncated on disk)*  
- **`01_Strategy_Docs/COMET_CSS_Refactor_Spec.md`** — Koyfin-style grid shell CSS (from COMET; Phase 2.3) · root copy `COMET CSS Refactor Spec.txt`  
- Care package: prior layout thrash → consolidation + **small verified changes only**

---

## NEW SESSION — start here (Jul 9 · after COMET C6)

### Paste block (drop into next session)

```text
Repo: Whinfell_Transmission_Control · main tip cf5c57e · C6 cf5c57e · working tree clean
Read: 01_Strategy_Docs/BUILD_TODO_List.md → "NEW SESSION — start here"
Also: 01_Strategy_Docs/COMET_CSS_Refactor_Spec.md + Progress_Log.md (C6 entry)
Shipped: Koyfin PR-1…7 + COMET C0–C6 (tokens · density · nav · panel · control · chips · links/forms).
Next: COMET C7 — optional responsive @900px (stack nav + dashboard).
Rules: edit root → build_web.sh → serve dist only · one chunk · tests after · no .wtc-* fork · no re-scaffold.
```

### Rules (non-negotiable)

1. **Serve `dist/` only:** `bash scripts/build_web.sh` then `cd dist && python3 -m http.server 8765`
2. Edit **root** sources (`index.html`, `css/`, `js/`) → rebuild → hard-refresh browser
3. **One chunk / one concern per step** · max ~6 files · run tests before next edit
4. No Python one-off HTML rewrites without `import re` / targeting the wrong tree
5. Prefer `git restore` over stacking failed CSS experiments
6. COMET: **map don’t fork** — never bulk-rename markup to `.wtc-*`

### Git / working tree

| Item | State |
|------|--------|
| Branch | `main` tip **`cf5c57e`** |
| Last UI commit | `feat(ui): COMET C6 links toolbar + form fields` |
| Working tree | **Clean** (source) |
| `dist/` | **gitignored** — always rebuild after source changes |
| Untracked noise | layout-refactor notes · `index.html.backup.*` · `whinfell_logo/` · root `COMET CSS Refactor Spec.txt` (inbox; canonical is under `01_Strategy_Docs/`) |
| Remote | Not pushed this session — push only if Clark asks |

### Shipped

| Chunk | Goal | Key change | Commit |
|-------|------|------------|--------|
| **1–3** | TopShell · left icons-only · Cockpit meta | relocateTopBar · RC codes · `#riskCockpitPanelMeta` | `825d9f4` |
| **4–5** | Radar + HY OAS meta | `#radarPanelMeta` · `#hyOasPanelMeta` | `9cca83a` |
| **6** | Flipchart polish | `#flipchartPanelMeta` · pager+implications card | `38f23a3` |
| **7** | Depth polish | `#depthPanelMeta` · status/viz/disclosure card | `38f23a3` |
| **C0** | Token bridge | COMET slate → `--wf-*` · `--ia-*` alias · density *tokens only* | `38f23a3` |
| **C1** | Shell density | `--ia-top-h`→header-h · topbar 44px · rail/canvas/grid gaps · strip-h | `a69ad00` |
| **C2** | Nav hover/active | `.wf-nav-item` hover control-bg · active panel-bg-3 · radius-control | `7860c49` |
| **C3** | Widget card chrome | `.wf-panel` radius-widget · border · header/body gap tokens | `1e431df` |
| **C4** | Topbar control set | `.console-chip` / `.btn-console` radius-control · primary=ok | `a770a19` |
| **C5** | Chip variants + strip height | `.console-chip--ok/warn/risk` · pipeline strip 24px · regime pills | `4dae71f` |
| **C6** | Links + form fields | accent toolbar links · selectors/operator/bw fields radius-control | `cf5c57e` |

**Tests at C6 ship:** `koyfin_widget_shell` · `top_utility_registry` · `depth_ladders_widget` · `phase16_integration` · `shell_shortcuts` — PASS · `build_web.sh` OK

### Next action for new session

**→ COMET C7 — optional responsive @900px**

| Goal | Detail |
|------|--------|
| **C7 (do this)** | Optional media query: stack nav + dashboard under 900px |
| Primary file | `css/console_ia.css` · media query only |
| After C7 | COMET track complete · PR-8 light unify / live desk as needed |
| Out of scope now | `.wtc-*` DOM · widget re-scaffold · re-open C3–C6 |

**C7 do-not:** change business JS · re-scaffold grid · hard-code new hex · touch `main.css` dual system unless forced · re-open C6 links/forms

**Known boot note (separate):** `scan_kpi_strip.js` `hasRcZones` uses `layout.children.some` on HTMLCollection → `renderAll` can fail (cockpit meta stuck). Fix only if still open and blocking.

### Recommended open commands

```bash
cd ~/Desktop/Whinfell_Transmission_Control
git status
git log -1 --oneline
bash scripts/build_web.sh
cd dist && python3 -m http.server 8765
# hard-refresh http://127.0.0.1:8765/
node tests/koyfin_widget_shell.test.mjs
```

Browser checklist: dark slate · accent Koyfin/Barchart/Docs links · form fields radius **4** · control chips · status chips · pipeline strip **24px** · cards radius **8** · left nav · 44px header · light theme · no layout thrash.

---

## Koyfin UI Optimization (dashboard grid) — PR track

Specs: UI Optimization Plan + Report + Light Theme Spec + **COMET CSS Refactor Spec**.

| PR | Chunk | Goal | Status |
|----|-------|------|--------|
| PR-1 | 1 | Unify TopShell into IA shell · dist = root | **Done** Jul 9 |
| PR-2 | 2 | Collapsible top + left (icons-only left fix) | **Done** Jul 9 |
| PR-3 | 3 | Risk Cockpit `wf-panel` polish | **Done** Jul 9 (panel meta + chrome lock) |
| PR-4 | 4 | Radar + Risk Curve dashboard row | **Done** Jul 9 (panel meta · no re-scaffold) |
| PR-5 | 5 | HY OAS proxy widget | **Done** Jul 9 (panel meta · handoff row locked) |
| PR-6 | 6 | Flipchart widget | **Done** Jul 9 (panel meta · no re-scaffold) |
| PR-7 | 7 | Depth & Ladders widget | **Done** Jul 9 (panel meta · no re-scaffold) |
| PR-8 | 8 | Light theme unify (`--wf-*` vs `main.css` dual system) | Partial — C0 bridges `--ia-*`; main.css dual remains |
| **COMET** | C0 | Token bridge | **Done** Jul 9 |
| **COMET** | C1 | Shell density (header/padding tokens) | **Done** Jul 9 |
| **COMET** | C2 | Nav hover/active | **Done** Jul 9 |
| **COMET** | C3 | Widget card chrome lock | **Done** Jul 9 |
| **COMET** | C4 | Topbar control set | **Done** Jul 9 |
| **COMET** | C5 | Chip variants + status strip | **Done** Jul 9 |
| **COMET** | C6 | Links · form fields | **Done** Jul 9 |
| **COMET** | C7 | Optional responsive @900px | **Next** |

### Known gaps (do not re-break)

| Gap | Priority |
|-----|----------|
| Left collapse hides body (icons-only dead) | **Fixed Chunk 2** |
| Dual light systems (`main.css` vs `--wf-*` GROK tokens) | P1 — Chunk 8 + COMET tokens |
| COMET hard-coded hex vs `--wf-*` | P1 — never ship a second class system; alias into tokens |
| `depth_ladders_widget` Playwright timeout | P2 investigate (BOOT?) |
| Transaction / output codes on nav | Deferred |
| Operator Precision placement | Deferred (not in DOM) — COMET §9 chips when placed |
| Light Theme Spec file truncated (~70 lines) | Complete before full Chunk 8 |

---

## COMET CSS Refactor (Koyfin-style shell) — tracked

**Source:** `01_Strategy_Docs/COMET_CSS_Refactor_Spec.md` (canonical) · root `COMET CSS Refactor Spec.txt` (inbox copy)  
**Goal:** Console feels like a clean Koyfin-style dashboard (header + left nav + central widget grid) — **without** proprietary assets or layout thrash.  
**Primary file:** `css/console_ia.css` (+ light tokens). Prefer **token + existing class** edits over new DOM.

### Rules (COMET-specific)

1. **Map, don’t fork.** Spec uses `.wtc-*` as *design language only*. Implement via existing `.wtm-ia-shell` / `.ia-*` / `.wf-panel` / `--wf-*`. Do **not** bulk-rename markup to `.wtc-*` unless a later PR deliberately aliases both.
2. **Hard hex → tokens.** COMET colors (`#020617`, `#1e293b`, `#22c55e`, …) become `--wf-*` / `--ia-*` values (and light-theme counterparts). No new one-off hex islands in component CSS.
3. **One concern per step** · serve `dist/` only · tests after · `git restore` over stacked CSS experiments.
4. **Do not re-scaffold** widget grid / relocateNodes hosts. COMET is chrome + density polish.

### Spec → existing shell map

| COMET § | Spec class (intent) | Existing target | Coverage |
|--------|---------------------|-----------------|----------|
| 1 Global shell | `.wtc-shell` / `.wtc-main` | `.wtm-ia-shell` · `.ia-body` / main grid | **Partial** — full-height flex/grid exists |
| 2 Left nav + dashboard | `.wtc-nav` · `.wtc-dashboard` | `.ia-left-frame` · `.ia-center-canvas` / `.ia-widget-grid` | **Partial** — rail + canvas; width tokens 168/44 |
| 3 Header bar | `.wtc-header` (44px) | `.ia-top-frame` · `.console-topbar` | **Partial** — collapsible; height tokens differ |
| 4 Search + actions | `.wtc-search` · `.wtc-btn` | top utility chips · Docs/Refresh/Publish | **Open** — normalize control chrome |
| 5 Nav items | `.wtc-nav-item` · section titles | `.wf-nav-item` · `.ia-view-shortcut` · specialized tools | **Partial** — icons-only codes done (Chunk 2) |
| 6 Widget grid rows | `.wtc-row` / 3col / full | `.ia-widget-grid` · `grid-template-areas` | **Mostly done** — Koyfin PR-1…6 |
| 7 Widget cards | `.wtc-widget` · header/body | `.wf-panel` · `__header` / `__body` / `__meta` | **Mostly done** — meta polish 3–6 |
| 8 Form controls | `.wtc-field` · input/select | HY OAS / dig hosts · mission controls | **Done** C6 |
| 9 KPI chips / tags | `.wtc-chip*` | `.console-chip--ok/warn/risk` · regime tags | **Done** C5 — variants + regime tokens |
| 10 Links toolbar | `.wtc-link` · link-row | Koyfin/Barchart/Docs strip · desk links | **Done** C6 |
| 11 Freshness strip | `.wtc-status-strip` (24px) | `.ia-top-pipeline-strip` · header freshness | **Done** C5 — strip-h 24px collapsed |
| 12 Responsive | stack nav @900px | optional; not blocking desk 1440 | **Open** — C7 |

### COMET implementation chunks (queued)

| Chunk | Goal | Primary touch | Depends |
|-------|------|---------------|---------|
| **C0** | Token bridge: map COMET palette → `--wf-*` / light | `css/console_ia.css` `:root` + `[data-theme="light"]` | **Done** Jul 9 |
| **C1** | Shell density: header 44px feel · rail/canvas gap/padding | top frame · left frame · canvas padding | **Done** Jul 9 |
| **C2** | Nav item + section title polish (hover/active) | left nav list · view shortcuts | **Done** Jul 9 |
| **C3** | Widget card chrome lock (radius 8 · border · header/body gap) | `.wf-panel*` only | **Done** Jul 9 |
| **C4** | Search + primary/secondary actions as control set | topbar utilities · `.console-chip` / btn classes | **Done** Jul 9 |
| **C5** | Chip variants ok/warn/risk + status strip height | chips · pipeline strip · regime pills | **Done** Jul 9 |
| **C6** | Links row (Koyfin / Barchart / Docs) + form field normalize | desk link strip · panel forms | **Done** Jul 9 |
| **C7** | Optional responsive @900px | media query only | **Next** |

**Acceptance (COMET track overall):** Desk at 1440 looks denser/cleaner Koyfin-like; single token system; no second shell class tree; keyboard + relocateNodes + widget hosts unchanged.

**Out of scope for COMET:** Python rewrites of HTML · widget re-scaffold · transaction codes · chart canvas logic · replacing IA layer scan/dig/iterate.

---

## UI Revamp (scan · dig · iterate)

| Chunk | Scope | Status |
|-------|-------|--------|
| 01 | Normalize top controls — `top_utility_registry.js` + `.console-chip` | **Done** |
| 02 | Compress header — slim topbar, compact meta chips, link `console_ia.css` | **Done** |
| 03 | Compress KPI copy — `SCAN_DISPLAY` + one-line face deltas | **Done** |
| 04 | Badge reduction — `BADGE_DISPLAY` scan + command bar | **Done** *(reconciled)* |
| 05 | Clarify Score/Gate/Shock semantics — `SEMANTIC_DISPLAY` | **Done** *(reconciled)* |
| 06 | Light contrast pass — light theme tokens | **Done** *(reconciled)* |
| 07 | Typography reset — compact type ladder | **Done** *(reconciled)* |
| 08 | Collapse commentary — disclosure-first rationale | **Done** *(reconciled)* |
| 09 | Signal detail rewrite — desk-native drawer copy | **Done** |
| 10 | Radar shell — `transmission_radar.js` below scan strip | **Done** |
| 11 | Radar wiring — live sleeve data | **Done** |
| 12 | Move depth down | **Done** |

**Plan:** `01_Strategy_Docs/whinfell_ui_revamp_grok_build.md` · **Tally:** `BEST_PRACTICES.md` § UI Revamp

| 16 | Phase 16 integration — IA shell · right-rail commentary · dictionary · build.sh | **Done** |

*Reconciled July 5, 2026:* Chunks 01–16 shipped. **Next = desk walk-through** (go-live gate).

---

## Bang Bang Da Machine v1.2

| Item | Status |
|------|--------|
| `bang_bang_da_calculator.py` — 5-trade Z scanner | **Done** |
| `bang_bang_da_machine.html` — desk UI (filters · detail · Chart.js) | **Done** |
| `whinfell_pipeline/rv_history.py` — live daily points + window Z | **Done** |
| `scripts/enrich_hydration_rv.py` — `eth_calendar_et_near_deferred` + `rv_history` block | **Done** |
| `scripts/bang_bang_da_server.py` — `:8766` API (window selector) | **Done** |
| `scripts/Bang_Bang_Da.command` — one-click launcher | **Done** |
| `eth_calendar_et_near_deferred` in `data_dictionary.yaml` | **Done** |
| `tests/test_bang_bang_da.py` | **Done** — PASS |
| `build_web.sh` ships `bang_bang_da_machine.html` | **Done** |

**Desk:** `open scripts/Bang_Bang_Da.command` · UI `http://127.0.0.1:8765/bang_bang_da_machine.html` · API `http://127.0.0.1:8766/api/report?window=60`  
**Operator doc:** `bang_bang_da/README.md`

**Queued (BBDM):** Wire real Barchart `ETM26` spread history (replace `rv_basis_reconstructed` ETH path).

---

## Highest priority open items

| # | Goal | Priority | Owner | Done when |
|---|------|----------|-------|-----------|
| 0j | **COMET C7** — optional responsive @900px | **Medium · next UI track** | BUILD | stack nav/dashboard under 900 · media query only · tests PASS |
| 0i | **COMET C6** — links row + form field normalize | **Done** | BUILD | accent toolbar links · form radius-control · tests PASS |
| 0h | **COMET C5** — chip variants ok/warn/risk + strip height | **Done** | BUILD | chip--ok/warn/risk · pipeline strip 24px · regime pills · tests PASS |
| 0g | **COMET C4** — search + control set | **Done** | BUILD | topbar chip/btn radius-control · primary=ok · tests PASS |
| 0f | **COMET C3** — widget card chrome lock (`.wf-panel*`) | **Done** | BUILD | radius-widget · border · header/body gap · tests PASS |
| 0e | **COMET C2** — nav hover/active | **Done** | BUILD | control-bg hover · panel-bg-3 active · tests PASS |
| 0d2 | **COMET C1** — shell density | **Done** `a69ad00` | BUILD | header-h applied · tests PASS |
| 0d | **COMET CSS C0** — token bridge | **Done** | BUILD | `--wf-*` slate + `--ia-*` bridge · tests PASS |
| 0 | **Koyfin Chunk 7** — Depth panel meta | **Done** | BUILD | `#depthPanelMeta` · min-height · tests PASS |
| 0c | **Koyfin Chunk 6** — Flipchart panel meta | **Done** | BUILD | meta · pager+implications · keyboard OK |
| 0a | **Koyfin Chunks 4–5** — Radar + HY OAS panel meta | **Done** `9cca83a` | BUILD | meta lines · tests PASS |
| 0b | **Koyfin Chunks 1–3** | **Done** `825d9f4` | BUILD | Committed on `main` |
| 1 | **Live desk walk-through** — ratings in `Desk_Feedback_Log.md` | **High · go-live gate** | Clark · Wes | All 5 nodes + UI/docs rated |
| 2 | **Push / desk stack** when ready | **Medium** | Clark | tip on remote if desired · no thrash |
| 3 | **Task Force live Grok chain** | **Medium** | BUILD | Manual 12-step run → `--merge` → replace specialist stubs with live TxIntegrator |
| 4 | **Collect agent auto-start** — LaunchAgent on login | **Medium** | BUILD | Agent on `:8767` without manual Terminal tab |
| 5 | **Post-collect hydration** — auto `copy_hydration_bundle.sh` + import prompt | **Medium** | BUILD | Collect button → fresh bundle → WTC import nudge |
| 6 | **Morning runbook** — Quick Ref for `.command` + collect agent | **Low** | BUILD | `Whinfell_Quick_Reference_v1.5.md` matches Care Package Jul 5 workflow |
| 7 | **COMET C7** — optional responsive @900px | **Low** | BUILD | Media query only after C1–C3 stable |

---

## Shipped this session (Jul 5 — one-click CSV collect UI)

| Item | Status |
|------|--------|
| `scripts/whinfell_collect_agent.py` — HTTP bridge `:8767` | **Done** |
| `js/auto_collect_panel.js` — `WTM_AutoCollect` · agent + clipboard fallback | **Done** |
| WTC header `btnMorningCollect` | **Done** |
| BasisWatch `btnBwCollect` + standalone `BC ↓` / `KF ↓` | **Done** |
| Midwest Compute Crush `btnWmcCollect` | **Done** |
| `scripts/Whinfell_Morning_Collect.command` — agent auto-start + morning chain | **Done** |
| `tests/auto_collect_panel.test.mjs` | **Done** — PASS |
| `tests/test_collect_agent.py` | **Done** — PASS |
| Care Package | **Done** — `Whinfell_Care_Package_20260705.md` |
| `build.sh` — ships `auto_collect_panel.js` to `dist/` | **Done** |

---

## Shipped (Jul 4 — Phase 2.3 boot fix)

| Item | Status |
|------|--------|
| **Boot hang fix** — BasisWatch ↔ `renderAll` async ping-pong | **Done** |
| `runBootSequence()` — phased async boot · `__WTM_BOOT_COMPLETE` | **Done** |
| `renderAll()` wrapper · `renderAllFallback()` · depth cap | **Done** |
| `tests/safe_boot_render.test.mjs` | **Done** — PASS |
| Panel `installHook` — `__WTM_CORE_READY` gate (no infinite poll) | **Done** |
| Phase 2.3 console — safeBoot · meta polling off · `prepareHydrationBundle()` | **Done** |
| `tests/phase23_console.test.mjs` | **Done** — PASS (`saved_bytes=57826`) |
| Full morning chain — `daily --chain` + `copy_hydration_bundle.sh` | **Done** — `collect_exit=0` · `hydrate_exit=0` |
| Fresh hydration bundle | **Done** — `as_of=2026-07-04T20:52:57+00:00` · `freshness_status=fresh` · `snapshot_id=global-2026-07-04-raw2wtm-01` |
| Drop readiness | **Done** — `ready=6/6` · rates + equities + china + import_core + flows + barchart |
| Live Task Force merge | **Done** — `--gatherer` on fresh hydration + complete stub specialists · `--merge` |
| Task Force WTM authority (`Source Channel: task_force` overrides `global`) | **Done** — score 69 · verdict WATCH @ 30% |
| `desk_urls.yaml` — all 6 core Koyfin `/myw/` wired | **Done** |
| `koyfin_WTM-*` normalize rules (rates · equities · china) | **Done** — TC + Cousins `data_dictionary.yaml` synced |
| Dictionary locks (`test_data_dictionary.py`) | **Done** — 4/4 PASS |

---

## Auto CSV Download

| Chunk | Scope | Status |
|-------|-------|--------|
| 1 | Design + plan | **Done** |
| 2 | Scaffold + manifest loader + CLI | **Done** |
| 3 | Barchart intraday (`viewName=197689`) | **Done** |
| 4 | Koyfin Watchlist `/myw/` + Chart `/charts/` | **Partial** — 6/6 core watchlists wired; Chart `/charts/` still blocked |
| 4c | Live fetch all wired watchlists | **Done** — 6/6 core exports in drop · Comet headed fetch verified Jul 4 |
| 5 | Pipeline bridge `daily --chain` → hydrate | **Done** — live run Jul 4 PM · `collect_exit=0` · `hydrate_exit=0` |
| 5b | `koyfin_WTM-*` normalize → canonical | **Done** — globs added · **verify** on next `daily --chain` |
| 6 | Morning launcher + `.command` | **Done** |
| 7 | Drop auto-archive (2-day retention) | **Done** |
| 8 | One-click collect UI (WTC · BasisWatch · WMC) + collect agent `0.1.0` | **Done** |

**Core Koyfin `/myw/` URLs (from `data_dictionary.yaml` → `desk_urls.yaml`):**

| Export ID | Saved view | URL |
|-----------|------------|-----|
| `koyfin_rates` | `WTM-Rates-Credit` | `https://app.koyfin.com/myw/575998c3-3ba1-4572-b46b-9477f374c6f1` |
| `koyfin_equities` | `WTM-Equities-Breadth` | `https://app.koyfin.com/myw/495e878c-8a1f-4371-9c9d-ed256743b1a4` |
| `koyfin_import_core` | `WTM-Import-Core` | `https://app.koyfin.com/myw/70789aa7-8084-4e4c-85d3-09f9b78dcd3a` |
| `koyfin_flows_global` | `WTM-Flows-Global` | `https://app.koyfin.com/myw/afb1f314-4de4-47b6-b02f-0de2601b62b9` |
| `koyfin_china` | `WTM-China-Policy` | `https://app.koyfin.com/myw/52364942-af46-4fc0-98b3-ff7d340e7284` |

---

## Task Force v1.1.0

| Chunk | Scope | Status |
|-------|-------|--------|
| 1 | DataGatherer + `task_force` schema in dictionary | **Done** |
| 2 | 12 specialist prompts + `run_task_force_chain.sh` | **Done** |
| 3 | MasterSizing + TxIntegrator prompts · merge · WTM verify | **Done** — live gatherer snapshot + stub specialists merged; Grok 12-step pending |

**Artifacts:** `prompts/task_force/` · `data/hydration/task_force.json` · `scripts/merge_task_force.py` · `tests/task_force_wtm_export.test.mjs`

**Deferred post-gate:** Control UI task_force chips · arena-plan doc checkboxes

---

## Phase 2.3 — Desk console

| Item | Status | Owner |
|------|--------|-------|
| safeBoot + meta polling off + hydration prep | **Done** | BUILD |
| Boot hang fix (BasisWatch ↔ `renderAll` loop) | **Done** | BUILD |
| `runBootSequence()` + `renderAllFallback()` + boot diagnostics | **Done** | BUILD |
| `tests/safe_boot_render.test.mjs` | **Done** — PASS | BUILD |
| Mission probes + freshness + Phase 2.3 tests | **Done** — all PASS | BUILD |
| One-click CSV collect UI + collect agent | **Done** | BUILD |
| Live desk walk-through | **In progress** | Clark · Wes |
| Operator ratings | **Pending · go-live gate** | → `Desk_Feedback_Log.md` |

---

## Dictionary / ingest (Cousins — TC read-only)

| Item | Status |
|------|--------|
| `WTM-BTC-Basis` → `barchart_screens` (not `koyfin_saved_views`) | **Done** |
| China Policy FINAL LOCK (6 tickers · HG1 proxy) | **Done** |
| `data_dictionary.yaml` ongoing edits | **Preserved** — do not overwrite from TC |

---

## Queued (post desk feedback)

| # | Goal | Owner |
|---|------|-------|
| 15 | ARCH-4 curve history (`barchart_curve_history.json`) | Clark + BUILD |
| 17 | Probe spot formatting tweak | BUILD |
| 18 | Control UI task_force chips | BUILD (deferred) |
| 19 | Koyfin Chart `/charts/` URLs for timeseries exports | Clark (optional) |
| 20 | WMC link from WTC nav / docs drawer | BUILD |
| 21 | Live hydration merge into `WMC_DATA` from `ai_compute` block | BUILD |
| 22 | Barchart `ETM26` → live `eth_calendar` rv_history (drop BBDM proxy) | BUILD |

---

## Verification commands

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# Phase 2.3 console + boot + collect UI
node tests/safe_boot_render.test.mjs
node tests/phase23_console.test.mjs
node tests/auto_collect_panel.test.mjs
python3 tests/test_collect_agent.py

# UI + desk
node tests/rv_horizon_fallback.test.mjs
node tests/run_desk_probes.mjs
node tests/freshness_indicators.test.mjs

# Task Force
node tests/task_force_wtm_export.test.mjs
python3 tests/test_merge_task_force.py
python3 scripts/run_data_gatherer.py

# Dictionary locks
python3 tests/test_data_dictionary.py

# Auto-download — live fetch (wired targets)
python3 run_auto_download.py fetch --id koyfin_rates
python3 run_auto_download.py fetch --id koyfin_equities
python3 run_auto_download.py fetch --id koyfin_import_core
python3 run_auto_download.py fetch --id koyfin_china
python3 run_auto_download.py fetch --id barchart_futures_intraday

# Full chain
python3 run_auto_download.py daily --chain
bash scripts/copy_hydration_bundle.sh
bash scripts/run_task_force_chain.sh --gatherer
# Grok Tasks → --merge

# Collect agent (desk one-click)
python3 scripts/whinfell_collect_agent.py
curl -s http://127.0.0.1:8767/health

# Bang Bang Da (RV Z-score scanner)
python3 scripts/enrich_hydration_rv.py
python3 bang_bang_da_calculator.py -w 60
python3 tests/test_bang_bang_da.py
python3 scripts/bang_bang_da_server.py   # :8766 — keep running for UI window selector
curl -s "http://127.0.0.1:8766/api/report?window=60" | python3 -m json.tool | head
```

**Session close:** One-click collect UI **shipped** · collect agent `0.1.0` · tests **5/5 PASS** (`auto_collect_panel` · `test_collect_agent` · `phase23_console` · `safe_boot_render` · `task_force_wtm_export`) · **Next gate** = desk ratings → commit stack → LaunchAgent → Grok live chain.

**Desk smoke:** `open "index.html?safe_boot=1"` · click **Collect CSVs** (agent must be on `:8767`) · `open Whinfell_Midwest_Compute_Crush.html`