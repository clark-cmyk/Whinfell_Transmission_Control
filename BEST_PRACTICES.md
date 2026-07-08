# Whinfell Transmission Control — Best Practices

**Last Updated:** July 8, 2026 (v2.0 · local desk run & troubleshoot)

**Spec reference:** `01_Strategy_Docs/whinfell_ui_revamp_grok_build.md`

---

## Repo hygiene

- **Never** `git add -A`.
- **Always** `git status -sb` before commit or publish.
- Ignored: `dist/`, `data/` (local hydration + barchart cache).
- **Do not** hand-edit `docs/` on `main` — legacy payload; web deploy uses `gh-pages` only.

## Publish workflow (gh-pages — main untouched)

```bash
bash scripts/publish_ghpages.sh
# or: click Publish Web in console header
# or: double-click scripts/Publish_to_Web.command
```

`publish_ghpages.sh` runs `sync_live_desk_data.sh` → `build_web.sh` → rsync `dist/` to sibling worktree → push `origin/gh-pages`. **Never commits to `main`.**

Verify: `cat dist/BUILD_MANIFEST.json`

## Pages deploy

- Source branch: **`gh-pages`** (root) — enable once in repo Settings → Pages
- Local publish only — hydration ships from Clark's machine, not CI
- Team URL: `https://clark-cmyk.github.io/Whinfell_Transmission_Control/`
- **Private repo:** Pages requires GitHub Pro — see `documentation/DESK_URLS.md`

## Local desk — run & troubleshoot

**Never** double-click `index.html` or open the desk via `file://`. Hydration, fetch, and boot logic require HTTP.

### Recommended local workflow

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# Full bundle — copies midwest_compute/, crypto_analytics/, standalone pages
bash scripts/build_web.sh

cd dist && python3 -m http.server 8765
open "http://localhost:8765/?safe_boot=1&boot_log=1"
```

| Step | Why |
|------|-----|
| `build_web.sh` | Complete static site. `build_desk_preview.sh` alone omits `midwest_compute/` and `crypto_analytics/` → 404 script errors in DevTools. |
| Serve from `dist/` | Paths (`js/core.js`, `data/hydration/latest.json`, etc.) are relative to the built bundle. |
| HTTP on `:8765` | Auto-hydrate from `data/hydration/latest.json` runs only over HTTP — skipped on `file://`. |
| `?safe_boot=1` | Skips auto-hydrate and import prompts — fastest way to confirm the shell renders. |
| `&boot_log=1` | Prints `[WTM boot]` phase lines in the browser console. |

**Quick preview only** (console core, no standalone tool dirs):

```bash
bash scripts/build_desk_preview.sh && cd dist && python3 -m http.server 8765
```

Use `build_web.sh` whenever `index.html` references `midwest_compute/*` or you need standalone pages in `dist/`.

### Boot diagnostics

| Signal | Healthy | Problem |
|--------|---------|---------|
| `#js-boot-check` badge | Flashes **RENDER SUCCESS**, then hides | **BOOT TIMEOUT** or **ERROR: …** — open `?safe_boot=1&boot_log=1` |
| Console phases | `panels` → `state` → `workspace` → `ia_shell` → `basis_watch` → `hydrate` → `render` → `boot complete` | Phase missing or error before `boot complete` |
| Network tab (hard refresh) | All `js/*.js`, `midwest_compute/*.js` return **200** | **404** on scripts → rebuild with `build_web.sh` |

| URL flag | Effect |
|----------|--------|
| `?safe_boot=1` | Skip auto-hydrate · skip hydration import `confirm()` · verbose boot log on |
| `?safe_boot=1&boot_log=0` | Quiet boot (tests / production offline) |
| `?boot_log=1` | Verbose `[WTM boot]` phase lines without forcing safe_boot |

**Known fix (Jul 4, 2026):** blank/frozen desk from `renderAll` ↔ `WTM_BasisWatch.refresh` infinite ping-pong — resolved in `core.js` boot sequence (`__WTM_BOOT_COMPLETE`). Hard-refresh if you see scripts load but no paint.

