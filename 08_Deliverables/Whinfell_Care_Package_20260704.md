# Whinfell Care Package — Jul 4, 2026 (Phase 2.3 · Midwest Compute Crush UI)

**Next-session entry point**  
**Repos:** TC `~/Desktop/Whinfell_Transmission_Control` · Pipeline `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`  
**Versions:** Build `1.5-BUILD-COUSINS-2026-07-04-PHASE23` · Hydration `1.3.0` · Auto-download `0.4.2` · Task Force `1.1.0` · **WMC `1.1.0`**

---

## Status at a glance

| Area | State |
|------|--------|
| **Desk boot hang** | **FIXED** — BasisWatch ↔ `renderAll` async ping-pong removed |
| **safe_boot** | **Works** — desk renders offline; no auto-hydrate · no import prompt |
| **Phase 2.3 console** | safeBoot · meta polling off · `prepareHydrationBundle()` · boot fallbacks |
| **Midwest Compute Crush** | **SHIPPED** — modular `midwest_compute/` · sticky nav · P0–P2 UI reorg |
| **Morning chain** | **PASS** (Jul 4 PM) — `daily --chain` · fresh hydration · Task Force merge |
| **Tests** | `safe_boot_render` · `phase23_console` · `task_force_wtm_export` · **`midwest_compute`** — **PASS** |

---

## New — Midwest Compute Crush (standalone)

| Item | Path |
|------|------|
| Entry HTML | `Whinfell_Midwest_Compute_Crush.html` |
| Modules | `midwest_compute/wmc-*.js` + `wmc.css` |
| Mock data | `midwest_compute/wmc-data.js` → `window.WMC_DATA` |
| Export | `WMC.Export.download()` / `window.WMC_export()` |

**UI reorg (P0–P2):**
- Single long scroll page — 6 zones: Overview · Basis · Trade ideas · Risk · Charts · Sources
- Sticky nav: mobile jump `<select>` · desktop sidebar links · scroll-spy
- Trade ideas: vertical list + single detail panel (replaces 6-tab strip)
- Risk: stacked sub-panels (corr / VaR / exposure) — no 2-col mashup
- Visual: no grid backdrop · no pulse · sentence-case titles · mono numbers only

**Functionality preserved:**
- Sortable basis table (8 legs, dislocation colors)
- 6 trade variants (Core, Curve, Basis, Seasonal, Risk-On/Off, Credit RV)
- Correlation heatmap · VaR table · net exposure bars
- JSON export for WTC import (`wtc_midwest_compute_crush` schema unchanged)
- Chart placeholders → `index.html#ai-compute` deep-links

---

## Root cause — hydration hang / blank desk

**Symptom:** `?safe_boot=1` · scripts load · console clean · page frozen / no UI paint.

**Cause:** `renderAll()` → `WTM_BasisWatch.refresh(..., { renderAll })` → `hooks.renderAll()` → `renderAll()` … **infinite async ping-pong**. Main thread saturated; boot badge showed success before paint completed.

**Fix:**
1. `renderAllCore` calls `WTM_BasisWatch.refresh(appState, {})` — **never** passes `renderAll` hook.
2. `runBootSequence()` — async boot with phases, try/catch, `__WTM_BOOT_COMPLETE` flag.
3. `renderAll()` wrapper — depth cap · try/catch · `renderAllFallback()` minimal paint.
4. Panel hooks (`ui_polish`, `ai_compute`, `v15_desk`) — wait for `__WTM_CORE_READY`, no infinite `installHook` poll.
5. `bootstrap.js` — waits for `__WTM_BOOT_COMPLETE` (max 60 × 50ms), not `renderAll.name`.

---

## Boot diagnostics

| URL flag | Effect |
|----------|--------|
| `?safe_boot=1` | Skip auto-hydrate · skip hydration import `confirm()` · verbose boot log on |
| `?safe_boot=1&boot_log=0` | Quiet boot (tests / production offline) |
| `?boot_log=1` | Verbose `[WTM boot]` phase lines in console |

**Boot phases (console):**
`panels` → `state` → `workspace` → `basis_watch` → `hydrate` → `render` → `boot complete`

---

## Verify (copy-paste)

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# Regression suite
node tests/safe_boot_render.test.mjs
node tests/phase23_console.test.mjs
node tests/task_force_wtm_export.test.mjs
node tests/midwest_compute.test.mjs

# Midwest Compute Crush standalone
open Whinfell_Midwest_Compute_Crush.html
# or: python3 -m http.server 8080 → http://localhost:8080/Whinfell_Midwest_Compute_Crush.html

# WTC offline desk
open "index.html?safe_boot=1"
```

---

## Open — do next

| # | Owner | Task |
|---|-------|------|
| 1 | Clark · Wes | Live desk walk-through → `Desk_Feedback_Log.md` |
| 2 | BUILD | Wire `Whinfell_Midwest_Compute_Crush.html` link from WTC nav / docs drawer |
| 3 | BUILD | P3 polish: keyboard nav on jump menu · copy `midwest_compute/` to `docs/` on build |
| 4 | BUILD | Live hydration merge into `WMC_DATA` from `latest.json` `ai_compute` block |
| 5 | BUILD | Commit Phase 2.3 + boot fix + WMC modular stack |

---

## Midwest Compute module map

```
midwest_compute/
  wmc-data.js      → WMC_DATA mock payload
  wmc-utils.js     → fmt, colors, sparkline, toast
  wmc-export.js    → WTC import JSON
  wmc-nav.js       → sticky nav, jump, scroll-spy
  wmc-overview.js  → thesis + hero KPI + secondary KPIs
  wmc-basis.js     → sortable basis table
  wmc-trades.js    → trade ideas list + detail
  wmc-risk.js      → corr / VaR / exposure
  wmc-charts.js    → WTC chart placeholders
  wmc-sources.js   → data dictionary footer
  wmc-boot.js      → init registry
  wmc.css          → human desk theme
```

---

## Read order next session

1. This file
2. `Whinfell_Midwest_Compute_Crush.html` + `midwest_compute/wmc-boot.js`
3. `js/core.js` → `runBootSequence` · `renderAll`
4. `01_Strategy_Docs/BUILD_TODO_List.md`
5. `01_Strategy_Docs/Progress_Log.md`

**Prior:** Jul 4 boot fix session · Jul 4 AM dictionary/Koyfin session