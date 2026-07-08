# Whinfell Care Package — June 30, 2026

**Prepared by:** BUILD Cousins  
**Date:** July 3, 2026  
**Repo:** `Whinfell_Transmission_Control`  
**Build:** `1.5-BUILD-COUSINS-2026-07-03` · **Hydration:** `1.3.0`

Handoff snapshot after BUILD_MASTER_PROMPT desk-readiness work. Use this for session continuity, operator onboarding, and go/no-go before new feature work.

---

## 1. Architecture status

### Console (Transmission Control)

| Layer | Status | Detail |
|-------|--------|--------|
| Core shell | **Live** | `index.html` + `js/core.js` · modular panels |
| Node cockpits ×5 | **Live** | Basis · Credit · Liquidity · Breadth · Highbeta |
| Mission surfaces | **Live** | Tactical banner · summary strip · implication rail |
| AI Compute panel | **Live** | H200 curve · MISO Indiana Hub · crush trade |
| BasisWatch panel | **Live** | Calendar vs ref band tooling |
| v1.5 Desk panel | **Live** | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |
| Docs drawer | **Live** | In-repo doc links + operator guides |

### Data pipeline

| Component | Status | Detail |
|-----------|--------|--------|
| Morning drop staging | **Live** | `scripts/normalize_whinfell_drop.sh` / `normalize_drop.py` |
| Barchart hydration | **Live** (fragile upstream) | `full_barchart_hydration.py` in Cousins archive |
| Bundled hydration | **Live** | `docs/data/hydration/latest.json` · `as_of=2026-07-02T12:01:21+00:00` |
| Freshness indicators | **Live** | Header dot/label · per-node `composite_score_source` chips |
| ARCH-1 staged ingest | **Partial** | Routes appear post-hydration import (M3) |
| ARCH-3 WTM import | **Documented** | Criteria + handoff refs in docs drawer |
| ARCH-4 curve history | **Not started** | Multi-day `barchart_curve_history.json` · USDCNH NDF wire-in |

### Publish / desk URLs

| Target | Status |
|--------|--------|
| Local desk | `bash scripts/build_desk_preview.sh` → `dist/` on `:8765` |
| GitHub Pages (TC repo) | Needs Pro on private repo |
| Public fallback | `https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/` |

---

## 2. Shipped features (BUILD_MASTER_PROMPT)

| Chunk | Feature | Key artifacts |
|-------|---------|---------------|
| 1 | RV/Basis spot-fallback table | `resolveRvHorizonValueFallback` · `buildRvHorizonEvidenceMarkup` · `focus-horizon-table--spot-fallback` |
| 2 | Mission-surface consistency (5 nodes) | Unified banner/strip/rail · Composite + horizon-net fallback chips |
| 3 | Data refresh reliability | Relaxed staging quarantine · freshness in `latest.json` |
| 4 | Desk readiness docs | `Desk_Feedback_Log.md` · Clark/Wes test steps 1–8 |
| + | In-repo test suite | `rv_horizon_fallback.test.mjs` · `run_desk_probes.mjs` · `freshness_indicators.test.mjs` |
| + | Probe hardening | `ensureCockpitMissionView` reset · mission stability assertions after RV probes |

---

## 3. Known issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Live desk ratings empty | **Blocking go-live sign-off** | Operator table in `Desk_Feedback_Log.md` not yet filled |
| WTM meta fetch 404 | Low | `[WTM] Master Data Dictionary meta fetch failed` in probe runs — non-blocking |
| Barchart / Comet flakiness | Medium | Intraday downloads unreliable; staging + fallback indicators mitigate |
| Hydration aging | Medium | `freshness_status=aging` on bundled `latest.json` |
| ARCH-4 not wired | Medium | Per-tenor quartiles · USDCNH NDF placeholder in UI |
| Collect noise | Medium | Barchart options/greeks passthrough — `chain_ok` not stable on full collect |
| Uncommitted probe tweak | Low | `js/core.js`: dynamic spot formatting in `__rvHorizonEvidenceProbe` |

---

## 4. Next priorities

| # | Priority | Goal | Owner |
|---|----------|------|-------|
| 1 | **High** | Live desk walk-through — rate all 5 nodes + UI/docs drawer | Clark / Wes |
| 2 | **High** | ARCH-4 curve history — native per-tenor quartiles | Clark + BUILD |
| 3 | **Medium** | Collect noise fix — Barchart options/greeks passthrough | BUILD |
| 4 | **Medium** | Margin & Sizing module (CME/IBKR tables) | BUILD |
| 5 | **Low** | Commit probe spot-formatting tweak in `js/core.js` | BUILD |

---

## 5. Desk testing status

### Automated pre-validation (July 3, 2026)

| # | Test | Result |
|---|------|--------|
| 1 | `rv_horizon_fallback.test.mjs` (Credit spot-fallback) | **PASS** |
| 2 | `run_desk_probes.mjs` (mission surfaces ×5) | **PASS** |
| 3 | `freshness_indicators.test.mjs` (all nodes) | **PASS** |
| 4 | `build_desk_preview.sh` ×2 identical stamp | **PASS** |
| 5 | Staging normalize sample | **PASS** — `accepted=3 quarantined=1` |

### Per-node automated status

| Node | Mission banner | Implication rail | RV spot-fallback | Freshness |
|------|----------------|------------------|------------------|-----------|
| Basis | PASS | PASS | N/A | `weighted_components` · aging |
| Credit | PASS | PASS · Composite fallback chip | PASS (single-spot) | `horizon_net_fallback` · aging |
| Liquidity | PASS | PASS | — | `weighted_components` · aging |
| Breadth | PASS | PASS | — | `weighted_components` · aging |
| Highbeta | PASS | PASS | — | `weighted_components` · aging |

### Live operator walk-through

| Step | Status |
|------|--------|
| Build + serve locally | Ready — see `Desk_Feedback_Log.md` steps 1–4 |
| Per-node visual check (steps 5–7) | **Pending** — no operator ratings logged |
| Go/no-go for new feature work | **Hold** until step above complete |

### Quick start

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

---

## Related docs

| Doc | Path |
|-----|------|
| Desk feedback log | `08_Deliverables/Desk_Feedback_Log.md` |
| BUILD TODO | `01_Strategy_Docs/BUILD_TODO_List.md` |
| Progress log | `01_Strategy_Docs/Progress_Log.md` |
| User guide v1.5 | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Quick reference | `documentation/Whinfell_Quick_Reference_v1.5.md` |
| BUILD master prompt | `prompts/BUILD_MASTER_PROMPT_20260630.md` |