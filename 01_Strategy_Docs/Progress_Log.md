# Whinfell Transmission Control — Progress Log

**Started:** June 26, 2026  
**Last updated:** July 9, 2026 (COMET C5 chips + strip · next C6)

---

## July 9, 2026 — COMET CSS C5 (chip variants + status strip)

```text
CHUNK ID: COMET-C5
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: Status chip ok/warn/risk family · pipeline strip --wf-status-strip-h (24px) · regime pills tokenized

CONTEXT
- Spec §9 KPI chips + §11 status strip (design language only)
- C4 control set done; C5 is status variants + strip density (no business JS)

CHANGES
- css/console_ia.css
  · .console-chip--ok / --warn / --risk via --wf-*-soft status tokens
  · collect agent online/offline grouped onto ok/warn family
  · --wf-header-h-collapsed → var(--wf-status-strip-h) (24px)
  · collapsed .ia-top-frame-bar + .ia-top-pipeline-strip height = --wf-status-strip-h
  · flipchart + cockpit regime pills: constructive=ok · stressed=warn · defensive=neutral
  · light theme parity for chips + regime pills
- tests/koyfin_widget_shell.test.mjs — C5 chip/strip/regime asserts
- tests/top_utility_registry.test.mjs — C5 CSS locks

QA
- [x] koyfin_widget_shell · top_utility_registry · depth_ladders · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in 4dae71f
- [ ] browser-verify collapsed strip 24px · chip variants · regime pills · dark + light

NEXT SESSION
- COMET C6 links row (Koyfin / Barchart / Docs) + form field normalize — see BUILD_TODO handoff
```

---

## July 9, 2026 — COMET CSS C4 (topbar control set)

```text
CHUNK ID: COMET-C4
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: Topbar .console-chip / .btn-console as control set via --wf-*; no .wtc-btn/.wtc-search fork

CONTEXT
- Spec §4 search+actions (design language only) → map onto existing top utilities + action row
- No search input in topbar yet; control chrome is the C4 surface

CHANGES
- css/console_ia.css
  · .console-chip / .btn-console / action-row buttons: radius-control · control-bg/border · gap-1
  · primary → --wf-ok-strong / --wf-ok (COMET green primary)
  · accent / save / meta / mode / external tokenized
  · .ia-frame-toggle control chrome + hover
  · agent online/offline → ok/warn soft tokens (C5 owns full chip family)
  · light theme control set parity
- tests/koyfin_widget_shell.test.mjs — C4 control asserts
- tests/top_utility_registry.test.mjs — C4 CSS locks

QA
- [x] koyfin_widget_shell · top_utility_registry · depth_ladders · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in a770a19
- [ ] browser-verify chips radius 4 · primary green Collect · dark + light

NEXT SESSION
- COMET C5 chip variants ok/warn/risk + status strip height — see BUILD_TODO handoff
```

---

## July 9, 2026 — COMET CSS C3 (widget card chrome lock)

```text
CHUNK ID: COMET-C3
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: .wf-panel* card chrome — radius 8 · border token · header/body gap via --wf-*; no .wtc-* fork

CONTEXT
- Spec §7 widget cards (design language only)
- C2 nav done; C3 is panel chrome only (no re-scaffold)

CHANGES
- css/console_ia.css
  · .wf-panel: border-radius --wf-radius-widget (8) · flex column · border --wf-border
  · .wf-panel__header: padding gap-3 · row/column-gap tokens · min-height 36 · flex-shrink 0
  · .wf-panel__body: padding gap-3 · flex 1 · flush stays 0
  · .wf-panel__actions / __meta / __title: gap + type tokens
  · widget variant headers gap → --wf-gap-2
- tests/koyfin_widget_shell.test.mjs — C3 radius/border/header/body + no .wtc-widget asserts

QA
- [x] koyfin_widget_shell · depth_ladders_widget · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in 1e431df
- [ ] browser-verify card radius 8 · header/body gap · dark + light

NEXT SESSION
- COMET C4 search + primary/secondary controls — see BUILD_TODO handoff
```

---

## July 9, 2026 — COMET CSS C2 (nav hover/active)

```text
CHUNK ID: COMET-C2
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: Left-rail nav hover/active slate via --wf-*; denser items; no .wtc-* fork

CONTEXT
- Spec §5 nav items (design language only)
- C1 density done; C2 is rail chrome only

CHANGES
- css/console_ia.css
  · .wf-rail-section__label denser (28px · letter-spacing 0.08em · gap tokens)
  · .wf-nav-item: radius-control · text-xxs · min-height 28 · gap padding
  · hover → --wf-control-bg; active → --wf-panel-bg-3 + --wf-border-strong
  · .ia-view-shortcut / .ia-risk-curve-summary.is-active slate parity
  · light theme active/hover tokenized
- tests/koyfin_widget_shell.test.mjs — C2 hover/active/radius + no .wtc-nav-item asserts

QA
- [x] koyfin_widget_shell · depth_ladders_widget · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in 7860c49
- [ ] browser-verify nav hover/active + icons-only codes + light theme

NEXT SESSION
- COMET C3 card chrome lock (.wf-panel*) — see BUILD_TODO handoff
```

---

## July 9, 2026 — COMET CSS C1 (shell density)

```text
CHUNK ID: COMET-C1
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: Apply C0 density tokens — 44px header feel · rail/canvas gap · no new palette · no .wtc-*

CONTEXT
- Spec: COMET_CSS_Refactor_Spec.md (design language only)
- C0 shipped tokens; C1 consumes them on .ia-* / .wf-* only

CHANGES
- css/console_ia.css
  · --ia-top-h: var(--wf-header-h) (retired hard 72px)
  · expanded toggle strip → --wf-status-strip-h
  · .ia-top-body / .console-topbar → min/height --wf-header-h · tighter zone padding
  · .ia-left-body padding/gap → --wf-gap-2
  · .ia-center-canvas / .ia-widget-grid padding → gap-2/3 tokens (grid gap was hard 12px)
  · light theme: bridge --ia-top-h / rail widths to density tokens
- tests/koyfin_widget_shell.test.mjs — C1 density asserts

QA
- [x] koyfin_widget_shell · depth_ladders_widget · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in a69ad00
- [ ] browser-verify denser header @ 1440 + light theme + collapse strip

NEXT SESSION
- COMET C2 nav hover/active — see BUILD_TODO handoff
```

---

## July 9, 2026 — Session handoff (Koyfin 6–7 + COMET C0 committed)

```text
HEAD: 38f23a3 feat(ui): Koyfin Chunks 6–7 + COMET C0 token bridge
PARENT: 9cca83a Chunks 4–5
WORKING TREE: clean (untracked noise only — layout notes · backup · logo · root COMET inbox)
SHIPPED THIS TIP
- PR-6 #flipchartPanelMeta
- PR-7 #depthPanelMeta
- COMET C0 --wf-* slate + --ia-* bridge + density tokens (not applied)
- 01_Strategy_Docs/COMET_CSS_Refactor_Spec.md tracked

NEXT SESSION
- Read BUILD_TODO_List.md → "NEW SESSION — start here"
- COMET C1: apply --wf-header-h / rail-canvas padding in css/console_ia.css only
- Tests: koyfin_widget_shell (+ any density asserts) · build_web.sh · serve dist/
- Do not introduce .wtc-* · do not re-scaffold widgets
```

