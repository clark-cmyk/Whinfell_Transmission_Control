# Whinfell Data Dictionary v1.5

**Hydration version:** `1.3.0` · **TC build:** `1.5-BUILD-COUSINS-2026-07-03`  
**Machine registry (YAML):** `Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE/whinfell_pipeline/data_dictionary.yaml`  
**Meta JSON:** `data_dictionary_meta.json` (this repo root)

---

## Repo paths (corrected July 2026)

| Role | Path |
|------|------|
| Operator console (modular) | `Whinfell_Transmission_Control/index.html` |
| Pages build output | `Whinfell_Transmission_Control/docs/` |
| Hydration bundle | `data/hydration/latest.json` (pipeline + copied to `docs/data/hydration/` on build) |
| Legacy monolith (deprecated) | `08_Deliverables/Whinfell_Transmission_Control.html` → redirect stub in cousins archive |

---

## Hydration bundle — required fields (v1.2.0+)

| Block | Key fields |
|-------|------------|
| `global` | `whinfell_score`, `transmission_state`, `regime_tag`, `key_observation`, `btc_bias` |
| `china` | `sq3_score`, `sq3_band`, `policy_strength`, `state_impulse_score`, `growth_impulse_score` |
| `china_ladder` | `horizons` (5 nodes × d1/d5/d20/d60) |
| `suggested_tracer` | per-node horizon marks |
| `node_cockpits` | `liquidity`, `credit`, `breadth`, `highbeta`, `basis` |
| `cockpit_context` | `weakest_node_id`, `transmission_health_score`, `gate_zone` |
| `execution` | `near_month`, `far_month`, `basis_spread`, `ref_low`, `ref_mid`, `ref_high` |

Top-level metadata: `hydration_version`, `lineage_hash`, `snapshot_id`, `as_of`, `freshness_status`, `validation_status`.

---

## Hydration bundle — v1.3.0 additive blocks

### `ai_compute`

| Field | Type | Description |
|-------|------|-------------|
| `as_of` | string | ISO date |
| `source` | string | `pipeline_v15` or `desk_thesis_v1.5` |
| `thesis` | string | Desk thesis summary |
| `ornn_h200` | object | H200 rental/forward stub or live |
| `miso_indiana_hub` | object | MISO Indiana Hub LMP stub or live |
| `gpu_forward_curve` | array | `{tenor, price}` |
| `ladder_stage` | object | Transmission overlay chip |
| `crush_trade` | object | Structure, basis, P&L sim |

### `corporate_credit`

| Field | Type | Description |
|-------|------|-------------|
| `hy_oas_bps` | number | HY OAS proxy reading |
| `percentile` | number | Historical percentile |
| `richness` | string | `cheap` / `rich` / `fair` |
| `band` | string | Signal band (e.g. Blocked) |
| `rv_posture` | string | e.g. `long_spread` |
| `preferred_expression` | string | e.g. HYG vs LQD |
| `tactical_lead` | string | Mission-surface lead sentence |
| `is_weakest_link` | boolean | Weakest transmission node |

### `trade_tracker`

| Field | Type | Description |
|-------|------|-------------|
| `trades` | array | `{id, book, structure, status, pnl_pct, size_cap, gate}` |

### `btc_attribution`

| Field | Type | Description |
|-------|------|-------------|
| `btc_bias` | string | Confirming / Dragging / Neutral |
| `btc_ret_1d_pct` | number | 1-day BTC return |
| `attribution` | array | `{stage, d1, net_impact, btc_drag}` |
| `summary` | string | One-line attribution read |

### `margin_rules`

| Field | Type | Description |
|-------|------|-------------|
| `whinfell_score` | number | Score at hydrate time |
| `tier` | string | defensive / light / selective / full |
| `gross_risk_cap_pct` | number | Max gross risk % |
| `max_per_trade_risk_pct` | number | Per-trade cap |
| `max_concurrent_trades` | number | Concurrent trade limit |
| `layer2_allowed` | boolean | BTC options workflow |
| `layer3_allowed` | boolean | Calendar arb agent |
| `rules` | array | Human-readable rule strings |

---

## TC local state (`whinfell_transmission_control_v7`)

Persisted under `appState.hydration`:

`node_cockpits`, `cockpit_context`, `flows_sidecar`, `flows_health`, `china_as_of`, `barchart_as_of`, `ingest_provenance`, `ai_compute`, `corporate_credit`, `trade_tracker`, `btc_attribution`, `margin_rules`, `hydration_audit`.

---

## CSV filename patterns (pipeline)

After `normalize_whinfell_drop.sh`:

