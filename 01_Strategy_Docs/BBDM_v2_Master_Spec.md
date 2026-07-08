# Whinfell Transmission Control — Bang Bang Da Machine v2.0

**Full Human Vision & Product Specification**  
**Document version:** 2.0  
**Date:** July 7, 2026  
**Authority source:** [`Whinfell Transmission Control — Bang Bang Da Machine v2.0.txt`](../Whinfell%20Transmission%20Control%20%E2%80%94%20Bang%20Bang%20Da%20Machine%20v2.0.txt)  
**Implementation plan:** [`BBDM_v2_Development_Plan.md`](BBDM_v2_Development_Plan.md)  
**Code baseline:** Bang Bang Da v1.2 (`bang_bang_da_calculator.py`, `rv_history.py`, `bang_bang_da_machine.html`)

---

## Table of Contents

1. [Introduction and Philosophy](#1-introduction-and-philosophy)
2. [Core Framework & Naming](#2-core-framework--naming)
3. [Risk Dashboard (Whinfell Score Layer)](#3-risk-dashboard-whinfell-score-layer)
4. [Origin Story Trades & Trade Structure](#4-origin-story-trades--trade-structure)
5. [Litmus Module — Full Specification](#5-litmus-module--full-specification)
6. [System Architecture & Building Blocks](#6-system-architecture--building-blocks)
7. [Data Sources](#7-data-sources)
8. [Testing, Inspection & Export Requirements](#8-testing-inspection--export-requirements)
9. [Appendix A — v1.2 → v2.0 Implementation Delta](#appendix-a--v12--v20-implementation-delta)

---

## 1. Introduction and Philosophy

This system is not a collection of separate tools. It is one long, flowing journey — like the Grateful Dead moving through *Dark Star* into *Saint Stephen*, into *The Eleven*, then flowing back through *Saint Stephen* again, back into *The Eleven*, and finally resolving into *Love Light*.

The mission is to replace the old, slow, manual way traders analyze basis and relative value trades with a much faster, smarter, and more structured system, while still allowing traders to work the old way when desired. **Every major output must be exportable to clean Excel.**

---

## 2. Core Framework & Naming

The system is built around five core modules:

| Module | Role |
|--------|------|
| **Scan** | High-level overview and signal detection |
| **D.I.G.** (Deep Intelligence Gathering) | Detailed analysis and commentary |
| **Iterate** | Trade Modeler and backtesting engine |
| **Litmus** | Corporate and industry reality check layer |
| **Articulator** | Hybrid commentary engine (Grok API + Comet) |

The journey is **circular**. The user must be able to flow back into the main Whinfell Transmission Control system at any time.

---

## 3. Risk Dashboard (Whinfell Score Layer)

At the very top of Bang Bang Da, the user must see three distinct scores:

| Score | Meaning |
|-------|---------|
| **Whinfell Score** | Pure transmission score — **excludes China** |
| **SQ3** | China policy track |
| **Whinfell + China** | Combined score |

**Hydration mappings (BUILD locked):**

| Display | Primary path | Fallback |
|---------|--------------|----------|
| Whinfell (ex-China) | `task_force.specialists.global_transmission.global_only_score` | Derive from liquidity + credit + basis nodes |
| SQ3 | `china.sq3_score` | — |
| Combined | `global.whinfell_score` | — |

---

## 4. Origin Story Trades & Trade Structure

The system supports **eight trades**.

### Dual Structure Trades

| Pair | Basis | Calendar |
|------|-------|----------|
| BTC | Spot vs 1-month | 1m vs 3m |
| ETH | Spot vs 1-month | 1m vs 3m |
| Midwest Compute | Spot vs 1-month | 1m vs 3m |

### Single Structure Trades

- SOFR vs Fed Funds
- 2s10s Curve

### Z-Score Sizing Buckets

| Z-score range | Bucket |
|---------------|--------|
| Z &lt; +1.0 | **PASS** |
| +1.0 to +2.0 | **1x** |
| +2.0 to +3.0 | **2x** |
| ≥ +3.0 | **3x** |

**Direction rules:**

- **Positive Z-score** = Buy the spread (Long back month, Short front month)
- **Negative Z-score** = Sell the spread

Gate overrides (`BLOCKED`, `DATA_GAP`) remain authoritative over sizing buckets when transmission or data quality blocks expression.

---

## 5. Litmus Module — Full Specification

Litmus is the corporate/industry reality check. It answers: *"Does the statistical signal make sense in the real world?"*

### General Rules

- Appears in both **D.I.G.** and **Iterate** layers
- Contains a clean table + **Articulator** commentary
- Small **red indicator** for new filings not yet processed by Operator

### Midwest Compute Crush Litmus

**Primary:** Microsoft (Intelligent Cloud), Alphabet (Google Cloud), Amazon (AWS), Oracle (OCI), Super Micro (SMCI)

**Nice-to-Have:** Meta, Vistra, Constellation Energy, Nvidia

**Columns:** Company, Segment, Current GM%, 3yr Avg, 3yr Z-Score, Quartile, editable Cloud Multiplier, Regime Signal, Status

### BTC Calendar Litmus

**Market Signals:** Perp Funding (Aggregate), Deribit, Hyperliquid, CF Benchmark, ETF Flows

**Miner Signals:** Blended Cost per Bitcoin, Cash Cost per Bitcoin, Hashrate Growth

Red indicator for new miner filings.

### ETH Calendar Litmus

**Market Signals:** Same as BTC

**Institutional Signals:** ETH ETF Flows, % of ETH Staked, Staking Entry Queue, BlackRock ETHB Inflows, Public Company ETH Holdings

### SOFR vs Fed Funds Litmus

SOFR vs Fed Funds Spread, Bank NIM, RRP Usage, Bank Reserves Trend

### 2s10s Curve Litmus

2s10s Spread, Financials GM, Industrials GM, Bank NIM, Cyclical vs Defensive Margin Gap

---

## 6. System Architecture & Building Blocks

1. **Statistical Analysis** — Z-scores, horizons, rv_history
2. **Math & Recommendations Engine** — sizing buckets, direction, structure strings
3. **Articulator** — Hybrid: Grok API primary + Comet secondary
4. **Litmus** — corporate/industry tables per trade
5. **Iterate** — Trade Modeler + backtest scaffold

---

## 7. Data Sources

| Domain | Source |
|--------|--------|
| Futures | Barchart |
| Spot, ETFs, Corporate Data | Koyfin |
| GPU Data | Silicon Data + provider aggregation |
| Transcripts & Filings | SEC EDGAR + earnings calls |
| Perp Funding & OI | CoinGlass API |

---

## 8. Testing, Inspection & Export Requirements

- Every major view must have **"Export to Excel"**
- Every table and Articulator block must have **"Copy"** buttons
- System must support **Inspection Mode** with pass/fail status
- Python must intelligently detect new filings and show small red indicators

---

## Appendix A — v1.2 → v2.0 Implementation Delta

*Locked by BUILD · Chunk 01 · July 7, 2026*

### A.1 Trade Universe

| v1.2 ID | v2 ID | Change |
|---------|-------|--------|
| `btc_calendar` | `btc_basis` + `btc_calendar` | Split basis vs calendar |
| `eth_calendar` | `eth_basis` + `eth_calendar` | Split basis vs calendar |
| `midwest_compute` | `midwest_basis` + `midwest_calendar` | Split basis vs calendar |
| `sofr_fed_funds` | `sofr_fed_funds` | Unchanged |
| `curve_2s10s` | `curve_2s10s` | Unchanged |

**Count:** 5 sleeves → **8 trades**

### A.2 Verdict Model

| v1.2 | v2 | Notes |
|------|-----|-------|
| `BANG` ( \|Z\| ≥ 2.0 ) | `2x` or `3x` bucket | Map BANG → 2x/3x in migration docs only |
| `WATCH` ( \|Z\| ≥ 1.5 ) | `1x` or `2x` bucket | Map WATCH → 1x/2x |
| `PASS` ( \|Z\| &lt; 1.5 ) | `PASS` ( Z &lt; 1.0 ) | Threshold tightened per spec |
| `BLOCKED` | `BLOCKED` | Gate &lt; 50 or `blocks_rv` — overrides bucket |
| `DATA_GAP` | `DATA_GAP` | Missing primary series |

### A.3 UI Modules

| v1.2 | v2 |
|------|-----|
| Single-page table + detail panel | Five-module IA: Scan · D.I.G. · Litmus · Iterate · Articulator |
| Gate chip (single score) | Risk dashboard: Whinfell ex-China · SQ3 · Combined |
| JSON export only | Excel per view · Copy all tables · Inspection Mode |

### A.4 New Subsystems (not in v1.2)

| Subsystem | v2 deliverable |
|-----------|----------------|
| Litmus | Per-trade corporate/industry tables + filing red dots |
| Articulator | Grok primary + Comet fallback commentary |
| Iterate | Trade modeler shell + backtest scaffold |
| Inspection | `report.inspection` pass/fail checklist |

### A.5 Code Touchpoints (existing files to evolve)

| File | v2 role |
|------|---------|
| `bang_bang_da_calculator.py` | 8-trade registry, sizing buckets, litmus merge, risk_dashboard |
| `whinfell_pipeline/rv_history.py` | 8 series map, live-only policy |
| `scripts/enrich_hydration_rv.py` | All 8 series injection |
| `bang_bang_da_machine.html` | IA shell, five module panes |
| `scripts/bang_bang_da_server.py` | API v2 report + litmus/articulator slices |
| `bang_bang_da/README.md` | Operator docs (update at Chunk 55) |

### A.6 Deferred to v2.1

- Full WTC Dig embed (standalone-first through v2.0)
- Live CoinGlass production API keys
- Full Iterate P&L engine (v2 ships backtest scaffold only)

### A.7 Ship Gate

v2.0 ships when: 55 micro-chunks complete · `test_bang_bang_da.py` PASS · desk walk-through rated in `Desk_Feedback_Log.md`.