---

## July 9, 2026 — COMET CSS C0 (token bridge)

```text
CHUNK ID: COMET-C0
PHASE: UI Optimization (Koyfin-style shell CSS)
GOAL: Map COMET palette into --wf-*; bridge --ia-* onto --wf-*; no .wtc-* fork

CONTEXT
- Spec: 01_Strategy_Docs/COMET_CSS_Refactor_Spec.md (design language only)
- Rules: map don’t fork · hex → tokens · density application deferred to C1

CHANGES
- css/console_ia.css :root — COMET slate surfaces/borders/text → --wf-*
  · semantic --wf-ok / --wf-warn / --wf-risk (+ soft)
  · density tokens: --wf-header-h 44 · --wf-status-strip-h 24 · rail widths · radius control/widget
  · --ia-* aliases var(--wf-*) for single system
- css/console_ia.css [data-theme="light"] — same semantic token names (Whinfell light values)
- tests/koyfin_widget_shell.test.mjs — C0 token + no .wtc-* asserts

QA
- [x] koyfin_widget_shell · depth_ladders_widget · phase16 · shell_shortcuts PASS
- [x] build_web.sh OK
- [x] committed in 38f23a3
- [ ] browser-verify dark slate shell + light theme still desk-usable

NEXT SESSION
- COMET C1 shell density (apply --wf-header-h / padding) — see BUILD_TODO handoff
```

---

## July 9, 2026 — Koyfin UI Chunk 7 (Depth & Ladders panel polish)

```text
CHUNK ID: Koyfin-PR-7
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Depth card header meta + chrome parity; status row / viz / disclosure already assembled

CONTEXT
- Widget shell already had #widgetDepth · status row · ladder viz · assembleDepthLaddersWidget
- Structure intact — no re-scaffold; disclosure still relocated into depthLaddersContent
- Gap vs Cockpit/Radar/HY OAS/Flipchart: missing panel meta + panel min-height

CHANGES
- index.html — #depthPanelMeta in Depth header
- js/console_ia_shell.js — syncDepthPanelMeta (Applied/Pending/Stale · freshness · Viz · WARN)
  · invoked from syncDepthLaddersStatus (one source of truth)
- css/console_ia.css — depth min-height + meta chrome
- tests/koyfin_widget_shell.test.mjs · depth_ladders_widget.test.mjs — meta asserts

QA
- [x] koyfin_widget_shell.test.mjs PASS
- [x] depth_ladders_widget.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] shell_shortcuts.test.mjs PASS
- [x] build_web.sh OK → dist/
- [ ] commit (not requested this turn)
- [ ] browser-verify Depth meta after hydrate

NEXT SESSION
- Commit Chunks 6–7 if desired
- COMET CSS C0 token bridge (pairs with light theme PR-8) — see BUILD_TODO
- Playwright depth e2e timeout remains P2 (separate)
```

---

## July 9, 2026 — COMET CSS Refactor Spec → BUILD_TODO

```text
SOURCE: COMET CSS Refactor Spec.txt (inbox) → 01_Strategy_Docs/COMET_CSS_Refactor_Spec.md (canonical)
GOAL: Track Koyfin-style shell CSS without dual class system / layout thrash

INCORPORATED INTO BUILD_TODO
- Handoff specs list + paste block
- Full section: map COMET §1–12 → existing .wtm-ia-shell / .ia-* / .wf-panel / --wf-*
- Chunks C0–C7 (token bridge · density · nav · cards · actions · chips · links · responsive)
- Rules: map don’t fork · hex → tokens · no .wtc-* bulk rename · after PR-7 / with PR-8
- Highest priority 0d COMET C0–C6

STATUS: Spec tracked · implementation not started (queued after Chunk 7 Depth)
NEXT: Chunks 6–7 uncommitted · then COMET C0 token bridge (pairs with light theme PR-8)
```

---

## July 9, 2026 — Koyfin UI Chunk 6 (Flipchart panel polish)

```text
CHUNK ID: Koyfin-PR-6
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Flipchart pager + implications as one card; header meta chrome parity

CONTEXT
- Widget shell already relocated cockpitActions + cockpitDecisionRail into #iaFlipchartHost
- Structure had slide index, regime tag, keyboard hint — no re-scaffold
- Browser-verify: acceptance met (one card · ←→ / 1–5 / f / c still work)
- Gap vs Cockpit/Radar/HY OAS: missing panel meta + panel min-height

CHANGES
- index.html — #flipchartPanelMeta in Flipchart header
- js/console_ia_shell.js — syncFlipchartPanelMeta (pos · asset · regime) + MutationObserver
- css/console_ia.css — flipchart min-height + meta chrome
- tests/koyfin_widget_shell.test.mjs — meta + pager/implications relocation asserts

QA
- [x] koyfin_widget_shell.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] shell_shortcuts.test.mjs PASS
- [x] build_web.sh OK → dist/
- [x] browser-verify: meta "1/5 · Liq" → updates on flip; implications in card
- [ ] commit (not requested this turn)

NOTE
- scan_kpi_strip hasRcZones HTMLCollection.some can break renderAll (cockpit meta) — separate

NEXT SESSION
- Commit Chunk 6 if desired
- PR-7 Depth polish only if gaps (no re-scaffold)
- Then COMET CSS C0+ (see BUILD_TODO · COMET_CSS_Refactor_Spec.md)
```

---

## July 9, 2026 — Session handoff (Chunks 4–5 committed · tip 9cca83a)

```text
HEAD: 9cca83a feat(ui): Koyfin Chunks 4–5 — Radar and HY OAS panel meta
PARENT FEATURE: 825d9f4 Chunks 1–3
SHIPPED: PR-4 radarPanelMeta · PR-5 hyOasPanelMeta (no re-scaffold)
WORKING TREE: clean (untracked noise only)
NEXT SESSION: browser-verify → Chunk 6 Flipchart polish only if gaps
START: 01_Strategy_Docs/BUILD_TODO_List.md → "NEW SESSION — start here"
```

---

## July 9, 2026 — Koyfin UI Chunk 5 (HY OAS panel polish)

```text
CHUNK ID: Koyfin-PR-5
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: HY OAS as one widget with header meta; numerics/thesis/actions already assembled

CONTEXT
- Widget shell already had Numerics + Thesis subframes + hyOasHandoffActions
- assembleHyOasWidget relocates chart/basis/detail/handoff — no re-scaffold
- Plan gap polish: panel header glance + chrome parity with Cockpit/Radar

CHANGES
- index.html — #hyOasPanelMeta in HY OAS Proxy header
- js/console_ia_shell.js — syncHyOasPanelMeta (lead · reading) + MutationObserver
- css/console_ia.css — hy-oas min-height + meta chrome
- tests/koyfin_widget_shell.test.mjs — meta + Here's Why/Compare/Export asserts

QA
- [x] koyfin_widget_shell.test.mjs PASS
- [x] transmission_radar.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] wmc_ia_integration.test.mjs PASS
- [x] build_web.sh OK → dist/
- [x] committed with Chunk 4

NEXT SESSION
- Browser-verify HY OAS meta after mission read
- PR-6 Flipchart polish only if gaps (no re-scaffold)
```

