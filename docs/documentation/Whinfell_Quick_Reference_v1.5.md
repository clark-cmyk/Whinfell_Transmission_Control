# Whinfell Quick Reference v1.5

**Build:** `1.5-BUILD-COUSINS-2026-07-03` · **Hydration:** `1.3.0` · **Date:** July 3, 2026

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

Then in TC: Import → confirm `lineage_hash` → Accept tracer → Save State.

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