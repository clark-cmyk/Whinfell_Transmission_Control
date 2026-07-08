# Whinfell Care Package — SLIM (Jul 3, 2026)

**Handoff for new session · context compression at ~110K**  
**Repos:** TC `Whinfell_Transmission_Control` · Pipeline `Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`  
**Build:** `1.5-BUILD-COUSINS-2026-07-03` · Hydration `1.3.0` · Auto-download `0.4.2` · Task Force `1.1.0`

---

## Status at a glance

| Area | State |
|------|--------|
| **Phase 2.2 UI** | Shipped — 5 mission surfaces · RV spot-fallback · freshness chips |
| **Auto-download** | `collect_exit=0` · `hydrate_exit=0` · `staged_noise` quarantine live |
| **Koyfin** | Watchlist `/myw/` live (`import_core`, `flows_global`) · **Clark:** rates/china/equities URLs |
| **Task Force v1.1.0** | 12 prompts · DataGatherer PASS · merge/WTM verify PASS · stub `complete` in bundle |
| **WTM-BTC-Basis** | **Barchart-only** — `BTM26` spreads → `btc_basis_*` (not `koyfin_saved_views`) |
| **Go-live gate** | Clark URLs + desk ratings (`Desk_Feedback_Log.md`) |

---

## Shipped this arc

**Auto-download v0.4.2**
- Barchart intraday (`viewName=197689`) · Koyfin Watchlist fetch · drop archive · `staged_noise.py`
- `daily --chain` → normalize/collect/hydrate all **0**

**Task Force v1.1.0 (prompt automation)**
- `prompts/task_force/TCM-Task-*.md` ×12 · `scripts/run_data_gatherer.py` · `scripts/run_task_force_chain.sh` (`--gatherer` / `--merge`)
- `scripts/merge_task_force.py` · `tests/task_force_wtm_export.test.mjs` · `js/core.js` `elevated` TX parse
- `docs/data/hydration/latest.json`: `task_force` stub `validation_status: complete` · top-level `wtm_export_v21` = `Source Channel: task_force`

**Dictionary (Cousins — read-only from TC)**
- `WTM-BTC-Basis` → `barchart_screens` · front `BTM26` · metrics `basis_level`, `calendar_spreads`
- `collection_manifest.yaml` `barchart_btc_basis` · `desk_urls.yaml` wired `/BTM26/spreads`

---

## Open — do next

| # | Owner | Task | Done when |
|---|-------|------|-----------|
| 1 | **Clark** | Wire Koyfin `/myw/` for `koyfin_rates`, `koyfin_china`, `koyfin_equities` in Cousins `desk_urls.yaml` | `fetch --id` succeeds |
| 2 | **Clark·Wes** | Live desk walk-through → `08_Deliverables/Desk_Feedback_Log.md` | All 5 nodes rated |
| 3 | **BUILD** | Post-wire: `daily --chain` → `copy_hydration_bundle.sh` → first live Task Force Grok run | Fresh TC bundle |
| 4 | **BUILD** | Run Grok chain manual: DataGatherer → specialists → MasterSizing → TxIntegrator → `--merge` | `validation_status: complete` from live run |
| — | **Deferred** | Control UI task_force chips · arena-plan checkboxes | Post-gate |

---

## Key paths

```
TC repo
  run_auto_download.py
  scripts/run_task_force_chain.sh · merge_task_force.py · copy_hydration_bundle.sh
  prompts/task_force/TCM-Task-*.md
  docs/data/hydration/latest.json
  tests/task_force_wtm_export.test.mjs

Cousins (WHINFELL_PIPELINE_ROOT)
  whinfell_pipeline/collection_manifest.yaml
  whinfell_pipeline/desk_urls.yaml
  whinfell_pipeline/data_dictionary.yaml   # do not overwrite from TC
  data/hydration/latest.json
```

---

## Verify (copy-paste)

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# UI
node tests/run_desk_probes.mjs && node tests/freshness_indicators.test.mjs

# Task Force
python3 scripts/run_data_gatherer.py
node tests/task_force_wtm_export.test.mjs
python3 tests/test_merge_task_force.py

# Auto-download
python3 tests/test_staged_noise.py
python3 run_auto_download.py --drop ~/Downloads/whinfell_drop daily --chain

# Post-Clark URLs
bash scripts/copy_hydration_bundle.sh
```

---

## Task Force runbook (manual Grok)

```bash
bash scripts/run_task_force_chain.sh --gatherer   # local snapshot
# Grok Tasks in pipeline_seq order (prompts/task_force/)
bash scripts/run_task_force_chain.sh --merge      # after TxIntegrator
node tests/task_force_wtm_export.test.mjs
```

**Pipeline seq:** data_gatherer → btc_eth_basis → btc_eth_vol_arb → compute_gpu → power_nat_gas → metals_debt → china_sq3_deep → sofr_fedfunds → hy_vs_ig → global_transmission → master_sizing → tx_integrator

---

## New session starter

```
SLIM handoff Jul 3. v0.4.2 chain PASS. Task Force v1.1.0 scaffold + stub complete; live Grok chain not run.
Clark gate: Koyfin rates/china/equities /myw/ URLs. WTM-BTC-Basis is Barchart BTM26 spreads only.
Read: 08_Deliverables/Whinfell_Care_Package_SLIM_20260703.md + 01_Strategy_Docs/BUILD_TODO_List.md
```

**Full detail (if needed):** `08_Deliverables/Whinfell_Care_Package_20260703.md` · `01_Strategy_Docs/Task_Force_Arena_Plan_20260703.md`