---

## July 9, 2026 — Koyfin UI Chunk 4 (Radar + Risk Curve polish)

```text
CHUNK ID: Koyfin-PR-4
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Sibling Radar + Risk Curve cards; panel meta on Radar (no re-scaffold)

CONTEXT
- Widget grid + relocateNodes already had wf-panel--radar / wf-panel--risk-curve
- Plan gap: transmission_radar.js panel header meta (summary · weakest)
- Left rail keeps Curve · summary + CV code; full curve is grid card

CHANGES
- index.html — #radarPanelMeta in Transmission Signal Radar header
- js/transmission_radar.js — syncPanelMeta() on render; BUILD 1.2.0-CHUNK11-PANEL-META
- css/console_ia.css — radar/curve min-height + meta chrome; hide double .radar-title in #iaRadarHost
- tests — transmission_radar + koyfin_widget_shell panel / sibling asserts

QA
- [x] transmission_radar.test.mjs PASS
- [x] koyfin_widget_shell.test.mjs PASS
- [x] scan_kpi_strip.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] build_web.sh OK → dist/
- [x] committed with Chunk 5

NEXT SESSION
- Browser-verify Radar meta after hydrate
- PR-6 Flipchart polish only if gaps (after Chunk 5)
```

---

## July 9, 2026 — Session handoff (Chunks 1–3 committed)

```text
HEAD: 825d9f4 feat(ui): Koyfin Chunks 1–3 — topbar heal, icons-only left, cockpit meta
SHIPPED: PR-1 relocateTopBar · PR-2 left icons-only · PR-3 cockpit panel meta
WORKING TREE: clean (untracked noise only)
NEXT SESSION: browser-verify → Chunk 4 Radar + Risk Curve polish only if gaps
START: 01_Strategy_Docs/BUILD_TODO_List.md → "NEW SESSION — start here"
```

---

## July 9, 2026 — Koyfin UI Chunk 3 (Risk Cockpit panel polish)

```text
CHUNK ID: Koyfin-PR-3
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Risk Cockpit as one wf-panel card with live header meta

CONTEXT
- Widget shell + rc-widget-card layout already at consolidation
- Polish only: panel meta + chrome lock (no tile content rewrite)

CHANGES
- index.html — #riskCockpitPanelMeta in Risk Cockpit wf-panel header
- js/scan_kpi_strip.js — syncPanelMeta() Score · Gate · Regime on renderStrip
- css/console_ia.css — cockpit min-height + meta ellipsis
- tests — koyfin_widget_shell + scan_kpi_strip panel meta asserts

QA
- [x] scan_kpi_strip.test.mjs PASS
- [x] koyfin_widget_shell.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] build_web.sh OK
- [x] committed in 825d9f4 with Chunks 1–2

NEXT SESSION
- Browser-verify · PR-4 Radar + Risk Curve polish only if gaps
```

---

## July 9, 2026 — Koyfin UI Chunk 2 (left icons-only collapse)

```text
CHUNK ID: Koyfin-PR-2
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Collapsed left rail shows codes/icons, not blank (display:none bug)

CONTEXT
- Chunk 1 relocated topbar; icons-only CSS already existed at bottom of console_ia.css
- Early rule body.ia-left-collapsed .ia-left-body { display: none } hid the whole rail

CHANGES
- css/console_ia.css — remove display:none; keep flex body; 44px collapsed width;
  3-col workspace when left collapsed; RC/RD/HY/FL/DP/S/D/I + BW/MC/BB/LD/CV codes
- index.html — title tooltips on Scan/Dig/Iterate layer tabs
- js/console_ia_shell.js — setLeftCollapsed aria-expanded + aria-label
- tests/koyfin_widget_shell.test.mjs — assert no display:none on collapsed left body

QA
- [x] koyfin_widget_shell.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] shell_shortcuts.test.mjs PASS
- [x] build_web.sh OK

NEXT SESSION
- Browser-verify: left collapse codes + top strip + expand labels
- Commit Chunk 1+2 when Clark ready
- Then PR-3 Risk Cockpit polish only if gaps remain
```

---

## July 9, 2026 — Koyfin UI Chunk 1 (TopShell / dist heal)

```text
CHUNK ID: Koyfin-PR-1
PHASE: UI Optimization (Koyfin dashboard track)
GOAL: Unified TopShell · stop serving stale dist · small verified steps only

CONTEXT
- Prior session thrash (whinfell-* classes, inline topbar, codes, Operator Precision) broke UI
- Reverted to consolidation HEAD 589995f
- Root already had full shell + widget grid; dist/ (gitignored) had experimental inline topbar

CHANGES
- bash scripts/build_web.sh — resync dist/index.html from root (btnTheme · slim topbar · utility mount)
- js/console_ia_shell.js — relocateTopBar() ensures header.console-topbar → #iaTopBody
- tests/koyfin_widget_shell.test.mjs — assert relocateTopBar present
- 01_Strategy_Docs/BUILD_TODO_List.md — NEW SESSION handoff + PR track

QA
- [x] koyfin_widget_shell.test.mjs PASS
- [x] phase16_integration.test.mjs PASS
- [x] shell_shortcuts.test.mjs PASS
- [x] scan_kpi_strip.test.mjs PASS
- [x] root index.html md5 == dist/index.html

NEXT SESSION
- Chunk 2: fix body.ia-left-collapsed .ia-left-body { display: none } vs icons-only rules
- Then browser-verify collapse; only then Chunk 3+ polish if still needed
- Commit Chunk 1 when Clark ready
```

---

## July 7, 2026 — Desk ops unify + Specialized tools rail

```text
PHASE: TC UX
GOAL: One Collect CSVs · one Refresh data · specialized tools nav · fix ladder + BasisWatch

FILES: js/desk_data_ops.js · css/desk_ops.css · js/top_utility_registry.js · js/auto_collect_panel.js · index.html · Whinfell_BasisWatch.html · Whinfell_Midwest_Compute_Crush.html · bang_bang_da_machine.html · Crypto_Analytics.html · whinfell-transmission-ladder-deep-dive.html · js/desk_chart_links.js · js/desk_china_chart_links.js · documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md

CHANGES
- Header: Collect CSVs (btnMorningCollect) + Refresh data (btnDeskRefresh) — all tools
- Specialized tools rail: BasisWatch · Midwest Crush · Bang Bang Da ↗ · Ladder deep dive ↗
- Removed per-panel Collect/Refresh from BasisWatch + Midwest embed
- Ladder deep dive: root HTML + js/* script paths + v7 storage keys
- BasisWatch standalone: css/basis_watch.css path fix

QA: wmc_ia_integration.test.mjs PASS · auto_collect_panel.test.mjs PASS · build_web.sh OK
```

