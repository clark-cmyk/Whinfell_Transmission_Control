# Desk Feedback Log — Transmission Control (TC repo)

**Purpose:** Structured feedback for mission-surface rollout + desk-readiness (BUILD_MASTER_PROMPT 2026-06-30)  
**Maintained by:** Desk → BUILD Cousins (Bridge)  
**Last updated:** July 9, 2026  
**Phase:** **2.3 — Go-live gate** (live operator walk-through)

---

## Current gate

| Item | Status |
|------|--------|
| BUILD_MASTER_PROMPT chunks 1–4 | **Accepted complete** |
| UI revamp · COMET C0–C7 · refresh guard · atomic hydration | **Shipped** — tip `f52ff1b` |
| Rebuild + dist smoke (Jul 9) | **PASS** ×5 RENDER SUCCESS · Pipeline Fresh |
| New feature / code work | **HOLD** — await operator ratings (go-live) |
| Hydration bundle for walk-through | **`global-2026-07-08-raw2wtm-01`** · `as_of=2026-07-08T03:56:43+00:00` · `freshness_status=fresh` · score **58** |
| Operators | Clark · Wes |
| Ratings destination | Table below in this file |
| Known gap | Live `latest.json` has **no** `task_force` block (sidecar TF still 07-04) — mission nodes still walkable |

---

## Chunk completion status (BUILD_MASTER_PROMPT)

| Chunk | Scope | Status | Verified |
|-------|-------|--------|----------|
| 1 | RV/Basis spot-fallback table (presentation only) | **Complete** | `tests/rv_horizon_fallback.test.mjs` + `__rvHorizonEvidenceProbe` |
| 2 | Mission-surface consistency (5 nodes) | **Complete** | `tests/run_desk_probes.mjs` |
| 3 | Data refresh reliability (Barchart + staging + freshness) | **Complete** | `scripts/normalize_drop.py` · `tests/freshness_indicators.test.mjs` |
| 4 | Desk readiness docs + test instructions | **Complete** | This file + `BUILD_TODO_List.md` + `Progress_Log.md` |

---

## Node status (all 5 cockpits)

| Node | Mission banner | Implication rail | RV spot-fallback | Freshness / fallback |
|------|----------------|------------------|------------------|----------------------|
| **Basis** | PASS | PASS | N/A (basis refs) | `weighted_components` · aging |
| **Credit** | PASS | PASS · Composite fallback chip | **PASS** (339.2 bps single-spot) | `horizon_net_fallback` · aging |
| **Liquidity** | PASS | PASS | — | `weighted_components` · aging |
| **Breadth** | PASS | PASS | — | `weighted_components` · aging |
| **Highbeta** | PASS | PASS | — | `weighted_components` · aging |

**Hydration bundle (desk test):** `global-2026-07-08-raw2wtm-01`  
**Bundled:** `dist/data/hydration/latest.json` (= `data/` + `docs/`) · Fresh · Whinfell Score **58** (raw2wtm; TF not merged)

---

## Test instructions for Clark / Wes

1. **Build:** From repo root run `bash scripts/build_web.sh` (or `build_desk_preview.sh` ×2 if comparing stamps).
2. **Serve:** `cd dist && python3 -m http.server 8765` → open `http://127.0.0.1:8765/?boot_log=1`.
3. **Boot:** Confirm `#js-boot-check` shows **RENDER SUCCESS** (or disappears after green flash). Hard-refresh once; must **not** stick on FALLBACK.
4. **Hydration:** Auto-hydrate should load `global-2026-07-08-raw2wtm-01` · Pipeline strip **Fresh**. Optional: **Refresh data** / Collect toast should show same `snapshot_id`.
5. **Per node (Basis · Credit · Liquidity · Breadth · Highbeta):**
   - Mission tactical banner visible (eyebrow + lead; SQ3 suffix when impaired).
   - Summary strip shows current reading + expression row.
   - Implication rail chips: band/fallback · RV posture · flows · gate.
6. **Credit focus (Chunk 1):** Press **f** or **Here's Why** → RV/Basis table shows **one** formatted spot value; other horizons show **—**; note mentions single-spot + horizon-net fallback; table has spot-fallback styling.
7. **Freshness (Chunk 3):** Header freshness reflects bundle; Credit Composite fallback chip when `composite_score_source=horizon_net_fallback`.
8. **Shell smoke:** Risk Cockpit · Radar · HY OAS · Flipchart · Depth meta lines paint; no sticky FALLBACK after refresh.
9. **Log ratings** in the table below after live walk-through.

| Node | Operator | Rating (1–5) | Pass/Fail | Notes | Date |
|------|----------|--------------|-----------|-------|------|
| Basis | | | | | |
| Credit | | | | | |
| Liquidity | | | | | |
| Breadth | | | | | |
| Highbeta | | | | | |
| UI / docs drawer | | | | | |

---

## Automated pre-validation (July 9, 2026)

| # | Test case | Result |
|---|-----------|--------|
| 1 | Atomic hydration publish | **PASS** (`tests/test_atomic_hydration_publish.py`) |
| 2 | Safe boot + sticky FALLBACK recovery | **PASS** (`safe_boot_render` · `refresh_render_guard`) |
| 3 | Auto-collect panel | **PASS** |
| 4 | Mission-surface probes ×5 | **PASS** (`run_desk_probes.mjs`) |
| 5 | Freshness / composite_score_source on all nodes | **PASS** — all five nodes `fresh`; Credit `horizon_net_fallback` |
| 6 | RV spot-fallback unit + probe (Credit) | **PASS** |
| 7 | `build_web.sh` → dist | **PASS** · stamp `2026-07-09T14:38:31Z` |
| 8 | Playwright hard-refresh ×5 on `dist/` | **PASS** — all `RENDER SUCCESS` · `lastRenderOk=true` · Pipeline Fresh · 0 page errors |
| 9 | Task Force block in live latest.json | **FAIL / gap** — no `task_force` in 07-08 bundle; sidecar still 07-04 · do not merge stale stubs over score 58 |

## Automated pre-validation (July 3, 2026) — archived

| # | Test case | Result |
|---|-----------|--------|
| 1 | RV spot-fallback unit + probe (Credit) | **PASS** |
| 2 | Mission-surface probes ×5 | **PASS** |
| 3 | Freshness / composite_score_source on all nodes | **PASS** |
| 4 | `build_desk_preview.sh` ×2 identical stamp | **PASS** (see scratch evidence) |
| 5 | Staging normalize — relaxed quarantine | **PASS** — sample run `accepted=3 quarantined=1 skipped=0` (3 distinct CSVs staged, 1 tiny file quarantined); see `staging_run.log` |