### Blank / frozen page — common causes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank page, no data | Opened via `file://` | Serve `dist/` with `python3 -m http.server 8765` |
| 404s for `midwest_compute/*` or `crypto_analytics/*` | Used `build_desk_preview.sh` only | Run `bash scripts/build_web.sh` |
| Stuck on "BOOTING…" | Boot timeout or JS error | `?safe_boot=1&boot_log=1` · check console |
| Frozen UI, console clean | Stale cache or hydration hang | Hard-refresh (`Cmd+Shift+R`); try `safe_boot=1` first |
| GitHub Pages blank / 404 | Pages not enabled on `gh-pages` | `bash scripts/publish_ghpages.sh` + Settings → Pages → `gh-pages` / root |

### Standalone tools (local)

| Tool | URL (after `build_web.sh` + serve `dist/`) | Notes |
|------|--------------------------------------------|-------|
| Main console | `http://localhost:8765/` | Auto-hydrate on HTTP |
| Midwest Compute Crush | `http://localhost:8765/Whinfell_Midwest_Compute_Crush.html` | Needs `midwest_compute/` in `dist/` |
| Crypto Analytics | `http://localhost:8765/Crypto_Analytics.html` | Needs `crypto_analytics/` in `dist/` |
| BasisWatch | `http://localhost:8765/Whinfell_BasisWatch.html` | |
| Bang Bang Da Machine | `http://127.0.0.1:8765/bang_bang_da_machine.html` | Window selector needs API on `:8766` |

**Bang Bang Da one-click:**

```bash
open scripts/Bang_Bang_Da.command
# Manual: enrich → API → static host (repo root for BBDM page)
python3 scripts/enrich_hydration_rv.py
python3 scripts/bang_bang_da_server.py &    # :8766
python3 -m http.server 8765                   # repo root or dist with bang_bang_da_machine.html
```

Without API on `:8766`, BBDM UI falls back to last static `bang_bang_da/bang_bang_da_report.json`.

### Local regression checks

```bash
cd ~/Desktop/Whinfell_Transmission_Control
node tests/safe_boot_render.test.mjs    # boot sequence without auto-hydrate
node tests/desk_data_ops_standalone.test.mjs  # BasisWatch Collect → Refresh state routing
node tests/basis_watch_refresh.test.mjs # curve cache invalidate + reloadCurve
node tests/phase23_console.test.mjs     # IA shell + console probes
```

Expect `PASS safe_boot_render.test.mjs` and `boot_complete=true` in output.

## Filename conventions

| Asset | Correct path |
|-------|----------------|
| Main console | `index.html` (not root monolith) |
| Hydration | `data/hydration/latest.json` → copied to `docs/data/hydration/` |
| Data dictionary meta | `data_dictionary_meta.json` (repo root) |
| User guide | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| BasisWatch standalone | `Whinfell_BasisWatch.html` |
| Bang Bang Da UI | `bang_bang_da_machine.html` |
| Bang Bang Da scorer | `bang_bang_da_calculator.py` |
| BBDM report | `bang_bang_da/bang_bang_da_report.json` |
| RV history enrich | `scripts/enrich_hydration_rv.py` → `docs/data/hydration/rv_history.json` |
| BBDM launcher | `scripts/Bang_Bang_Da.command` |
| Midwest Compute Crush | `Whinfell_Midwest_Compute_Crush.html` + `midwest_compute/` |
| Crypto Analytics | `Crypto_Analytics.html` + `crypto_analytics/` |
| Web build (local + Pages) | `scripts/build_web.sh` → `dist/BUILD_MANIFEST.json` |
| Desk preview only | `scripts/build_desk_preview.sh` → `dist/BUILD_STAMP.txt` |

---

## UI Revamp — Running Tally

Living log for the scan · dig · iterate redesign. Update this section as each phase ships or resolves.

**Current focus:** UI Revamp complete — Phase 16 integration shipped July 5, 2026.

**Program snapshot (post Phase 16):**

| Track | Status |
|-------|--------|
| Top controls | **Done** — Chunk 01 (`top_utility_registry.js` + `.console-chip`) |
| Noise reduction (first viewport) | **Done** — Chunks 02–12 |
| SCAN → DIG → ITERATE | **Done** — IA shell active (`console_ia_shell.js` + layer tabs) |
| Open challenges | C7 · C8 · C9 · C10 · C6 — **Resolved** in Phase 16 |