---

## July 7, 2026 — Bang Bang Da Machine v1.2

```text
PHASE: BBDM
GOAL: RV Z-score scanner — 5 trades · live rv_history · eth_calendar · API window hook

FILES TOUCHED: bang_bang_da_calculator.py · bang_bang_da_machine.html · bang_bang_da/README.md · whinfell_pipeline/rv_history.py · whinfell_pipeline/data_dictionary.yaml · scripts/enrich_hydration_rv.py · scripts/bang_bang_da_server.py · scripts/Bang_Bang_Da.command · scripts/build_web.sh · tests/test_bang_bang_da.py · docs/data/hydration/latest.json · docs/data/hydration/rv_history.json

CHANGES
- v1.0→v1.2: five trade sleeves (Midwest Compute · BTC/ETH calendar · SOFR/FF · 2s10s)
- rv_history: daily points from bundle/sidecar; Z = (last−μ)/σ over 30/60/90d window
- enrich_hydration_rv: injects eth_calendar_et_near_deferred + rv_history into latest.json
- bang_bang_da_server :8766 — UI window selector calls /api/report?window=
- Bang_Bang_Da.command — enrich → score → API → open HTML

QA
- [x] test_bang_bang_da.py PASS
- [x] enrich: 6 rv_history series · eth_calendar=yes
- [x] API window=30/60 curl OK

NEXT: Barchart ETM26 live history · desk ratings · commit stack
```

---

## July 5, 2026 — UI Revamp Phase 16 (Final Integration)

```text
CHUNK ID: 16
PHASE: 16
GOAL: IA shell activation + right-rail commentary + dictionary + zoom-safe ship

FILES TOUCHED: index.html · js/console_ia_shell.js (new) · js/core.js · js/commentary_feed.js · js/basis_watch_panel.js · css/console_ia.css · css/main.css · css/basis_watch.css · scripts/build.sh · tests/phase16_integration.test.mjs (new) · tests/phase23_console_depth.test.mjs · tests/transmission_radar.test.mjs · BEST_PRACTICES.md · BUILD_TODO_List.md · Progress_Log.md

CHANGES
- Activated .wtm-ia-shell with 3-column workspace (left nav · center canvas · right decision rail)
- console_ia_shell.js: boot-time node relocation, layer tabs (scan/dig/iterate), ia-shell-active
- Commentary feed anchored on right rail inside #cockpitDecisionRail (not left nav or bottom)
- Dictionary drawer wired from DD badge via WTM_DataDictionary
- Mission Read zoom-safe: cockpitDataViewport scroll, compact header, collapsed full read
- Basis Watch zoom-safe: methodology + external sources in collapsed details, wrapping toolbar
- build.sh ships all Phase 1–16 modules with smoke greps

QA
- [x] phase16_integration + full regression suite PASS (11 tests)
- [x] build.sh PASS
- [x] C6/C7/C8/C9/C10 resolved

NEXT: Desk walk-through — go-live gate
```

---

## July 5, 2026 — UI Revamp Chunk 12 (Move depth down)

```text
CHUNK ID: 12
PHASE: 15
GOAL: Basic view = top + left rail + Radar hero; command bar & ladders below fold

FILES TOUCHED: index.html · css/main.css · tests/phase23_console_depth.test.mjs (new) · tests/transmission_radar.test.mjs · BEST_PRACTICES.md · BUILD_TODO_List.md · Progress_Log.md

CHANGES
- Wrapped #commandBar + #suggestionTray in #consoleDepthDisclosure (collapsed <details>)
- DOM order: scanKpiStrip → transmissionRadar → nodeCockpitZone → consoleDepthDisclosure → basisWatchPanel
- CSS: .console-depth-summary, flex-shrink: 0, scroll-on-open (max-height 45vh)
- #transmissionRadar flex-grow for dominant hero in primary viewport
- C6 resolved: scan strip owns default KPIs; command bar opt-in via Depth

COPY CHANGES
- before: command bar always visible between radar and cockpit
- after: "Depth · Command bar & ladders" one-line summary; expand for full band

UI EFFECT
- First viewport: header + scan + dominant radar + node rail + cockpit
- Command bar / ladders / gate detail accessible via Depth disclosure
- All element IDs preserved — no render-path breakage

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (phase23_console_depth + transmission_radar + scan + command_bar + safe_boot + phase23 PASS)
- [x] basic view still functional
- [x] C6 resolved

REMAINING
- Phase 16: full IA shell, Basis Watch center-first, commentary rail, build.sh modules

NEXT CHUNK: Phase 16 integration (not started this session)
```

| Item | Status | Notes |
|------|--------|-------|
| Depth disclosure | **Shipped** | `#consoleDepthDisclosure` |
| DOM reorder | **Shipped** | cockpit above depth band |
| Tests | **PASS** | phase23_console_depth + regression suite |

---

## July 5, 2026 — UI Revamp Chunk 11 (Radar wiring)

```text
CHUNK ID: 11
PHASE: 14
GOAL: Wire Transmission Signal Radar to live ladder nets + weakest link
FILES TOUCHED: js/transmission_radar.js · css/transmission_radar.css · js/core.js · index.html · tests/transmission_radar.test.mjs · BUILD_TODO_List.md

CHANGES
- buildRadarDisplay(ctx) — ladder nets from health.summary.stageNets via kpiCtx
- Per-sleeve WTM_DataStates (healthy / not_computed / stale) + data-data-state attrs
- Weakest sleeve highlight (.radar-sleeve--weakest) from health.weakestIdx
- render(kpiCtx) replaces renderShell() in renderCommandBar()
- Summary face: "{label} · {score}" when hydrated

COPY CHANGES
- Sleeve face: net (+2 / -3 / 0) · cue: Confirming / Dragging / Flat / etc.
- Weakest: short label (Cred · Liq · BTC)
- Unhydrated: typed "Not computed" / "Pending" — no silent dashes

UI EFFECT
- Radar hero shows live transmission ladder at a glance
- Weakest link visually obvious in sleeve grid

QA
- [x] transmission_radar.test.mjs PASS
- [x] scan · command_bar · safe_boot · phase23 regression PASS

REMAINING
- Chunk 12: depth demotion (stow command bar + ladders)

NEXT CHUNK: 12 — Move depth down
```

| Item | Status | Notes |
|------|--------|-------|
| Radar wiring | **Shipped** | `render(kpiCtx)` |
| Weakest highlight | **Shipped** | `.radar-sleeve--weakest` |
| Tests | **PASS** | transmission_radar + regression suite |

---

## July 5, 2026 — UI Revamp Chunk 10 (Radar shell)

