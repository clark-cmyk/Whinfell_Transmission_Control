# Whinfell Transmission Control — UI Revamp Implementation Plan

**Date:** July 5, 2026  
**Product:** Whinfell Transmission Control — Phase 2.3 Operator Console  
**Audience:** GROK BUILD, engineering, design, product  
**Status:** **Phase 16 shipped** — UI Revamp complete  
**Reconciled:** July 5, 2026 — Chunks 01–16 + Phase 16 integration shipped

**Source-of-truth inputs (July 5, 2026):**
- `whinfell_ui_review_checklist.md` — review framework + 12-chunk roadmap
- `whinfell_grok_build_prompt.md` — operator-console direction, copy rules, layout target
- Live UI audit — triple-band top stack, mixed control styling, scan + command-bar duplication

**Running tally:** `BEST_PRACTICES.md` § UI Revamp — update after each chunk ships.

---

## Executive Summary

The console is analytically serious but still optimized for authors, not fast operator scanning. The first viewport stacks **three deep bands** (header · scan strip · command bar) with **mixed control styling**, **duplicate KPI encoding**, and **prose-heavy summary tiles**.

The stricter path forward:

1. **Calm the first viewport first** — unify controls, compress height, trim copy and badges before adding new visuals.
2. **Introduce one hero object** — Transmission Signal Radar below the top strip.
3. **Relocate depth** — ladders, diagnostics, Basis Watch detail, and commentary below the fold or in drawers.
4. **Preserve Lego foundations** — extend registries and config layers; never hardwire business rules into render functions.

**Do not attempt a full redesign in one pass.** Each chunk is one self-contained change set with a fixed context budget.

### Current progress

| Chunk | Phase | Status | Delivered |
|-------|-------|--------|-----------|
| **01** | 4 | **Shipped** | Unified top controls via `js/top_utility_registry.js` + `.console-chip` CSS tokens (28px / 12px / tier-based color). Tech-meta strip registry-rendered; action row classes applied from `ACTION_BUTTON_REGISTRY`. Inline Tailwind removed from utility controls. Tests: `top_utility_registry.test.mjs`, `scan_kpi_strip.test.mjs`, `phase23_console.test.mjs` PASS. |
| **02** | 5 | **Next** | Compress header — slim topbar, compact meta chips, link `console_ia.css` |
| **03** | 6 | Queued | Compress KPI copy |
| **04** | 7 | Queued | Badge reduction |
| **05** | 8 | Queued | Clarify Score/Gate/Shock semantics |
| **06** | 9 | Queued | Light contrast pass |
| **07** | 10 | Queued | Typography reset |
| **08** | 11 | Queued | Collapse commentary |
| **09** | 12 | Queued | Signal detail rewrite |
| **10** | 13 | Queued | Radar shell |
| **11** | 14 | Queued | Radar wiring |
| **12** | 15 | Queued | Move depth down |

**Going forward:** one chunk per session — ship code **and** update plan/tally in the same session before starting the next chunk.

---

## Design North Star

### Scan → Dig → Iterate

| Layer | Default behavior | Lives in |
|-------|------------------|----------|
| **Scan** | Regime, transmission, gate, freshness, shock in &lt;5s | Thin top frame + compact KPI strip |
| **Dig** | One dominant analytical object | Center hero (Radar, then Basis Watch) |
| **Iterate** | Export, compare, scenario, metadata | Object-attached tools; not mixed into scan row |

### Basic View Target

Persistent framing only:

1. **TOP FRAME** — compact header + one utility row + one KPI strip (+ optional alert row)
2. **LEFT FRAME** — sleeve / mode / view selectors (no verbose commentary)
3. **MAIN HERO** — Transmission Signal Radar (Chunks 10–11), later Basis Watch center-first (Phase 16)

Everything else: **below the fold** or in **modal / drawer / pop-out** surfaces.