- `rates_{YYYYMMDD}_{HHMM}.csv`
- `credit_{YYYYMMDD}_{HHMM}.csv`
- `flows_{YYYYMMDD}_{HHMM}.csv`
- `futures_daily_{YYYYMMDD}_{HHMM}.csv`
- `btc_basis_{YYYYMMDD}.csv`
- `china_policy_{YYYYMMDD}_{HHMM}.csv`

---

## Hydration bundle — `task_force` (v1.1.0 · additive)

Grok Task Force pipeline artifact. Persisted after MasterSizing; stub until chain runs.

| Field | Type | Description |
|-------|------|-------------|
| `task_force_version` | string | `"1.1.0"` |
| `as_of` | ISO-8601 | Task Force run timestamp |
| `snapshot_id` | string | Matches hydration `snapshot_id` |
| `validation_status` | string | `stub` \| `partial` \| `complete` |
| `pipeline_seq` | string[] | Ordered specialist ids (see roster) |
| `snapshot` | object | DataGatherer output — trimmed hydration refs |
| `specialists` | object | Per-specialist layers (appended sequentially) |
| `master_sizing` | object \| null | Final synthesis (Chunk 3) |

### Specialist roster (`specialist_id` → `node_id`)

| specialist_id | node_id | hydration anchors |
|---------------|---------|-------------------|
| `data_gatherer` | — | produces `snapshot` only |
| `btc_eth_basis` | `basis` | `execution` |
| `btc_eth_vol_arb` | `highbeta` | `node_cockpits.highbeta`, layer2 gate |
| `compute_gpu` | `ai_compute` | `ai_compute` |
| `power_nat_gas` | `ai_compute` | `ai_compute` power / nat gas |
| `metals_debt` | `credit` | `node_cockpits.credit` |
| `china_sq3_deep` | `china` | `china`, `china_ladder` |
| `sofr_fedfunds` | `liquidity` | `node_cockpits.liquidity` |
| `hy_vs_ig` | `credit` | `corporate_credit`, `node_cockpits.credit` |
| `global_transmission` | `cockpit_context` | global excl. SQ3 + node_cockpits |
| `master_sizing` | `cockpit_context` | all specialist layers |
| `tx_integrator` | — | WTM EXPORT v2.1 bridge |

### `snapshot` (DataGatherer)

Required keys: `hydration_ref`, `global`, `china`, `china_ladder`, `execution`, `corporate_credit`, `flows_health`, `node_summaries`, `provenance`.

`node_summaries` keys: `basis`, `credit`, `liquidity`, `breadth`, `highbeta`, `ai_compute`, `cockpit_context`.

### `specialists.<id>` — base layer

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `ok` \| `stub` \| `error` |
| `node_id` | string | Cockpit node anchor |
| `signal` | string | Qualitative read |
| `confidence` | number | 0.0–1.0 |
| `invalidation` | string | What would flip the read |
| `as_of` | ISO-8601 | Specialist run time |

### `specialists.china_sq3_deep` — facets

Each facet: `{ signal, confidence, invalidation, sources[] }`.

| Facet | Scope |
|-------|-------|
| `central_gov` | Central government actions, policies, guidance |
| `central_soe` | Central SOE actions, policies, guidance |
| `national_champions` | Top 10 (Huawei, Fosun, Alibaba, Tencent + 6) — `{ names[], notes, signal, confidence, invalidation, sources[] }` |
| `provincial_gov` | Provincial government actions, policies, guidance |
| `provincial_soe` | Provincial SOE actions, policies, guidance |

### `specialists.global_transmission`

| Field | Type | Description |
|-------|------|-------------|
| `global_only_score` | number | 0–100, liquidity+credit+breadth+highbeta+basis only |
| `global_transmission_state` | string | Normal \| Stressed \| Disorderly \| Crisis |
| `key_drivers` | string[] | Max 5 |
| `vs_full_signal` | object | `{ full_score, delta, interpretation }` vs SQ3-inclusive `whinfell_score` |
| + base layer fields | | `status`, `node_id`, `signal`, `confidence`, `invalidation`, `as_of` |

### `master_sizing`

| Field | Type | Description |
|-------|------|-------------|
| `gross_risk_pct` | number | Recommended gross risk % |
| `layer2_cap` | string | Layer2 position cap read |
| `verdict` | string | `EXECUTE` \| `WATCH` \| `BLOCKED` |
| `conflicts` | string[] | Specialist disagreements |
| `global_vs_full_weight` | string | How global-only vs full signal weighted |

---

## Bang Bang Da · `rv_history` (v1.2)

Daily RV point store for Z-score scanner (`bang_bang_da_machine.html`). Built by `scripts/enrich_hydration_rv.py` after hydrate.