```text
CHUNK ID: 10
PHASE: 13
GOAL: Transmission Signal Radar — dominant hero object below scan strip
FILES TOUCHED: js/transmission_radar.js (new) · css/transmission_radar.css (new) · index.html · js/core.js · tests/transmission_radar.test.mjs (new) · tests/dom_shim.mjs · BEST_PRACTICES.md · BUILD_TODO_List.md · whinfell_ui_revamp_grok_build.md

CHANGES
- WTM_TransmissionRadar module — RADAR_SLEEVE_REGISTRY (5 sleeves) + RADAR_DISPLAY + renderShell()
- #transmissionRadar mount between #scanKpiStrip and #commandBar
- Hero card CSS — bordered panel, 5-column sleeve grid, responsive breakpoints
- renderAll() calls renderShell() (no live data — Chunk 11)

COPY CHANGES
- Title: "Transmission Signal Radar"
- Empty state: "Not wired" · sleeves "—" / "Pending" · "Weakest: —"

UI EFFECT
- First viewport gains one obvious center hero below scan strip
- Scan strip and command bar unchanged

QA
- [x] top viewport calmer (hero adds structure, not noise)
- [x] controls consistent
- [x] no regressions (transmission_radar · signal_detail · scan · command_bar · commentary · phase23 · safe_boot PASS)
- [x] basic view still functional
- [x] Anti-AI copy — terse operator labels only

REMAINING
- Chunk 11: wire live sleeve data + weakest link
- Chunk 12: depth demotion

NEXT CHUNK: 11 — Radar wiring
```

| Item | Status | Notes |
|------|--------|-------|
| Radar shell | **Shipped** | `transmission_radar.js` |
| Sleeve placeholders | **Shipped** | Liq · Cred · Brd · BTC · Basis |
| Tests | **PASS** | transmission_radar + regression suite |

---

## July 5, 2026 — UI Revamp Chunk 09 (signal detail rewrite)

```text
CHUNK ID: 09
PHASE: 12
GOAL: Signal detail drawer reads as operator console — short, direct, actionable copy
FILES TOUCHED: js/signal_detail_copy.js (new) · js/core.js · index.html · tests/signal_detail_copy.test.mjs (new) · BEST_PRACTICES.md · BUILD_TODO_List.md · whinfell_ui_revamp_grok_build.md

CHANGES
- New WTM_SignalDetailCopy module — SIGNAL_DETAIL_DISPLAY template registry
- buildExecutiveBullets() fills Whinfell Score · Transmission · Gate · Shock · Freshness
- buildWhyExplanations() delegates five drawer sections to registry (layout unchanged)
- Bullet labels: State / Drivers / Trigger (replaces report-style labels)
- index.html loads signal_detail_copy.js before core.js

COPY CHANGES
- before: "Whinfell 58 — Amber 50–64 band: minimum carry sleeve; sessions like this tend to pay carry for clients (~40–55% win-rate)…"
- after: "Score 58. Amber band. Minimum carry sleeve — ¼–½ prop size."
- before: "Current state / Historical analog / Would change if" labeled bullets with historically/past-session prose
- after: "State / Drivers / Trigger" with terse desk lines — no win-rates, no synthetic history

UI EFFECT
- Signal detail drawer sounds like a desk readout, not an AI report
- No layout or functional changes to drawer structure

QA
- [x] top viewport calmer (unchanged — copy-only)
- [x] controls consistent
- [x] no regressions (signal_detail_copy · commentary_collapse · scan · command_bar · phase23 · safe_boot PASS)
- [x] basic view still functional
- [x] scoped checklist — no AI prose in drawer executive sections

REMAINING
- Chunk 10: Radar shell below scan strip
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 10 — Radar shell
```

| Item | Status | Notes |
|------|--------|-------|
| SIGNAL_DETAIL_DISPLAY registry | **Shipped** | `js/signal_detail_copy.js` |
| Executive drawer wiring | **Shipped** | five sections via `buildWhyExplanations()` |
| Tests | **PASS** | signal_detail_copy · regression suite |

---

## July 5, 2026 — UI Revamp Chunk 03 (compress KPI copy)

```text
CHUNK ID: 03
PHASE: 6
GOAL: Top strip scans faster — one-line tile faces, rationale deferred
FILES TOUCHED: js/scan_kpi_strip.js · docs/js/scan_kpi_strip.js · tests/scan_kpi_strip.test.mjs · BEST_PRACTICES.md · BUILD_TODO_List.md · whinfell_ui_revamp_grok_build.md

CHANGES
- SCAN_DISPLAY.compactFace + maxFaceDeltaChars (28) + short stateHints
- RATIONALE_BUILDERS defer long copy to title + hidden expand panel
- gateFace uses SEMANTIC_DISPLAY.faceDelta config only (no rule/label fallthrough)
- Chunk 03 acceptance tests: single-line faces, no import prose, gate rule in rationale only

COPY CHANGES
- before: gate delta could show full rule text (e.g. "Score required") mixed with diagnostic prose
- after: face shows "BTC modules off" / "Half-size BTC" / etc.; full rule in title + expand

UI EFFECT
- Scan strip reads as value + short cue; no mental-math or hydration instructions on tile faces

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (scan_kpi_strip · phase23 · top_utility_registry PASS)
- [x] basic view still functional
- [x] scoped checklist §8 passes

REMAINING
- Chunk 04: badge reduction in scan strip + command bar

NEXT CHUNK: 04 — Badge reduction
```

| Item | Status | Notes |
|------|--------|-------|
| SCAN_DISPLAY compact faces | **Shipped** | `resolveFaceDelta()` |
| Rationale deferred | **Shipped** | `title` + `⋯` expand |
| Tests | **PASS** | scan_kpi_strip · phase23 |

---

## July 5, 2026 — UI Revamp Chunk 08 (collapse commentary)

```text
CHUNK ID: 08
PHASE: 11
GOAL: First viewport prose reduced — rationale behind disclosure toggles
FILES TOUCHED: index.html · css/main.css · js/core.js · js/command_bar_kpis.js · js/scan_kpi_strip.js · tests · BEST_PRACTICES.md · BUILD_TODO_List.md · whinfell_ui_revamp_grok_build.md

CHANGES
- Decision-strip .meta wrapped in <details class="cmd-meta-disclosure"> (default closed)
- Mission read: #basisTacticalLead one-line face; full sentence in #basisTacticalDisclosure
- Ladder clusters collapsed via #cmdLadderDisclosure; freshness sources in nested disclosure
- syncMetaDisclosure / syncFreshnessSubDisclosure hide empty toggles
- Scan strip expand button hidden when tile has no rationale

COPY CHANGES
- Mission read default face shows short lead (text before first semicolon) instead of full paragraph

UI EFFECT
- Command bar scans as values + labels; rationale on demand via Rationale / Full read / Ladders toggles
- Mission read no longer reads like an open report in the center canvas

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (commentary_collapse · command_bar · phase23 · scan tests PASS)
- [x] basic view still functional
- [x] scoped checklist §9 partial pass

REMAINING
- Chunk 10: Radar shell
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 10 — Radar shell
```

| Item | Status | Notes |
|------|--------|-------|
| Command-bar disclosures | **Shipped** | `.cmd-meta-disclosure` |
| Mission read collapse | **Shipped** | lead + `Full read` |
| Tests | **PASS** | commentary_collapse · phase23 |

---

## July 5, 2026 — UI Revamp Chunk 07 (typography reset)

