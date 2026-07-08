# Whinfell Care Package — Jul 5, 2026 (Phase 2.3 · Task Force Panel Feed)

**Next-session entry point**  
**Repos:** TC `~/Desktop/Whinfell_Transmission_Control` · Pipeline `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`  
**Versions:** Build `1.5-BUILD-COUSINS-2026-07-05-PHASE23` · Hydration `1.3.0` · Auto-download `0.4.2` · Collect agent `0.1.0` · Task Force `1.1.0` · WMC `1.1.0`

---

## Status at a glance

| Area | State |
|------|--------|
| **Task Force → desk panels** | **SHIPPED** — `task_force_panels` slim feed · BasisWatch callout · WMC hydrate merge |
| **One-click CSV collect** | **SHIPPED** — UI buttons → collect agent → `morning_auto_collect.sh` |
| **Collect agent** | `scripts/whinfell_collect_agent.py` on `127.0.0.1:8767` |
| **Desk surfaces** | WTC header · BasisWatch · Midwest Compute Crush nav |
| **Phase 2.3 console** | safeBoot · meta polling off · boot fix — unchanged |
| **Morning chain** | `run_auto_download.py daily --chain` — live Jul 4 |
| **Tests** | `task_force_panel_feed` · `phase23_console` · `midwest_compute` · `task_force_wtm_export` — **PASS** |

---

## New — Task Force qualitative feed → BasisWatch + Midwest Compute

Chained TCM specialist output (`btc_eth_basis`, `compute_gpu`, `btc_eth_vol_arb`) now reaches desk panels without loading the full ~56KB `task_force` block into memory.

### Data path

```
latest.json task_force.specialists.*
  → prepareHydrationBundle() lifts task_force_panels (slim)
  → WTC import → appState.hydration.task_force_panels
  → BasisWatch callout (btc_eth_basis signal)
  → Midwest Compute Crush hydrate (compute_gpu → thesis / core trade / KPIs)
```

**Stub fallback:** When specialists are `stub`, feed synthesizes reads from `task_force.snapshot.node_summaries` (DataGatherer anchors) so panels populate before live Grok 12-step runs.

### Files

| Item | Path |
|------|------|
| Panel feed module | `js/task_force_panel_feed.js` → `window.WTM_TaskForceFeed` |
| Hydration lift | `js/core.js` `prepareHydrationBundle()` → `task_force_panels` |
| BasisWatch UI | `js/basis_watch_panel.js` — Task Force callout in `bwCallouts` |
| WMC hydrate | `midwest_compute/wmc-hydrate.js` + `wmc-boot.js` async load |
| WMC export | `wmc-export.js` — `specialists_compute_gpu` from live feed when merged |

### Specialist → panel map

| TCM prompt | Specialist id | Desk surface |
|------------|---------------|--------------|
| `TCM-Task-BtcEthBasis` | `btc_eth_basis` | BasisWatch rail callout |
| `TCM-Task-ComputeGpu` | `compute_gpu` | Midwest Compute thesis · core trade · crush KPI |
| `TCM-Task-BtcEthVolArb` | `btc_eth_vol_arb` | Midwest Compute transmission gate KPI |

---

## One-click Barchart / Koyfin CSV download

### Architecture

```
[Collect CSVs] button (WTC / BasisWatch / WMC)
  → fetch http://127.0.0.1:8767/v1/collect/morning
  → scripts/morning_auto_collect.sh
       → run_auto_download.py fetch (Barchart intraday + wired Koyfin /myw/)
       → run_auto_download.py daily --chain (normalize → collect → hydrate)
  → ~/Downloads/whinfell_drop → Cousins pipeline → data/hydration/latest.json
```

**Fallback when agent offline:** copy `bash scripts/morning_auto_collect.sh` to clipboard · or open Terminal via agent `/v1/collect/terminal` (macOS).

### UI buttons

| Surface | Button id | Action |
|---------|-----------|--------|
| WTC main nav | `btnMorningCollect` | Full morning collect + chain |
| BasisWatch (embedded + standalone) | `btnBwCollect` | Full morning collect |
| BasisWatch standalone | `btnBwBarchartCollect` / `btnBwKoyfinCollect` | Single `fetch --id` |
| Midwest Compute Crush | `btnWmcCollect` | Full morning collect |

---

## Operator workflow

### Daily desk (one click)

1. Serve desk: `cd dist && python3 -m http.server 8765` (or open `index.html?safe_boot=1`)
2. Ensure collect agent is running (`:8767/health` returns `ok`)
3. Click **Collect CSVs** → chain hydrates → **Import hydration** in WTC
4. BasisWatch shows **Task Force · btc_eth_basis** callout after import
5. Open `Whinfell_Midwest_Compute_Crush.html` — thesis/KPIs merge from `compute_gpu` on load

---

## Verify (copy-paste)

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# Task Force panel feed + Phase 2.3 regression
node tests/task_force_panel_feed.test.mjs
node tests/phase23_console.test.mjs
node tests/task_force_wtm_export.test.mjs
node tests/midwest_compute.test.mjs
node tests/safe_boot_render.test.mjs

# UI module + agent
node tests/auto_collect_panel.test.mjs
python3 tests/test_collect_agent.py
```

---

## Open — do next

| # | Owner | Task |
|---|-------|------|
| 1 | Clark · Wes | Live desk walk-through → `Desk_Feedback_Log.md` (go-live gate) |
| 2 | BUILD | Commit Phase 2.3 + Task Force panel feed stack |
| 3 | Clark | Live Grok 12-step Task Force chain → replace snapshot fallbacks with `status: ok` specialists |
| 4 | BUILD | LaunchAgent auto-start for collect agent on login |
| 5 | BUILD | Post-collect auto `copy_hydration_bundle.sh` + WTC import prompt |

---

## Related

- `prompts/task_force/TCM-Task-BtcEthBasis.md` · `TCM-Task-ComputeGpu.md` — specialist output schemas
- `08_Deliverables/Whinfell_Care_Package_20260704.md` — boot fix + Midwest Compute Crush UI
- `01_Strategy_Docs/BUILD_TODO_List.md` — morning runbook item #5