### Four Coupled Subsystems (unchanged product intent)

| Subsystem | Required behavior |
|-----------|-------------------|
| Situation awareness | Regime, score, transmission, gate, freshness, weakest link — readable in &lt;5s |
| Analytical navigation | Global (top) · sectional (left) · local (center tabs) — never conflated |
| Data reliability | Every null resolves to typed state — never a silent blank |
| Actionability | Export, compare, metadata — object-aware and discoverable |

---

## Context-Window Discipline

Every build session must obey these rules. **Violations invalidate the chunk.**

### Session rules

1. **One chunk per session** — implement exactly one row in the phase map unless explicitly told otherwise.
2. **Read budget** — max ~6 files: chunk spec section, files-to-touch list, one reference module (`data_states.js` or `command_bar_kpis.js`), target HTML/CSS, one test file.
3. **No drive-by refactors** — do not touch Basis Watch, ladders, commentary, or IA shell unless the chunk scope says so.
4. **No broad rewrites** — if a change needs &gt;8 files, split the chunk.
5. **Report using the chunk template** (below) before starting the next chunk.
6. **Re-read only this plan's chunk row** — not the full document — when resuming work.

### Chunk sizing

| Good chunk | Bad chunk |
|------------|-----------|
| Unify header utility chip CSS + registry | Rewrite entire header + command bar + scan strip |
| Remove visible mental-math from scan tiles | Rewrite all KPI copy across the app |
| Add empty Radar shell container | Wire Radar + relocate all diagnostics in one pass |

### Verification per chunk

```bash
node --test tests/<chunk-relevant>.test.mjs
# Plus visual check: first viewport calmer, no regressions in import/save/export
```

---

## Lego-Style Development Rules

**All work from Chunk 01 onward must extend this pattern.** Phases 1–2 established it; do not bypass it.

### Principles

- **Registries over branches** — labels, tiers, states, and behaviors live in frozen config objects.
- **Composable pipelines** — small functions composed by ID lists (`META_STEPS`, render steps).
- **Extend without modifying** — new surfaces consume shared modules; add registry entries, not `if` chains in monoliths.
- **One context envelope** — `buildCommandBarKpiContext()` is the single metrics object for all KPI renderers.
- **Presentation-only chunks** — layout/CSS/copy chunks must not fork business logic.

### Reference implementations (shipped)

| Module | Pattern |
|--------|---------|
| `js/data_states.js` | 7-state taxonomy, `makeState()`, `badgeHtml()`, agent attrs |
| `js/command_bar_kpis.js` | `DECISION_STRIP_REGISTRY`, `TOOLBAR_REGISTRY`, `META_RECIPES` |
| `js/scan_kpi_strip.js` | `TILE_REGISTRY`, progressive disclosure, delegates to shared recipes |

### New registry targets (by chunk)

| Chunk | New / extended registry |
|-------|-------------------------|
| 01 | `TOP_UTILITY_REGISTRY` + `ACTION_BUTTON_REGISTRY` in `js/top_utility_registry.js` — **shipped** |
| 03–05 | `SCAN_DISPLAY` · `BADGE_DISPLAY` · `SEMANTIC_DISPLAY` in `js/scan_kpi_strip.js` |
| 04–05 | `BADGE_DISPLAY` · `SEMANTIC_CARD_DISPLAY` in `js/command_bar_kpis.js` |
| 10–11 | `RADAR_SLEEVE_REGISTRY` in `js/transmission_radar.js` |
| 12 | `DEPTH_PANEL_REGISTRY` — which panels default collapsed / below fold |

---

## UI Review Checklist (score after every chunk)

Use these 10 categories from `whinfell_ui_review_checklist.md`. A chunk ships only when its scoped checks pass.

