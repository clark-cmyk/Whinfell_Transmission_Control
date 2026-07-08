# Bang Bang Da Machine v1.2

Desk-ready Z-score scanner for Whinfell relative-value trade sleeves. Scores five trades from hydration + **live rv_history**, assigns BANG / WATCH / PASS verdicts, and renders a standalone HTML console with API-backed window switching.

## Quick start (one click)

```bash
# macOS — enrich hydration, score, start API, open UI
open scripts/Bang_Bang_Da.command
```

## Manual workflow

```bash
# 1. Enrich latest.json with eth_calendar + rv_history
python3 scripts/enrich_hydration_rv.py

# 2. Score trades (30 / 60 / 90 day window)
python3 bang_bang_da_calculator.py -w 60

# 3. Start live API (window selector in UI calls this)
python3 scripts/bang_bang_da_server.py
# → http://127.0.0.1:8766/api/report?window=60

# 4. Serve HTML
python3 -m http.server 8765
# → http://127.0.0.1:8765/bang_bang_da_machine.html
```

## Files

| File | Role |
|------|------|
| `bang_bang_da_calculator.py` | Authoritative scorer — reads `latest.json`, writes report JSON |
| `bang_bang_da_machine.html` | Standalone desk UI (Tailwind + Chart.js CDN) |
| `bang_bang_da/bang_bang_da_report.json` | Generated output consumed by the HTML panel |

## Trade universe (5 sleeves)

| ID | Label | Type | Primary data path |
|----|-------|------|-------------------|
| `midwest_compute` | Midwest Compute Crush | `compute` | `ai_compute.ornn_h200.rental_usd_per_hr` (crush = 3M − spot) |
| `btc_calendar` | BTC Calendar | `crypto_calendar` | `node_cockpits.basis.rv_basis.series.btc_calendar_bt_near_deferred` |
| `eth_calendar` | ETH Calendar | `crypto_calendar` | `node_cockpits.basis.rv_basis.series.eth_calendar_et_near_deferred` (enriched) |
| `sofr_fed_funds` | SOFR vs Fed Funds | `rates` | `node_cockpits.liquidity.rv_basis.series.sofr_ois_spread` |
| `curve_2s10s` | 2s10s Curve | `rates` | `node_cockpits.liquidity.rv_basis.series.usgg2y10y` |

## Z-score methodology

1. **RV series trades** (BTC/ETH calendar, SOFR, 2s10s): percentile from hydration `rv_basis.horizons` is mapped to a normal Z via inverse CDF, signed by `quartile_direction` (`higher_is_richer` vs `higher_is_cheaper`).
2. **Window mapping**: 30d → `1m` horizon, 60d/90d → `3m` horizon in the bundle.
3. **Midwest Compute**: crush spread Z from `ai_compute` spot/3M fwd with stub mean/std when RV history is absent; marked `data_status: proxy|stub`.
4. **Historical chart + Z**: `rv_history` daily points (bundle inline or `docs/data/hydration/rv_history.json`). Z computed as `(last − μ) / σ` over the selected window. Reconstructed paths marked `rv_basis_reconstructed` until Barchart/Koyfin dated CSV wired.

## Verdict rules

| Verdict | Condition |
|---------|-----------|
| `BANG` | \|Z\| ≥ 2.0 and gate open |
| `WATCH` | \|Z\| ≥ 1.5 and gate open |
| `PASS` | \|Z\| < 1.5 and gate open |
| `BLOCKED` | Whinfell score < 50 or node `blocks_rv` |
| `DATA_GAP` | Primary series missing |

## Gate integration

Reads `global.whinfell_score`, `margin_rules`, and per-node `gate_interaction` from the hydration bundle. Score < 50 blocks layer2/3 expressions regardless of Z extremity.

## Report JSON schema

```json
{
  "bang_bang_da_version": "1.2.0",
  "generated_at": "ISO-8601",
  "as_of": "ISO-8601",
  "snapshot_id": "string",
  "window_days": 60,
  "gate": {
    "whinfell_score": 38,
    "transmission_state": "impaired",
    "regime_tag": "string",
    "tier": "defensive",
    "zone": "red|amber|green",
    "blocked": true,
    "block_reason": "string"
  },
  "summary": {
    "trade_count": 5,
    "verdict_counts": { "BANG": 0, "WATCH": 1, "PASS": 2, "BLOCKED": 2, "DATA_GAP": 0 },
    "top_signal": "BTC Calendar",
    "top_z": 1.18
  },
  "trades": [
    {
      "id": "btc_calendar",
      "label": "BTC Calendar",
      "trade_type": "crypto_calendar",
      "structure": "string",
      "current_value": 1.25,
      "unit": "pct",
      "z_score": 1.18,
      "z_abs": 1.18,
      "dislocation": "fair|rich|cheap|extreme",
      "verdict": "WATCH",
      "window_days": 60,
      "horizons": [{ "window_days": 30, "z_score": 1.33, "percentile": 63.6, "..." : "..." }],
      "history": [{ "date": "2026-06-01", "value": 1.21 }],
      "suggested_structure": "string",
      "risk_notes": ["string"],
      "data_status": "live|proxy|stub|missing",
      "blocked": true,
      "block_reason": "string",
      "gate_zone": "red",
      "node_id": "basis",
      "series_id": "btc_calendar_bt_near_deferred",
      "legs": [{ "label": "BT calendar spread", "legs": [{ "side": "long", "ticker": "BTQ26", "ratio": 1 }] }]
    }
  ]
}
```

## UI features (v1.1)

- Sort by \|Z-score\| (default descending)
- Filter by verdict and trade type
- Row-click detail panel: multi-timeframe Z grid, Chart.js history, suggested structure, risk notes, implementation legs
- Color-coded dislocation + verdict badges
- Export full report JSON from browser
- Responsive dark theme (Tailwind CDN)

## v1.2 additions

- `whinfell_pipeline/rv_history.py` — live daily points + window Z
- `scripts/enrich_hydration_rv.py` — injects `eth_calendar_et_near_deferred` + `rv_history`
- `scripts/bang_bang_da_server.py` — `:8766` API for window selector
- `scripts/Bang_Bang_Da.command` — desk one-click launcher

## v1.0 → v1.1 changelog

| Area | v1.0 | v1.1 |
|------|------|------|
| Trades | 2 (BTC + Midwest stub) | All 5 desk sleeves |
| Window | Fixed 30d | 30 / 60 / 90d selectable |
| Missing data | Silent zeros | `DATA_GAP` verdict + `data_status` flags |
| Gate | Ignored | Whinfell score + node `blocks_rv` |
| UI | Flat table | Detail panel, filters, export, Chart.js |
| Z accuracy | Raw percentile display | Signed Z with `quartile_direction` |

## Related operator docs

| Doc | Path |
|-----|------|
| User Guide §7 | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Quick Reference | `documentation/Whinfell_Quick_Reference_v1.5.md` |
| Desk URLs | `documentation/DESK_URLS.md` |
| BUILD TODO | `01_Strategy_Docs/BUILD_TODO_List.md` § Bang Bang Da v1.2 |

## Dependencies

- Python 3.9+ (stdlib only — no pip packages)
- Browser with network access for Tailwind + Chart.js CDN