```text
CHUNK ID: 07
PHASE: 10
GOAL: Compact dashboard type ladder — ≤4 distinct sizes in first viewport
FILES TOUCHED: css/main.css · index.html · docs/css/main.css · BEST_PRACTICES.md · BUILD_TODO_List.md · whinfell_ui_revamp_grok_build.md

CHANGES
- Four-tier :root tokens — --type-title 15px · --type-metric 15px · --type-body 13px · --type-label 12px
- Utility classes .type-title / .type-metric / .type-body / .type-label
- Header, scan strip, kpi-band, metric-card wired to ladder; command-bar strong 34px → 15px
- First-viewport inline text-[Npx] replaced with .console-hydration-badge, .kpi-band-chip, .kpi-band-inline-link
- Tabular numerals enforced on scan-kpi-value and metric-card strong

COPY CHANGES
- none (typography-only chunk)

UI EFFECT
- First viewport uses four consistent sizes instead of 7–10px micro-type sprawl
- Clear hierarchy: title > metric > body > label; scan strip and command bar align visually

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (scan · command bar · phase23 tests PASS)
- [x] basic view still functional
- [x] scoped checklist §6 pass

REMAINING
- Chunk 08: collapse commentary (hide long rationale by default)
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 08 — Collapse commentary
```

| Item | Status | Notes |
|------|--------|-------|
| Type ladder tokens | **Shipped** | 15 / 15 / 13 / 12 px |
| First-viewport wiring | **Shipped** | header · scan · kpi-band |
| Tests | **PASS** | scan · command bar · phase23 |

---

## July 5, 2026 — UI Revamp Chunk 06 (light contrast pass)

```text
CHUNK ID: 06
PHASE: 9
GOAL: Light mode desk-usable — functional text readable, surfaces clearly separated
FILES TOUCHED: css/main.css · docs/css/main.css · BEST_PRACTICES.md · BUILD_TODO_List.md

CHANGES
- Light theme token ladder: --text #121820 · --muted #3a4550 · --muted-tertiary #56616c · --border-strong
- Card/panel borders + shadows strengthened (metric-card, exec-card, scan-kpi-tile, panel zones)
- Scan tiles: white background in light mode (replaces dark rgba overlay)
- Header, chips, buttons: functional text mapped to tokens; accent blues/ambers darkened for contrast

COPY CHANGES
- none (CSS-only chunk)

UI EFFECT
- Light mode labels and KPI values noticeably darker; cards and panels separate cleanly from page bg
- Tertiary copy (meta, placeholders, regime sub) visually subordinate via --muted-tertiary

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (phase23_console.test.mjs PASS)
- [x] basic view still functional
- [x] scoped checklist §7 pass

REMAINING
- Chunk 07: typography reset (compact type ladder)
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 07 — Typography reset
```

| Item | Status | Notes |
|------|--------|-------|
| Light theme tokens | **Shipped** | `--border-strong` · `--muted-tertiary` |
| Surface separation | **Shipped** | cards · scan tiles · panel zones |
| Tests | **PASS** | scan · command bar · phase23 |

---

## July 5, 2026 — UI Revamp Chunk 05 (clarify semantics)

```text
CHUNK ID: 05
PHASE: 8
GOAL: Score, Gate, Shock self-evident in <2s without opening drawers
FILES TOUCHED: js/scan_kpi_strip.js · js/command_bar_kpis.js · js/core.js · css/main.css · index.html · docs mirrors · tests · BEST_PRACTICES.md · BUILD_TODO_List.md

CHANGES
- SEMANTIC_DISPLAY config — scan strip labels, subtitles, face deltas for Score / Gate / Shock
- GATE_STRIP_DISPLAY + gateStripTitle() — BLOCKED/TIGHT RISK/OPEN → plain-English dominant values
- SEMANTIC_CARD_DISPLAY — command-bar score zone prefix, shock face/meta copy
- CSS semantic tiles (.scan-kpi-tile--score/gate/shock) + command cards (.gate-card, .shock-card)
- index.html labels: Risk Score · BTC Gate · Shock overlay

COPY CHANGES
- before: Score / Gate / Shock · BLOCKED · Clear / No active shock
- after: Risk Score (Whinfell composite) · BTC Gate (Sizing permission) · Shock overlay · No new BTC / Reduced sizing / Full access · No scenario

UI EFFECT
- First viewport tiles name what each metric means; gate and shock states read in desk English at a glance
- Subtitles under scan labels; tinted semantic chrome distinguishes the three tiles

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (phase23_console.test.mjs PASS)
- [x] basic view still functional
- [x] scoped checklist §1 partial pass

REMAINING
- Chunk 06: light contrast pass
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 06 — Light contrast pass
```

| Item | Status | Notes |
|------|--------|-------|
| `SEMANTIC_DISPLAY` + subtitles | **Shipped** | scan strip TILE_REGISTRY |
| `GATE_STRIP_DISPLAY` | **Shipped** | `gateStripTitle()` in `core.js` |
| Semantic CSS | **Shipped** | scan tiles + gate/shock cards |
| Tests | **PASS** | `scan_kpi_strip.test.mjs` · `command_bar_data_states.test.mjs` · `phase23_console.test.mjs` |

---

## July 5, 2026 — UI Revamp Chunk 04 (badge reduction)

```text
CHUNK ID: 04
PHASE: 7
GOAL: Cut badge count ~50% in first viewport; keep essential state signals
FILES TOUCHED: js/scan_kpi_strip.js · js/command_bar_kpis.js · css/main.css · tests/scan_kpi_strip.test.mjs · tests/command_bar_data_states.test.mjs · BEST_PRACTICES.md · BUILD_TODO_List.md

CHANGES
- BADGE_DISPLAY config — visible badges only for blocked · quarantined · stale · partial
- resolveBadge() helpers in scan strip + command bar (config-driven, not inline render branches)
- Decision-strip card badges suppressed; SQ3 band chip hidden without live band
- CSS: .scan-kpi-badge--hidden · .ds-state-badge--hidden · .gate-chip deferred

COPY CHANGES
- before: every scan tile + command card showed state badge text (Healthy / Not computed / …)
- after: typed dominant values + tile chrome carry calm states; badges only on exceptional states

UI EFFECT
- Default unhydrated viewport: 0 visible KPI badges (was ~11 across scan + command bar)
- Blocked/partial/stale still surface short badge labels; full reason in title / expand / Signal detail

QA
- [x] top viewport calmer
- [x] controls consistent
- [x] no regressions (phase23_console.test.mjs PASS)
- [x] basic view still functional
- [x] scoped checklist §5 pass

REMAINING
- Chunk 05: clarify Score / Gate / Shock labels
- Chunk 12: retire duplicate command-bar band

NEXT CHUNK: 05 — Clarify semantics
```

| Item | Status | Notes |
|------|--------|-------|
| `BADGE_DISPLAY` config | **Shipped** | scan strip + command bar |
| CSS badge suppression | **Shipped** | hidden classes + gate-chip + sq3 band |
| Tests | **PASS** | `scan_kpi_strip.test.mjs` · `command_bar_data_states.test.mjs` · `phase23_console.test.mjs` |