1. **Scan layer** — regime, transmission, gate, freshness, shock answerable in &lt;5s?
2. **Hierarchy** — scan → dig → iterate visible? One dominant object below strip?
3. **Noise** — top rows smaller/calmer? Copy reduced? Breathing room?
4. **Controls** — same height, text size, color logic? One primary action style?
5. **Badges** — ≤1 badge per KPI tile? Technical states in detail layers?
6. **Typography** — compact ladder? Fewer styles in first viewport?
7. **Contrast** — light mode desk-usable? Functional text high contrast?
8. **Copy** — operator console tone? No mental math in visible KPI bodies?
9. **Functional UX** — detail one click away? Rationale hidden by default?
10. **End-state** — product purpose obvious? Legacy strip reducible further?

---

## 16-Phase Sequence

Phases 1–3 are **foundation** (shipped). Phases 4–15 are **micro-chunks** (strict order). Phase 16 is **structural integration** (after the viewport is calm).

| Phase | ID | Goal | Scope (one sentence) | Status |
|-------|-----|------|----------------------|--------|
| **1** | Foundation | Canonical data-reliability taxonomy | `js/data_states.js` | **Shipped** |
| **2** | Foundation | Command-bar KPI registries (Lego layer) | `js/command_bar_kpis.js` | **Shipped** |
| **3** | Foundation | Scan-layer compact KPI strip (4–6 tiles) | `js/scan_kpi_strip.js` | **Shipped** |
| **4** | **Chunk 01** | Normalize top controls | One utility row — unify button/link height, size, color | **Shipped** |
| **5** | **Chunk 02** | Compress header | Reduce header height; collapse metadata; tighten spacing | **Next** |
| **6** | **Chunk 03** | Compress KPI copy | Remove visible mental math; one-line state only | Queued |
| **7** | **Chunk 04** | Badge reduction | Cut badge count ~50% in first viewport | Queued |
| **8** | **Chunk 05** | Clarify semantics | Rename/subtitle Score, Gate, Shock | Queued |
| **9** | **Chunk 06** | Light contrast pass | Darken text; strengthen surfaces/borders | Queued |
| **10** | **Chunk 07** | Typography reset | Enforce compact type ladder | Queued |
| **11** | **Chunk 08** | Collapse commentary | Hide long rationale by default | Queued |
| **12** | Chunk 09 | Signal detail rewrite | Replace AI-sounding copy with desk copy | Queued |
| **13** | Chunk 10 | Radar shell | Add Transmission Signal Radar container below top strip | Queued |
| **14** | Chunk 11 | Radar wiring | Connect Liq/Credit/Breadth/BTC/Basis data | Queued |
| **15** | Chunk 12 | Move depth down | Push ladders/DQ/mission read lower or into pop-outs | Queued |
| **16** | Integration | IA shell + flagship modules + ship | `console_ia_shell.js`, right-rail commentary, Dictionary drawer, zoom-safe Mission Read/Basis Watch, `build.sh` | **Shipped** |

**Recommended calm-first order:** 01 → 02 → 03 before Radar (10–11). Do not skip ahead to Phase 16 until Chunks 01–12 pass acceptance.

---

## Chunk Specifications

### Chunk 01 — Normalize top controls (Phase 4) · **Shipped**

**Problem (resolved):** `.console-tech-meta` mixed Tailwind one-offs (`text-[8px]`, `text-[9px]`) with `.header-source-link` and `.btn-console` — three styling systems in one row.

**Goal:** All top utility actions look like one system.

**Delivered (July 5, 2026):** `js/top_utility_registry.js` with frozen `TOP_UTILITY_REGISTRY` (7 tech-meta chips) and `ACTION_BUTTON_REGISTRY` (6 action buttons). Unified `.console-chip` primitive in `css/main.css`. Registry renders tech-meta on boot; `btn-console` aliases to same tokens. Checklist §4 (Controls) scoped pass.