### Phase map

| Phase | Goal | Module(s) | Status |
|-------|------|-----------|--------|
| 1 | Canonical data-reliability taxonomy | `js/data_states.js` | **Shipped** · `tests/data_states.test.mjs` PASS |
| 2 | Command-bar KPI registries (Lego layer) | `js/command_bar_kpis.js` | **Shipped** · `tests/command_bar_data_states.test.mjs` PASS |
| 3 | Scan-layer compact KPI strip (4–6 tiles) | `js/scan_kpi_strip.js` · `css/main.css` | **Shipped** · `tests/scan_kpi_strip.test.mjs` PASS |
| 4 | **Chunk 01** — Normalize top controls | `js/top_utility_registry.js` · `css/main.css` | **Shipped** · `tests/top_utility_registry.test.mjs` PASS |
| 5 | **Chunk 02** — Compress header | `index.html` · `css/main.css` · `css/console_ia.css` | **Shipped** |
| 6 | Chunk 03 — Compress KPI copy | `js/scan_kpi_strip.js` | **Shipped** |
| 7 | Chunk 04 — Badge reduction | `js/scan_kpi_strip.js` · `js/command_bar_kpis.js` | **Shipped** |
| 8 | Chunk 05 — Clarify Score/Gate/Shock | `js/scan_kpi_strip.js` · `js/core.js` | **Shipped** |
| 9 | Chunk 06 — Light contrast pass | `css/main.css` | **Shipped** |
| 10 | Chunk 07 — Typography reset | `css/main.css` | **Shipped** |
| 11 | Chunk 08 — Collapse commentary | `index.html` · `command_bar_kpis.js` · `core.js` | **Shipped** |
| 12 | Chunk 09 — Signal detail rewrite | signal detail drawer | **Shipped** |
| 13 | Chunk 10 — Radar shell | `js/transmission_radar.js` | **Shipped** |
| 14 | Chunk 11 — Radar wiring | `js/transmission_radar.js` | **Shipped** |
| 15 | Chunk 12 — Move depth down | `index.html` · `css/main.css` | **Shipped** |
| 16 | Integration — IA shell + flagship + ship | `console_ia_shell.js` · commentary · dictionary · `build.sh` | **Shipped** · `tests/phase16_integration.test.mjs` PASS |

### Chunk 01 delivery summary (Phase 4 — shipped)

- **Module:** `js/top_utility_registry.js` — `TOP_UTILITY_REGISTRY` (7 chips) + `ACTION_BUTTON_REGISTRY` (6 buttons)
- **CSS:** `.console-chip` unified primitive (28px height, 12px font, tier variants: meta / external / action / mode)
- **Effect:** Top utility row and action row share one visual system; inline Tailwind removed from header controls
- **Tests:** `tests/top_utility_registry.test.mjs` PASS · `scan_kpi_strip.test.mjs` PASS · `phase23_console.test.mjs` PASS

> **UI Revamp program complete.** Next work = desk walk-through (go-live gate).

---

### Goals (cumulative)

| # | Goal | Source | Phase |
|---|------|--------|-------|
| G1 | Every metric binds to a typed state — never a silent blank | Revamp spec · Critical Check | 1 |
| G2 | Composable KPI meta pipeline via registries, not inline render logic | Lego rules | 2 |
| G3 | Default view answers regime, gate, weakest link, freshness in &lt;5s | Scan layer spec | 3 |
| G4 | Dominant signal first; rationale deferred to expand / title / hover | Progressive disclosure | 3 |
| G5 | Agent/LLM-readable semantics on every serious data object | `data-data-state` · `data-agent-reason` | 3 |
| G6 | Top controls unified — same height, size, color logic | Chunk 01 spec · Checklist §4 | 4 |
| G7 | Distinct navigation hierarchy: global (top) · sectional (left) · local (center tabs) | IA spec | 16 |
| G8 | One dominant analytical object in center canvas | IA spec · Radar chunks | 13–16 |
| G9 | Basis Watch: dollars · % · annualized + typed null reasons | Basis Watch spec | 16 |
| G10 | Dictionary actions work from KPI, chart, and table contexts | Metadata trust | 16 |
| G11 | Commentary on right rail — decision/interpretation layer, subordinate to center object | Right rail spec | 16 |