---

## July 5, 2026 — One-click Barchart/Koyfin CSV collect (Phase 2.3)

| Item | Status | Notes |
|------|--------|-------|
| Collect agent | **Shipped** | `scripts/whinfell_collect_agent.py` · `127.0.0.1:8767` · morning / fetch / status / Terminal fallback |
| UI bridge | **Shipped** | `js/auto_collect_panel.js` → `WTM_AutoCollect` · clipboard fallback when agent offline |
| WTC header button | **Shipped** | `btnMorningCollect` → `morning_auto_collect.sh` |
| BasisWatch buttons | **Shipped** | `btnBwCollect` · standalone `BC ↓` / `KF ↓` single-fetch |
| Midwest Compute Crush | **Shipped** | `btnWmcCollect` in sticky nav |
| `.command` launcher | **Updated** | `Whinfell_Morning_Collect.command` auto-starts agent if down |
| Tests | **PASS** | `auto_collect_panel.test.mjs` · `test_collect_agent.py` · `phase23_console.test.mjs` |
| Care Package | **Updated** | `Whinfell_Care_Package_20260705.md` |

**Operator path:** start agent once → serve desk → click **Collect CSVs** → Comet fetch → `daily --chain` → Import hydration.

---

## July 4, 2026 — Phase 2.3 boot fix (hydration hang)

| Item | Status | Notes |
|------|--------|-------|
| Root cause | **Found** | `WTM_BasisWatch.refresh(..., { renderAll })` re-entered `renderAll` → infinite async ping-pong |
| Fix | **Shipped** | `renderAllCore` passes `{}` to BasisWatch; `runBootSequence()` + fallbacks |
| `safe_boot=1` render | **PASS** | `tests/safe_boot_render.test.mjs` |
| Phase 2.3 regression | **PASS** | `phase23_console.test.mjs` · `task_force_wtm_export.test.mjs` |
| Care Package | **Updated** | `Whinfell_Care_Package_20260704.md` |

**Debug flags:** `?safe_boot=1` · `?boot_log=1` · `?boot_log=0` (quiet)

---

## July 4, 2026 — Phase 2.3 evening (full morning chain)

| Item | Status | Notes |
|------|--------|-------|
| Drop readiness | **PASS** | `ready=6/6` · `koyfin_rates` · `koyfin_equities` · `koyfin_china` · `koyfin_import_core` · `koyfin_flows_global` · `barchart_futures_intraday` |
| `daily --chain` | **PASS** | `collect_exit=0` · `hydrate_exit=0` · `barchart_exit=0` · `files_staged=11` |
| Hydration copy | **PASS** | `as_of=2026-07-04T20:52:57+00:00` · `freshness_status=fresh` · `snapshot_id=global-2026-07-04-raw2wtm-01` |
| Task Force live merge | **PASS** | `--gatherer` on fresh bundle + complete stub specialists · `--merge` · `validation_status=complete` · WATCH @ 30% |
| Phase 2.3 tests | **PASS** | `phase23_console.test.mjs` · `task_force_wtm_export.test.mjs` · `test_merge_task_force.py` · `test_data_dictionary.py` |
| `koyfin_WTM-*` normalize rules | **Shipped** | Added rates/equities/china globs to `data_dictionary.yaml` (TC + Cousins sync) |

**Pipeline global (post-chain):** `whinfell_score=61` · `transmission_state=elevated` · `sq3_band=Impaired`  
**Task Force WTM (merged):** `whinfell_score=69` · `Source Channel: task_force` · `verdict=WATCH`

---

## Lessons learned (Jul 4, 2026)

| Lesson | Impact | Action |
|--------|--------|--------|
| Playwright auto-download filenames (`koyfin_WTM-{View}_*`) did not match legacy normalize globs | 12 CSVs quarantined on first chain run despite `ready=6/6` | Added `koyfin_WTM-Rates-Credit_*` · `koyfin_WTM-Equities-Breadth_*` · `koyfin_WTM-China-Policy_*` rules; sync TC → Cousins before next `--chain` |
| `--gatherer` alone sets `validation_status=partial` and drops WTM | Phase 2.3 tests fail without `task_force.wtm_export_v21` | Merge pattern: live DataGatherer snapshot + retained complete specialist stub until Grok 12-step runs |
| `prepareHydrationBundle()` saves ~58KB parse cost | Desk boot faster on 118KB bundle | Keep `DD_META_POLLING_ENABLED=false` and `?safe_boot=1` for offline desk work |
| Pipeline `global` (61) vs Task Force WTM (69) | Two authority layers coexist in raw bundle | Console promotes `Source Channel: task_force` on import; pipeline score visible in `task_force.snapshot.global` |
| Comet headed fetch is the supported path | Headless Barchart blocked by CloudFront | Morning launcher skips unwired targets; `fetch` opens manual tab on failure |
| BasisWatch must not call `renderAll` from inside `renderAll` | `safe_boot=1` desk hung with clean console | `renderAllCore` passes `{}` to `WTM_BasisWatch.refresh` |

---

## July 3, 2026 — SLIM handoff (session stop)

| Item | Status |
|------|--------|
| Slim care package | **Shipped** → `08_Deliverables/Whinfell_Care_Package_SLIM_20260703.md` |
| BUILD TODO refresh | **Updated** — gate = Clark Koyfin URLs + desk ratings |
| Task Force v1.1.0 Chunk 3 | **Done** — merge script · WTM tests · stub `complete` in bundle |
| WTM-BTC-Basis routing | **Done** (Cousins) — Barchart `BTM26` spreads only; removed from `koyfin_saved_views` |
| Live Grok Task Force chain | **Queued** — manual run post Clark URL wire |
| Control UI chips | **Deferred** post-gate |

---

## July 3, 2026 — Auto CSV Download Chunk 4 partial (Koyfin)

| Item | Status | Notes |
|------|--------|-------|
| KoyfinAdapter v0.3.0 | **Shipped** | `whinfell_pipeline/auto_download/adapters/koyfin.py` · WTM* view rules · shareable URL policy (`/myw/`, `/myd/`, `/mychart/`) |
| Watchlist export (`/myw/`) | **Verified** | Live probe: `get_by_role("button", name="Download")` → direct CSV · Ticker header validates |
| Wired targets ready | **Ready** | `koyfin_import_core` · `koyfin_flows_global` — share URLs in Cousins `desk_urls.yaml` |
| Graph export (`/myd/`, `/mychart/`) | **Blocked** | SHOW TABLE → Download Available Data **not found** on probed dashboard/graph pages; EXPORT opens PNG modal |
| Blocked share URLs | **Clark** | `koyfin_rates`, `koyfin_china`, `koyfin_equities` still `https://app.koyfin.com/` in manifest |
| Unit tests | **PASS** | `tests/test_koyfin_adapter.py` |
| Morning launcher | **Shipped** | `scripts/morning_auto_collect.sh` · `~/Desktop/Whinfell_Morning_Collect.command` |
| Chunk 4c next | **Queued** | Live `fetch` wired watchlists only — do not probe-loop graph UI |

