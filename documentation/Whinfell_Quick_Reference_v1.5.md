# Whinfell Quick Reference v1.5

**Build:** `1.5-BUILD-COUSINS-2026-07-04-PHASE23` · **Hydration:** `1.3.0` · **BBDM:** `1.2.0` · **Desk ops:** `1.0` · **Date:** July 7, 2026

---

## Desk data ops (all tools)

| Button | Action |
|--------|--------|
| **Collect CSVs** | Barchart + Koyfin → drop → hydrate (`:8767` agent) |
| **Refresh data** | Reload hydration + curve + all panels |

**TC:** header strip · **Standalone:** ops bar under title  
**Agent:** `python3 scripts/whinfell_collect_agent.py`

---

## Specialized tools (left rail)

BasisWatch · Midwest Compute Crush · Bang Bang Da ↗ · Ladder deep dive ↗

---

## Open desk

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh && cd dist && python3 -m http.server 8765
```

**Pages:** `https://clark-cmyk.github.io/Whinfell_Transmission_Control/` (private repo — needs Pro)  
**Public fallback:** `https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/`

---

## Morning chain

```bash
cd ~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE
bash scripts/normalize_whinfell_drop.sh ~/Downloads/whinfell_drop
python3 -m whinfell_pipeline.hydrate -o data/hydration/latest.json
```

Then in TC: **Refresh data** (or Import) → confirm `lineage_hash` → Accept tracer → Save State.

**After hydrate (BBDM):** `python3 scripts/enrich_hydration_rv.py` — adds `eth_calendar_et_near_deferred` + `rv_history` to `latest.json`.

---

## Bang Bang Da Machine

RV dislocation scanner — five trades, BANG/WATCH/PASS verdicts from `rv_history` Z-scores.

```bash
open scripts/Bang_Bang_Da.command
```

| Trade | Series |
|-------|--------|
| Midwest Compute Crush | `gpu_crush_spread` |
| BTC Calendar | `btc_calendar_bt_near_deferred` |
| ETH Calendar | `eth_calendar_et_near_deferred` |
| SOFR vs Fed Funds | `sofr_ois_spread` |
| 2s10s Curve | `usgg2y10y` |

- **UI:** `http://127.0.0.1:8765/bang_bang_da_machine.html`
- **API:** `http://127.0.0.1:8766/api/report?window=30|60|90`
- **Doc:** `bang_bang_da/README.md`

---

## Five node cockpits

| Node | RV focus |
|------|----------|
| Basis | Calendar vs ref band |
| Credit | HY OAS proxy |
| Liquidity | 2s10s |
| Breadth | IWM/SPY |
| Highbeta | IBIT vs QQQ |

---

## v1.5 tabs

| Tab | Modules |
|-----|---------|
| AI Compute | H200 curve · MISO Indiana Hub · crush trade |
| v1.5 Desk | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |

---

## Gate bands

| Score | Posture |
|-------|---------|
| &lt; 50 | Defensive · L2/L3 blocked |
| 50–64 | Light · 0.5× size |
| 65–79 | Selective |
| ≥ 80 | Full |

---

## Key paths

| Item | Path |
|------|------|
| TC repo | `~/Desktop/Whinfell_Transmission_Control` |
| Pipeline | `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` |
| Hydration | `data/hydration/latest.json` |
| User guide | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Excel export | `08_Deliverables/Whinfell_Hydration_v15.xlsx` |