**In scope**
- `index.html` — `.console-tech-meta` + `.console-actions-row` markup/classes
- `css/main.css` — unified `.console-chip` primitive (button + link variants)
- **New** `js/top_utility_registry.js` — `TOP_UTILITY_REGISTRY` with `tier`: `meta` | `external` | `action` | `mode`
- Optional thin render helper `renderTopUtilityStrip(registry, mount)`
- Test: `tests/top_utility_registry.test.mjs`

**Out of scope**
- KPI strip content, command bar, scan tiles, header regime copy, Radar, IA shell

**Registry sketch**

```javascript
const TOP_UTILITY_REGISTRY = Object.freeze([
  { id: 'build', kind: 'badge', tier: 'meta', mount: 'tech-meta' },
  { id: 'dictionary', kind: 'link', tier: 'meta', ... },
  { id: 'docs', kind: 'button', tier: 'action', ... },
  { id: 'collect', kind: 'button', tier: 'action', primary: true },
  { id: 'koyfin', kind: 'link', tier: 'external', ... },
  { id: 'barchart', kind: 'link', tier: 'external', ... },
  { id: 'workspace', kind: 'button', tier: 'mode', ... },
]);
```

**CSS tokens (single family)**

| Token | Target |
|-------|--------|
| Height | 28px all chips |
| Font | 12px / 500 weight |
| Padding | 6px 10px |
| Primary | one accent (collect/import class) |
| External | neutral border + hover |
| Meta | muted fill |

**Acceptance**
- [x] All utility chips same height and font size
- [x] One obvious primary action style
- [x] No inline Tailwind on utility controls in `index.html`
- [x] Import / Save / Export row uses same chip family (`btn-console` aliases map to tokens)
- [x] Checklist §4 (Controls) passes for top rows
- [x] No regressions: collect, docs drawer, external links, theme toggle

---

### Chunk 02 — Compress header (Phase 5) · **Next**

**Goal:** First viewport gets shorter.

**In scope:** `index.html` header zones, `css/main.css`, `css/console_ia.css` slim-header rules (link file, do not activate full IA). Collapse build/dictionary to icon or title tooltip. Tighten `.console-topbar` grid.

**Acceptance:** Header band ≥30% shorter; regime subline demoted or single line; checklist §3 passes.

---

### Chunk 03 — Compress KPI copy (Phase 6)

**Goal:** Top strip scans faster.

**In scope:** `scan_kpi_strip.js` `TILE_REGISTRY` display strings, `SCAN_META_RECIPES` — remove mental-math blocks from visible tile bodies. Keep rationale in `title` / expand only.

**Acceptance:** No multi-line explanatory copy in default tile faces; checklist §8 passes.

---

### Chunk 04 — Badge reduction (Phase 7)

**Goal:** Status feels calmer.