---

### Challenges → Resolutions

| # | Challenge | Resolution | Phase | Status |
|---|-----------|------------|-------|--------|
| C1 | Missing basis %, BTC fields, and other nulls appeared as silent dashes | `WTM_DataStates.makeState()` — 7-state taxonomy with `display`, `label`, `reason` | 1 | **Resolved** |
| C2 | KPI cards mixed state, rationale, and process in one viewport band | Split command-bar registries (`DECISION_STRIP` + `TOOLBAR`) from render; meta recipes as composable steps | 2 | **Resolved** |
| C3 | Scan layer needed same semantics as command bar without duplicating business rules | `buildMeta()` delegates to `WTM_CommandBarKpis.META_RECIPES` when recipe IDs match; scan-only steps in `SCAN_META_RECIPES` | 3 | **Resolved** |
| C4 | Integration test could not find `.scan-kpi-value` children in DOM shim | `dom_shim.mjs` — sync `className` → `classList` on `ElementShim`; preload `scan_kpi_strip.js` | 3 | **Resolved** |
| C5 | `ensureMount()` reassigned `const mount` (latent runtime bug on dynamic insert) | Masked by static `#scanKpiStrip` in `index.html`; fix before relying on dynamic mount path | 3 | **Open** |
| C6 | Scan strip + full command-bar KPI band coexist — feels redundant | `#consoleDepthDisclosure` stows command bar; scan strip owns default KPIs | 12 · 16 | **Resolved** |
| C7 | `build.sh` / `dist/` do not copy Phase 1–15 modules | Full manifest in `scripts/build.sh` with smoke greps | 16 | **Resolved** |
| C8 | `css/console_ia.css` scaffolded but not linked | Linked + `body.ia-shell-active` via `console_ia_shell.js` | 16 | **Resolved** |
| C9 | Dictionary buttons historically non-functional | `WTM_DataDictionary` drawer from DD badge click | 16 | **Resolved** |
| C10 | Commentary embedded in primary object area breaks scan hierarchy | `WTM_CommentaryFeed` on right rail inside `#cockpitDecisionRail` | 16 | **Resolved** |
| C11 | Mixed top-control styling — Tailwind + CSS + three size tiers in one row | `WTM_TopUtility` registries + `.console-chip` tokens in `css/main.css` | 4 | **Resolved** |

---

### Architectural & design best practices

Derived from Phases 1–3 and `whinfell_ui_revamp_grok_build.md` Lego rules. **All phases from 3 onward must extend this pattern.**

#### Lego / config-driven development

- **Registries over branches.** Business rules, labels, states, and tile definitions live in frozen objects (`TILE_REGISTRY`, `TOP_UTILITY_REGISTRY`, `META_STEPS`, `META_RECIPES`, `DELTA_FORMATTERS`) — not inside DOM render functions.
- **Composable pipelines.** Meta resolution = ordered step IDs → step functions `(ctx, meta) → meta`. Add a KPI by adding a registry entry, not by editing a monolith.
- **Extend without modifying.** New surfaces (scan strip, command bar, future sleeves) consume `WTM_DataStates` and shared recipes; module-specific logic only where the surface differs (e.g. `SCAN_META_RECIPES.regime`).
- **One context object.** `buildCommandBarKpiContext()` is the single metrics envelope passed to all KPI renderers — do not fork parallel state pipelines.
- **No layout ownership in KPI modules.** `WTM_CommandBarKpis` and `WTM_ScanKpiStrip` render into mounts they find or create; shell layout belongs in HTML/CSS (Phase 4).

#### Data-state rules

- **Never silent blanks.** Unresolved values must resolve to a typed state: `healthy` · `partial` · `blocked` · `unavailable` · `stale` · `quarantined` · `not_computed`.
- **Precedence is explicit.** `WTM_DataStates.PRIORITY` — highest flag wins when multiple are set.
- **Humans and agents read the same semantics.** Expose `data-data-state`, `data-agent-reason`, `data-agent-kpi` on tiles; bind `title` to rationale for hover scan.
- **Freshness is first-class.** Pipe `freshStatus` / `freshLabel` through meta steps (`freshnessFromContext`), not ad-hoc age math in renderers.