| Path | Description |
|------|-------------|
| `rv_history.series.<id>.points[]` | `{ date, value }` daily observations |
| `rv_history.series.<id>.source` | `rv_basis_reconstructed` \| `ai_compute_reconstructed` \| live CSV when wired |
| `node_cockpits.basis.rv_basis.series.eth_calendar_et_near_deferred` | ETH calendar RV (enriched; Barchart `ETM26` when available) |

**BBDM trade → series map:** `gpu_crush_spread` · `btc_calendar_bt_near_deferred` · `eth_calendar_et_near_deferred` · `sofr_ois_spread` · `usgg2y10y`.  
**Registry:** `whinfell_pipeline/data_dictionary.yaml` → `rv_series.series`.

---

## Corporate Comps – Crush Analogs

Desk reference for the standalone Midwest Compute Crush page (`Whinfell_Midwest_Compute_Crush.html`).  
**Source:** `midwest_compute/wmc-data.js` → `corporate_comps`.

### Category 1: Crush-like Operators

Companies that run actual crush-style operations (spot/fwd GPU rental arb, energy-linked compute).

| Entity | Ticker | Role | Crush linkage | Margin proxy |
|--------|--------|------|---------------|--------------|
| CoreWeave | Private | GPU fwd capacity provider | Primary H100/H200 fwd crush expression; spot/fwd arb on owned fleet | Gross margin tied to rental basis vs power cost at colo sites |
| Crusoe | Private | Energy-linked compute | Flare-gas and Midwest-adjacent power basis directly in unit economics | Merchant power discount vs grid LMP drives crush margin uplift |
| Lambda Labs | Private | Rental basis operator | Spot rental index anchor; short leg of core crush (long fwd / short spot) | Spot/fwd spread is primary P&L driver on inference rentals |
| Applied Digital | APLD | Hosted GPU capacity | Colocated HPC hosting; power pass-through on Midwest-style sites | Hosting gross margin sensitive to $/MWh and utilization |
| Iris Energy | IREN | Energy + compute co-location | Renewable-powered mining/compute; power basis in margin stack | Merchant power cost vs compute revenue analog to crush margin |
| Fluidstack | Private | Regional capacity basis | EU/US capacity spreads; deferred delivery on GPU clusters | Fwd premium capture similar to 3M/6M crush curve trades |
| Vast.ai | Private | Spot GPU marketplace | Spot leg price discovery; liquidity gaps widen crush spread | Thin spot book amplifies basis dislocation signals |

### Category 2: Gross Margin Profile Analogs

Companies whose gross margin behavior is influenced by similar Midwest cost/price dynamics (power, colo, merchant energy).

| Entity | Ticker | Role | Cost/price dynamic | Margin behavior |
|--------|--------|------|--------------------|-----------------|
| Equinix | EQIX | Power-intensive colocation | Power is largest opex; Midwest hub LMP flows through to customer pricing | Gross margin compresses when merchant power rises faster than contract escalators |
| Digital Realty | DLR | Hyperscaler lease REIT | Triple-net leases with power pass-through clauses on AI-ready builds | Development yield sensitive to power basis and capex (copper/interconnect) |
| Constellation Energy | CEG | Midwest merchant power | Indiana Hub / MISO exposure; nuclear + gas merchant margin | Spark spread and RT premium drive gross margin like power leg of crush |
| Vistra | VST | Merchant generation | MISO/ERCOT-adjacent merchant stack; summer peak margin analog | Peak RT LMP capture mirrors seasonal crush scenario (+$8/MWh) |
| NextEra Energy | NEE | Regulated + merchant mix | Renewable PPA vs merchant shortfall; blended power cost curve | Regulated gross margin stable; merchant sleeve shows power basis beta |
| CME Group | CME | Basis infrastructure | BTC futures basis rails; clearing and convergence mechanics analog | Transaction margin on basis products; not crush P&L but infrastructure comp |

### Field schema (`corporate_comps`)

| Field | Type | Description |
|-------|------|-------------|
| `crush_operators` | array | Category 1 entries |
| `margin_analogs` | array | Category 2 entries |
| `name` | string | Company or entity name |
| `ticker` | string | Public ticker or `Private` |
| `role` | string | Desk role label |
| `crush_linkage` | string | How the entity maps to crush mechanics |
| `margin_note` | string | Gross margin / unit economics note |

### Related explainer (`explainer`)

Static reference block on the standalone page (collapsed by default). Subsections: core components & mechanics, key economic drivers, formulas (Crush Spread, Crush Margin, Basis P&L, Sensitivity P&L), sensitivity scenarios, risk factors & pitfalls.

---

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.2.0 | 2026-06-29 | Mission surfaces, node cockpits |
| 1.3.0 | 2026-07-03 | ai_compute, corporate_credit, trade_tracker, btc_attribution, margin_rules |
| 1.1.0-task_force | 2026-07-03 | Additive `task_force` block for Grok Task Force pipeline |