**Credentials:** `KOYFIN_LOGIN_EMAIL` / `KOYFIN_LOGIN_PASSWORD` env vars only (never commit).

**Cousins `data_dictionary.yaml`:** Ongoing changes in pipeline archive preserved — TC does not modify.

---

## July 3, 2026 — Auto CSV Download Chunk 3 (Barchart intraday)

| Item | Status | Notes |
|------|--------|-------|
| Auto-download scaffold (Chunk 2) | **Shipped** | `run_auto_download.py` · `whinfell_pipeline/auto_download/` · manifest loader from Cousins `collection_manifest.yaml` + `desk_urls.yaml` |
| Barchart intraday adapter (Chunk 3) | **Shipped** | Comet browser via Playwright · profile `~/.whinfell/comet_profile` · `viewName=197689` |
| Live fetch verified | **PASS** | `watchlist-wtm-canonical-universe-intraday-07-03-2026.csv` → `~/Downloads/whinfell_drop` · validates · `barchart_futures_intraday` status **ready** |
| Session / login | **Shipped** | `run_auto_download.py login` (interactive) · auto-login via `BARCHART_LOGIN_EMAIL` / `BARCHART_LOGIN_PASSWORD` env vars |
| Unit tests | **PASS** | `tests/test_auto_download_scaffold.py` · `tests/test_barchart_adapter.py` |

**Design authority:** `08_Deliverables/AUTO_CSV_DOWNLOAD_DESIGN_20260703.md`

---

## July 3, 2026 — Pipeline integration status

| Layer | Status | Detail |
|-------|--------|--------|
| Export → drop | **Live** | `run_auto_download.py fetch --id barchart_futures_intraday` |
| Drop validation | **Live** | `validate_barchart_csv` · pattern match `watchlist-*-intraday-*.csv` |
| Status / plan CLI | **Live** | `run_auto_download.py status` · `plan` |
| Pipeline bridge scaffold | **Partial** | `PipelineBridge` → `run_batch_collect.py normalize` + `run` wired in `daily --chain` |
| End-to-end hydrate | **Not verified** | Chunk 5 gate: `hydrate_exit=0` after `--chain` with required batch |
| Koyfin auto-fetch | **Partial** | Watchlist `/myw/` verified · graph flow blocked on share URLs |
| Morning launcher | **Shipped** | `morning_auto_collect.sh` + `Whinfell_Morning_Collect.command` |

**Cousins pipeline root:** `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` (auto-detected)

---

## July 3, 2026 — Open issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Koyfin graph share URLs missing | **Blocking graph flow** | `koyfin_rates`, `koyfin_china`, `koyfin_equities` need shareable URLs where SHOW TABLE is visible |
| Koyfin watchlist live fetch (Chunk 4c) | **Next** | `koyfin_import_core` + `koyfin_flows_global` — adapter ready, awaiting formal `fetch` run |
| Comet profile isolation | Medium | Playwright uses `~/.whinfell/comet_profile`, not the operator's live Comet window; first login or env credentials required |
| Barchart headless blocked | Low | CloudFront rejects headless; Comet headed fetch is the supported path |
| Hydration bundle aging | Medium | Bundled `latest.json` · `freshness_status=aging` |
| Live desk ratings empty | **Blocking go-live sign-off** | Operator table in `Desk_Feedback_Log.md` not yet filled |
| ARCH-4 curve history | Medium | Not started |

---

## Phase 2.2 — Desk testing (July 3, 2026)

| Item | Status |
|------|--------|
| BUILD_MASTER_PROMPT chunks 1–4 | **Accepted complete** |
| 5 mission surfaces | **Shipped** |
| RV/Basis table fix | **Shipped** |
| UI refactor | **Shipped** |
| Documentation & Care Package | **Updated** → `Whinfell_Care_Package_20260703.md` |
| Live desk walk-through | **In progress** — Clark / Wes |
| Hydration bundle | `global-2026-06-30-raw2wtm-01` |
| New UI / feature work | **HOLD** until operator ratings logged |

---

## July 3, 2026 — Desk-readiness stabilization (BUILD_MASTER_PROMPT)

| Item | Status | Notes |
|------|--------|-------|
| Chunk 1 — RV/Basis spot-fallback | **Shipped** | `resolveRvHorizonValueFallback` · `buildRvHorizonEvidenceMarkup` · CSS `focus-horizon-table--spot-fallback` |
| Chunk 2 — Mission surfaces ×5 | **Shipped** | Unified tactical banner · summary strip · implication rail |
| Chunk 3 — Data refresh (TC) | **Shipped** | `scripts/normalize_drop.py` · resilient `full_barchart_hydration.py` · `docs/data/hydration/latest.json` in build |
| Chunk 4 — Desk docs | **Shipped** | `08_Deliverables/Desk_Feedback_Log.md` · test steps for Clark/Wes |
| In-repo tests | **Shipped** | `tests/rv_horizon_fallback.test.mjs` · `run_desk_probes.mjs` · `freshness_indicators.test.mjs` |
| Probe hardening | **Shipped** | `ensureCockpitMissionView` reset · `__rvHorizonEvidenceProbe` restores mission view |
| Probe spot formatting | **Deferred** | Uncommitted tweak parked — no code until desk feedback |

**Build:** `TC_CONSOLE_BUILD = 1.5-BUILD-COUSINS-2026-07-03`  
**Hydration:** `1.3.0` · `as_of=2026-07-02T12:01:21+00:00` · `freshness_status=aging`

---

## Verification (July 3, 2026)

| Test | Result |
|------|--------|
| `rv_horizon_fallback.test.mjs` | **PASS** |
| `run_desk_probes.mjs` | **PASS** |
| `freshness_indicators.test.mjs` | **PASS** |
| `test_auto_download_scaffold.py` | **PASS** |
| `test_barchart_adapter.py` | **PASS** |
| `test_koyfin_adapter.py` | **PASS** |
| Live Barchart fetch (Comet) | **PASS** |
| Koyfin watchlist probe (Download → CSV) | **PASS** |

---

## Node cockpit status (5/5)

| Node | Mission surface | Data path |
|------|-----------------|-----------|
| Basis | Live | `node_cockpits.basis` |
| Credit | Live · horizon-net fallback | `node_cockpits.credit` |
| Liquidity | Live | `node_cockpits.liquidity` |
| Breadth | Live | `node_cockpits.breadth` |
| Highbeta | Live | `node_cockpits.highbeta` |

---

## Deliverables

| Doc | Status |
|-----|--------|
| `08_Deliverables/Desk_Feedback_Log.md` | Updated · automated pre-validation logged |
| `08_Deliverables/Whinfell_Care_Package_20260703.md` | **Created** (session handoff) |
| `08_Deliverables/AUTO_CSV_DOWNLOAD_DESIGN_20260703.md` | Design doc · Chunk 1 |

---

## Test instructions (Clark / Wes)

See numbered steps 1–8 in `08_Deliverables/Desk_Feedback_Log.md`. Clark/Wes logging ratings directly — **awaiting feedback**.