#### Scan · dig · iterate interaction model

| Speed | Layer | Default behavior |
|-------|-------|------------------|
| **Scan** | Compact KPI strip | One dominant value + status word + short delta; rationale hidden |
| **Dig** | Center canvas | One main object (chart, basis table, ladder); local sub-tabs |
| **Iterate** | Attached toolkit + bottom rail | Export, compare, scenario, commentary — object-aware, not a link cluster |

- Scan is the **default mode** — no collapse required for first-glance comprehension.
- Dig requires **one click or one expansion**, not a page hunt.
- Iterate tools stay **attached to the active object**.

#### Visual system

- **Calm shell, saturated data.** Neutral surfaces (`--surface`, `--border`); color reserved for badges, charts, and alert states.
- **Tabular numerals** on all market-facing numbers (`.tabular-nums` / `font-variant-numeric: tabular-nums`).
- **Compact typography in scan layer** — 8px labels, 15px dominant values; prose only in expand panels.
- **Anti-patterns to avoid:** competing saturated panels · long prose in default KPI strip · mixed global/local nav in one row · commentary inside chart/table surface.

#### Module conventions

| Convention | Pattern |
|------------|---------|
| Global export | `WTM_<ModuleName>` on `window` |
| Build stamp | `BUILD = '1.0.0-PHASEn'` in module header |
| Script load order | `data_states.js` → `command_bar_kpis.js` → `scan_kpi_strip.js` → `top_utility_registry.js` → `core.js` |
| Tests | `tests/<module>.test.mjs` — unit registry assertions + optional `loadCoreJs()` integration |
| CSS | Shared `ds-*` primitives (`ds-tile`, `ds-state-badge`, `ds--<state>`); surface-specific skin (e.g. `scan-kpi-badge--*`) |

#### Reference implementations

| Phase | File | What to copy |
|-------|------|--------------|
| 1 | `js/data_states.js` | State taxonomy, `makeState()`, `fromFreshness()` |
| 2 | `js/command_bar_kpis.js` | `META_STEPS`, `META_RECIPES`, `DECISION_STRIP_REGISTRY`, `renderAll()` |
| 3 | `js/scan_kpi_strip.js` | `TILE_REGISTRY`, delegation pattern, progressive disclosure |
| 4 | `js/top_utility_registry.js` | `TOP_UTILITY_REGISTRY`, `ACTION_BUTTON_REGISTRY`, `chipClasses()`, `normalizeTopControls()` |

---

### Verification commands (UI Revamp)

```bash
cd ~/Desktop/Whinfell_Transmission_Control

node tests/data_states.test.mjs
node tests/command_bar_data_states.test.mjs
node tests/scan_kpi_strip.test.mjs
node tests/top_utility_registry.test.mjs
node tests/phase23_console.test.mjs
node tests/safe_boot_render.test.mjs
```

---

### Tally changelog

| Date | Entry |
|------|-------|
| Jul 3, 2026 | v1.5 — repo hygiene, publish workflow, filename conventions |
| Jul 5, 2026 | v1.7 — **Tracking reset** — Chunk 01 shipped (Phase 4); Chunk 02 next; delivery summary + C11 resolved; plan/tally synced with `whinfell_ui_revamp_grok_build.md` |
| Jul 5, 2026 | v1.6 — UI Revamp running tally: Phases 1–3 shipped; Phases 4–8 queued; Lego best practices; challenges C1–C4 resolved, C5–C10 open |
| Jul 8, 2026 | v2.0 — **Local desk run & troubleshoot** — `build_web.sh` vs `build_desk_preview.sh`; HTTP-only rule; `safe_boot` / `boot_log` diagnostics; standalone tool URLs; regression checks |
| Jul 8, 2026 | v2.1 — **Desk refresh fix** — standalone BasisWatch/MWC use `WTM_BasisWatch.getState()` (not `appState`); `reloadHydration` + `whinfell-desk-refresh` listener; MWC wires Collect/Refresh after `Nav.init` |