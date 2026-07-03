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

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.2.0 | 2026-06-29 | Mission surfaces, node cockpits |
| 1.3.0 | 2026-07-03 | ai_compute, corporate_credit, trade_tracker, btc_attribution, margin_rules |