**In scope:** `scan_kpi_strip.js`, `command_bar_kpis.js` — max 1 badge per scan tile; hide technical states (`FALLBACK_1D`, etc.) in detail. Do not remove command bar yet (that's Chunk 12).

**Acceptance:** ≤6 badges in scan strip; calm default viewport; checklist §5 passes.

---

### Chunk 05 — Clarify semantics (Phase 8)

**Goal:** Score, Gate, Shock self-evident in &lt;2s.

**In scope:** `TILE_REGISTRY` labels/subtitles, `gateStripTitle()` display mapping, shock plain-English first line.

**Acceptance:** Risk Score · BTC Gate · Shock identifiable at a glance; checklist §1 partial pass.

---

### Chunk 06 — Light contrast pass (Phase 9)

**Goal:** Light mode desk-usable.

**In scope:** `css/main.css`, theme variables — functional text darker, card borders stronger, tertiary text reserved.

**Acceptance:** Checklist §7 passes.

---

### Chunk 07 — Typography reset (Phase 10)

**Goal:** Compact dashboard type ladder.

**In scope:** CSS tokens — title ≤24px, section ~18px, body 14–15px, labels 12–13px, tabular numerals on metrics.

**Acceptance:** ≤4 distinct sizes in first viewport; checklist §6 passes.

---

### Chunk 08 — Collapse commentary (Phase 11)

**Goal:** Summary stops reading like a report.

**In scope:** Hide long rationale blocks by default in command bar / mission read; disclosure toggles only.

**Acceptance:** First viewport prose reduced; dig content behind expand/drawer; checklist §9 partial pass.

---

### Chunk 09 — Signal detail rewrite (Phase 12)

**Goal:** Detail panel sounds operator-native.

**In scope:** `signalDetailDrawer` copy templates, `whyWhinfellScore` / transmission / gate bodies — desk tone per grok build prompt good/bad examples.

**Acceptance:** No symmetrical AI prose templates in drawer defaults.

---

### Chunk 10 — Radar shell (Phase 13)

**Goal:** Main object becomes obvious.

**In scope:** `js/transmission_radar.js` scaffold, `css/transmission_radar.css`, mount below `#scanKpiStrip`, empty state with sleeve labels.

**Acceptance:** One visual block dominates below strip; checklist §2 partial pass.

---

### Chunk 11 — Radar wiring (Phase 14)

**Goal:** Central visual becomes informative.

**In scope:** `RADAR_SLEEVE_REGISTRY`, wire Liq/Credit/Breadth/BTC/Basis from `buildCommandBarKpiContext()`, highlight weakest link.

**Acceptance:** Radar shows live or typed-null states per `WTM_DataStates`; checklist §1 full pass.

---

### Chunk 12 — Move depth down (Phase 15)

**Goal:** Basic view = top + left + hero only.

**In scope:** Stow `#commandBar` decision strip + ladders (`console_ia.css` `.ia-stowed-source`), relocate DQ/mission read, default collapsed sections.

**Acceptance:** First viewport = header + scan + radar; depth below fold or drawers; resolves **C6** scan/command-bar duplication.

---

### Phase 16 — Structural integration & ship

**Goal:** Complete IA + flagship modules + publish hygiene.

**In scope (may split into sub-sessions if context tight):**

| Item | Module |
|------|--------|
| Wire IA shell | `css/console_ia.css`, top/left/center/bottom HTML |
| Basis Watch center-first | `js/basis_watch_panel.js` — table/strip spec |
| Data Dictionary | `js/data_dictionary_panel.js` — wire from KPI/table |
| Commentary rail | `js/commentary_feed.js` — slim bottom mount |
| Build pipeline | `scripts/build.sh` — copy Phase 1–15 modules (**C7**) |
| Polish pass | Color, spacing, commentary density |
| Final ship checks | All Critical + Final checks below |

**Acceptance:** Full checklist + ship checks pass; `BEST_PRACTICES.md` tally updated.

---

## Copy Style Rules (from grok build prompt)

**Prefer:** short state statements, plain English, one-line implications, tight desk language.

| Good | Bad |
|------|-----|
| "Transmission 46. Fragile. Credit is the break." | Long explanatory paragraphs |
| "Gate blocked. No new BTC risk." | "Historically…" in scan layer |
| "Fresh. Normal trust." | Mental math in visible KPI cards |
| "No shock override." | Diagnostic prose in top strip |

---

## Data Reliability (unchanged — enforce in every chunk)

| State | UI treatment |
|-------|--------------|
| Healthy | Normal + freshness marker |
| Partial | Warning chip, reduced confidence |
| Blocked | Disabled + explicit reason |
| Unavailable | Empty-state + remediation |
| Stale | Stale chip + age |
| Quarantined | Error styling + lineage link |
| Not computed | Pending + explanation |

Never render unresolved metrics as untyped dashes.

---

## Basis Watch & Metadata (Phase 16 — not before Chunk 12)

Basis Watch remains a flagship dig module. Required when Phase 16 begins:

- Top strip: spot, front futures, basis $, basis %, annualized curves, percentile, freshness, confidence
- Center table: tenor rows with typed null reasons
- Local tabs: Basis Watch · Implied Rate · History · Cross-Asset · Spread Map · Deep Dive
- Module states: Live · Snapshot · Partial hydration · Stale · Blocked · Missing curve · Quarantined
- Dictionary: canonical name, formula, dependencies, freshness, null reason — **functional**, not dead buttons

---

## Open Challenges (cross-chunk)

| # | Challenge | Resolve in |
|---|-----------|------------|
| C5 | `ensureMount()` const reassignment | Chunk 02 if touching scan mount |
| C6 | Scan strip + command bar duplicate KPIs | Chunk 12 |
| C11 | Mixed top-control styling (Tailwind + CSS + three size tiers) | Chunk 01 — `top_utility_registry.js` + `.console-chip` | **Resolved** |
| C7 | `build.sh` missing Phase 1–3 modules | Phase 16 |
| C8 | `console_ia.css` not linked | Chunk 02 (link) · Phase 16 (full shell) |
| C9 | Dictionary buttons non-functional | Phase 16 |
| C10 | Commentary in primary object area | Chunk 08 + Phase 16 |

---

## LLM Loop Protocol

After each chunk:

1. Render default view.
2. Score scoped checklist categories.
3. If Critical checks fail → fix hierarchy/state before polish.
4. Fill chunk report template.
5. Update `BEST_PRACTICES.md` phase status.
6. **Stop.** Do not start the next chunk in the same session.

### Critical checks (must pass by Phase 16)

- [ ] Default screen answers: regime, gate, weakest link, data health
- [ ] Top / left / center-local tabs distinct
- [ ] One dominant center object
- [ ] KPI cards: dominant signal first, rationale deferred
- [ ] Typed null reasons everywhere
- [ ] Dictionary actions functional
- [ ] Commentary subordinate to main object
- [ ] Calm shell; saturation in charts/alerts only
- [ ] Professional workstation feel — not consumer dashboard

---

## Chunk Report Template

```text
CHUNK ID:
PHASE:
GOAL:
FILES TOUCHED:

CHANGES
- ...

COPY CHANGES
- before:
- after:

UI EFFECT
- ...

QA
- [ ] top viewport calmer
- [ ] controls consistent
- [ ] no regressions
- [ ] basic view still functional
- [ ] scoped checklist categories pass

REMAINING
- ...

NEXT CHUNK:
```

---

## Appendix — Product Spec Reference

The sections below remain authoritative for Phase 16 and desk review. Chunks 01–12 intentionally defer full IA/Basis Watch work until the viewport is calm.

### Information architecture (target end-state)

- **Top frame:** macro sleeves — Liquidity, Credit, Equity Breadth, BTC RV, Crypto Basis, Compute Crush
- **Left frame:** variant selectors, region sleeves, tenor, roll mode
- **Center canvas:** one dominant object + local sub-tabs
- **Bottom rail:** Task Force / TCM commentary, DQ notices

### Anti-patterns (do not reintroduce)

- Multiple saturated panels competing in viewport
- Long prose in default KPI strip
- Silent blanks for missing data
- Mixed global/local navigation in one control row
- Commentary inside primary chart/table surface
- Decorative dashboard styling

### Acceptance tests (product-level)

| Goal | Test |
|------|------|
| First-glance comprehension | Regime, gate, weakest link, data health in &lt;5s |
| Hierarchy clarity | Summary vs detail vs commentary distinguishable without reading every block |
| Navigation coherence | Top sleeves, left selectors, local tabs never conflated |
| Basis usability | Full commodity-style flow, center-first |
| Reliability semantics | Typed null reasons, never silent blanks |
| Metadata trust | Dictionary works from KPI, chart, table |
| Actionability | Export, compare, scenario — object-aware |

---

*Plan version: 1.8 · July 5, 2026 · Phase 16 integration shipped — program complete.*