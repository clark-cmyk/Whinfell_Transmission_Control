# BUILD TODO List — Whinfell Transmission Control

**Maintained by:** BUILD Cousins  
**Last updated:** July 3, 2026 (BUILD_MASTER_PROMPT chunks 1–4)  
**Repo:** `Whinfell_Transmission_Control`

---

## BUILD_MASTER_PROMPT completion (June 30, 2026)

| Chunk | Task | Status |
|-------|------|--------|
| 1 | RV/Basis evidence table spot-fallback (presentation) | **Done** |
| 2 | Mission-surface consistency (5 nodes) | **Done** |
| 3 | Barchart + staging + `latest.json` freshness indicators | **Done** |
| 4 | Desk docs + Clark/Wes test steps | **Done** |

---

## Next up (post desk-readiness)

| # | Goal | Priority | Owner | Done when |
|---|------|----------|-------|-----------|
| 14 | **Live desk walk-through** — Clark/Wes ratings in `Desk_Feedback_Log.md` | High | Clark | All 5 nodes rated |
| 15 | **ARCH-4 curve history** — multi-day `barchart_curve_history.json` | High | Clark + BUILD | Native per-tenor quartiles |
| 16 | **Collect noise fix** — Barchart options/greeks passthrough | Medium | BUILD | `chain_ok` on full collect |

---

## Verification commands (in-repo)

```bash
node tests/rv_horizon_fallback.test.mjs
node tests/run_desk_probes.mjs
node tests/freshness_indicators.test.mjs
bash scripts/build_desk_preview.sh
bash scripts/normalize_whinfell_drop.sh ~/Downloads/whinfell_drop --dry-run
```

---

## Module backlog (unchanged)

| Module | Priority | Notes |
|--------|----------|-------|
| Margin & Sizing | High | CME/IBKR tables |
| Trade Book / Position Ledger | Medium | localStorage sidecar |
| Per-node Here's Why (full-screen) | Medium | Phase 3 UI |