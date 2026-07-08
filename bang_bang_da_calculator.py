#!/usr/bin/env python3
"""
Bang Bang Da Machine v2.0 — desk Z-score scanner for Whinfell RV trades.

Reads hydration latest.json (+ rv_history), scores eight registry trades,
emits v2 JSON report for bang_bang_da_machine.html.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import BBDM_VERSION  # noqa: E402
from whinfell_pipeline.bbdm_gate import build_global_gate, evaluate_trade_gate  # noqa: E402
from whinfell_pipeline.bbdm_registry import BBDM_TRADES, BbdmTrade, trade_by_id  # noqa: E402
from whinfell_pipeline.bbdm_report_builder import (  # noqa: E402
    build_articulator_stub,
    build_inspection,
    build_litmus_block,
    build_v2_summary,
)
from whinfell_pipeline.recommendations import build_trade_recommendation  # noqa: E402
from whinfell_pipeline.rv_history import RvHistoryStore, inject_eth_calendar  # noqa: E402
from whinfell_pipeline.z_engine import compute_trade_horizons, dislocation_label  # noqa: E402

VERSION = BBDM_VERSION

WINDOW_MAP = {30: "1m", 60: "3m", 90: "3m"}
DEFAULT_WINDOW = 60

VERDICT_BANG = "BANG"
VERDICT_WATCH = "WATCH"
VERDICT_PASS = "PASS"
VERDICT_BLOCKED = "BLOCKED"
VERDICT_DATA_GAP = "DATA_GAP"

TRADE_RISK_NOTES: dict[str, list[str]] = {
    "btc_basis": [
        "Basis trades gap on ETF flow shocks — confirm IBIT/GBTC sleeve",
        "CME margin step-ups can force deleveraging on basis shorts",
    ],
    "btc_calendar": [
        "Roll stress near expiry widens calendar independently of Z",
        "CME margin step-ups can force deleveraging on calendar shorts",
        "Cross-read ETH calendar for beta confirmation",
    ],
    "eth_basis": [
        "ETH basis liquidity thinner than BTC — widen stop",
        "ETH/BTC beta confirmation unavailable in bundle — downgrade size",
        "Spot vs 1M forward from Barchart ET spreads when live",
    ],
    "eth_calendar": [
        "ETH calendar liquidity thinner than BTC — widen stop",
        "ETH/BTC beta confirmation unavailable in bundle — downgrade size",
        "Series from Barchart ETM26 spreads when live; synthetic fallback otherwise",
    ],
    "midwest_basis": [
        "Delivery slippage on forward GPU quotes (stub data — verify Ornn live)",
        "BTC high-beta gate caps layer2 sizing when transmission < 50",
        "MISO RT power drag on crush margin in summer peak",
    ],
    "midwest_calendar": [
        "Delivery slippage on forward GPU quotes (stub data — verify Ornn live)",
        "BTC high-beta gate caps layer2 sizing when transmission < 50",
        "MISO RT power drag on crush margin in summer peak",
    ],
    "sofr_fed_funds": [
        "Fed Funds effective may be unavailable — spread uses OIS proxy",
        "FOMC window: front-end spreads gap on policy surprise",
        "Cross-read 2s10s for duration sponsorship before sizing",
    ],
    "curve_2s10s": [
        "Duration trades amplify on CPI / payroll surprises",
        "Liquidity node gate may block RV even when Z extreme",
        "Quartile direction: higher_is_richer — positive Z = steep vs history",
    ],
}


# ---------------------------------------------------------------------------
# Math helpers
# ---------------------------------------------------------------------------


def _erfinv(x: float) -> float:
    """Inverse error function — Winitzki approximation."""
    x = max(-1.0, min(1.0, x))
    if abs(x) < 1e-8:
        return 0.0
    sign = 1.0 if x >= 0 else -1.0
    ln = math.log(1 - x * x)
    a = 0.147
    inner = 2 / (math.pi * a) + ln / 2
    return sign * math.sqrt(math.sqrt(inner * inner - ln / a) - inner)


def norm_ppf(p: float) -> float:
    """Inverse standard normal CDF without scipy."""
    p = max(1e-6, min(1 - 1e-6, p))
    erfinv = getattr(math, "erfinv", None)
    if erfinv is not None:
        return math.sqrt(2) * erfinv(2 * p - 1)
    return math.sqrt(2) * _erfinv(2 * p - 1)


def percentile_to_z(percentile: float, direction: str) -> float:
    """Map historical percentile to signed Z under normality assumption."""
    p = percentile / 100.0
    z = norm_ppf(p)
    if direction == "higher_is_cheaper":
        z = -z
    return round(z, 2)


def verdict_from_z(z: float | None, blocked: bool, data_ok: bool) -> str:
    if blocked:
        return VERDICT_BLOCKED
    if not data_ok:
        return VERDICT_DATA_GAP
    if z is None:
        return VERDICT_DATA_GAP
    az = abs(z)
    if az >= 2.0:
        return VERDICT_BANG
    if az >= 1.5:
        return VERDICT_WATCH
    return VERDICT_PASS


def safe_float(val: Any) -> float | None:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        s = val.strip()
        if not s or s.lower() in ("unavailable", "—", "-", "n/a", "null"):
            return None
        try:
            return float(s.replace(",", ""))
        except ValueError:
            return None
    return None


def dig(data: dict, *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur


def parse_as_of(bundle: dict) -> str:
    return bundle.get("as_of") or dig(bundle, "global", default={}).get("as_of") or datetime.utcnow().isoformat() + "Z"


# ---------------------------------------------------------------------------
# History mock (Chart.js feed when raw series unavailable)
# ---------------------------------------------------------------------------


def mock_history(
    current: float,
    z: float,
    window_days: int,
    n_obs: int,
    seed: str,
) -> list[dict]:
    rng = random.Random(seed)
    n = max(12, min(n_obs or window_days, window_days))
    vol = max(0.003, abs(current) * 0.04 * (1 + abs(z) * 0.08))
    end = date.today()
    pts: list[dict] = []
    v = current - z * vol * math.sqrt(n)
    for i in range(n):
        d = end - timedelta(days=n - 1 - i)
        shock = rng.gauss(0, vol)
        v = v * 0.92 + current * 0.08 + shock
        pts.append({"date": d.isoformat(), "value": round(v, 4)})
    pts[-1]["value"] = round(current, 4)
    return pts


# ---------------------------------------------------------------------------
# Trade definitions
# ---------------------------------------------------------------------------


@dataclass
class HorizonZ:
    window_days: int
    horizon_key: str
    z: float | None
    percentile: float | None
    current_value: float | None
    unit: str
    n_observations: int | None
    richness: str
    data_status: str


@dataclass
class TradeResult:
    id: str
    label: str
    structure_type: str
    trade_type: str
    structure: str
    current_value: float | None
    unit: str
    z_primary: float | None
    z_abs: float | None
    dislocation: str
    verdict: str
    window_days: int
    horizons: list[HorizonZ] = field(default_factory=list)
    history: list[dict] = field(default_factory=list)
    history_source: str = ""
    suggested_structure: str = ""
    risk_notes: list[str] = field(default_factory=list)
    data_status: str = "live"
    blocked: bool = False
    block_reason: str = ""
    gate_zone: str = ""
    verdict_cap: str = "3x"
    node_id: str = ""
    series_id: str = ""
    legs: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        registry_trade = trade_by_id(self.id)
        recommendation = build_trade_recommendation(
            self.z_primary,
            trade=registry_trade,
            trade_id=self.id,
            blocked=self.blocked,
            data_ok=self.z_primary is not None,
        )
        return {
            "id": self.id,
            "label": self.label,
            "structure_type": self.structure_type,
            "trade_type": self.trade_type,
            "structure": self.structure,
            "current_value": self.current_value,
            "unit": self.unit,
            "z_score": self.z_primary,
            "z_abs": self.z_abs,
            "dislocation": self.dislocation,
            "verdict": self.verdict,
            "window_days": self.window_days,
            "horizons": [
                {
                    "window_days": h.window_days,
                    "horizon_key": h.horizon_key,
                    "z_score": h.z,
                    "percentile": h.percentile,
                    "current_value": h.current_value,
                    "unit": h.unit,
                    "n_observations": h.n_observations,
                    "richness": h.richness,
                    "data_status": h.data_status,
                }
                for h in self.horizons
            ],
            "history": self.history,
            "history_source": self.history_source,
            "suggested_structure": self.suggested_structure,
            "risk_notes": self.risk_notes,
            "data_status": self.data_status,
            "blocked": self.blocked,
            "block_reason": self.block_reason,
            "gate_zone": self.gate_zone,
            "verdict_cap": self.verdict_cap,
            "node_id": self.node_id,
            "series_id": self.series_id,
            "legs": self.legs,
            "recommendation": recommendation,
        }


class BangBangCalculator:
    def __init__(self, bundle: dict, window_days: int = DEFAULT_WINDOW, root: Path | None = None):
        self.bundle = bundle
        inject_eth_calendar(self.bundle)
        self.root = root or ROOT
        self.rv = RvHistoryStore(self.bundle, self.root)
        self.window_days = window_days if window_days in WINDOW_MAP else DEFAULT_WINDOW
        self.horizon_key = WINDOW_MAP[self.window_days]
        self.as_of = parse_as_of(bundle)
        self._global_gate = build_global_gate(self.bundle)
        self._gate = self._global_gate.to_dict()

    def _horizon_from_result(self, result) -> HorizonZ:
        return HorizonZ(
            window_days=result.window_days,
            horizon_key=result.horizon_key,
            z=result.z_score,
            percentile=result.percentile,
            current_value=result.current_value,
            unit=result.unit,
            n_observations=result.n_observations,
            richness=result.richness,
            data_status=result.data_status,
        )

    def _trade_gate(self, node_id: str):
        return evaluate_trade_gate(node_id, self._global_gate, self.bundle)

    def _risk_notes(self, trade: BbdmTrade) -> list[str]:
        notes = list(TRADE_RISK_NOTES.get(trade.id, []))
        if trade.id in ("btc_basis", "btc_calendar"):
            notes.append(f"BTC bias: {dig(self.bundle, 'global', 'btc_bias', default='—')}")
        if trade.node_id == "aicompute":
            ai = dig(self.bundle, "ai_compute", default={}) or {}
            miso = dig(ai, "miso_indiana_hub", "lmp_usd_per_mwh", default={}) or {}
            notes.insert(
                0,
                f"MISO RT {miso.get('rt', '—')} $/MWh vs DA {miso.get('da', '—')} — power drag on crush margin",
            )
        return notes

    def score_trade(self, trade: BbdmTrade) -> TradeResult:
        trade_gate = self._trade_gate(trade.node_id)
        horizon_results = compute_trade_horizons(trade, self.rv, self.bundle)
        horizons = [self._horizon_from_result(result) for result in horizon_results]
        primary_result = next(
            (result for result in horizon_results if result.window_days == self.window_days),
            horizon_results[1] if len(horizon_results) > 1 else horizon_results[0],
        )
        primary = next(
            (horizon for horizon in horizons if horizon.window_days == self.window_days),
            horizons[1] if len(horizons) > 1 else horizons[0],
        )
        z = primary.z
        series_id = primary_result.series_id
        history = self.rv.history_for_chart(series_id, max(self.window_days, 90))
        hist_src = self.rv.source(series_id)
        legs = [
            {"side": leg["side"], "ticker": leg["ticker"], "ratio": leg.get("ratio", 1)}
            for leg in trade.legs
        ]
        data_ok = z is not None

        return TradeResult(
            id=trade.id,
            label=trade.label,
            structure_type=trade.structure_type,
            trade_type=trade.trade_type,
            structure=trade.structure,
            current_value=primary.current_value,
            unit=primary.unit or trade.unit,
            z_primary=z,
            z_abs=abs(z) if z is not None else None,
            dislocation=primary.richness if z is None else dislocation_label(z),
            verdict=verdict_from_z(z, trade_gate.blocked, data_ok),
            window_days=self.window_days,
            horizons=horizons,
            history=history,
            history_source=hist_src,
            suggested_structure=trade.suggested_structure,
            risk_notes=self._risk_notes(trade),
            data_status=primary.data_status,
            blocked=trade_gate.blocked,
            block_reason=trade_gate.block_reason,
            gate_zone=trade_gate.gate_zone,
            verdict_cap=trade_gate.verdict_cap,
            node_id=trade.node_id,
            series_id=series_id,
            legs=legs,
        )

    def run(self) -> dict:
        scored = [self.score_trade(trade) for trade in BBDM_TRADES]
        scored.sort(key=lambda trade: trade.z_abs if trade.z_abs is not None else -1, reverse=True)
        trade_dicts = [trade.to_dict() for trade in scored]
        litmus = build_litmus_block(self.root)
        articulator = build_articulator_stub(trade_dicts)
        inspection = build_inspection(
            trade_dicts,
            litmus,
            self._global_gate.risk_dashboard,
        )

        return {
            "bang_bang_da_version": VERSION,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "as_of": self.as_of,
            "snapshot_id": self.bundle.get("snapshot_id", ""),
            "window_days": self.window_days,
            "gate": self._gate,
            "risk_dashboard": self._global_gate.risk_dashboard,
            "summary": build_v2_summary(trade_dicts),
            "trades": trade_dicts,
            "litmus": litmus,
            "articulator": articulator,
            "inspection": inspection,
        }


def load_bundle(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def default_bundle_path() -> Path:
    root = Path(__file__).resolve().parent
    candidates = [
        root / "docs" / "data" / "hydration" / "latest.json",
        root / "data" / "hydration" / "latest.json",
        root / "latest.json",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return candidates[0]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Bang Bang Da Machine v1.1 calculator")
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=None,
        help="Path to hydration latest.json",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Output report JSON path",
    )
    parser.add_argument(
        "--window",
        "-w",
        type=int,
        choices=[30, 60, 90],
        default=DEFAULT_WINDOW,
        help="Primary Z-score lookback window (days)",
    )
    args = parser.parse_args(argv)

    in_path = args.input or default_bundle_path()
    if not in_path.is_file():
        print(f"ERROR: input not found: {in_path}", file=sys.stderr)
        return 1

    out_path = args.output or Path(__file__).resolve().parent / "bang_bang_da" / "bang_bang_da_report.json"

    bundle = load_bundle(in_path)
    report = BangBangCalculator(bundle, window_days=args.window).run()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Bang Bang Da v{VERSION} — {report['summary']['trade_count']} trades scored")
    print(f"  Input:  {in_path}")
    print(f"  Output: {out_path}")
    print(f"  Window: {args.window}d | Gate: {report['gate']['zone']} (score {report['gate']['whinfell_score']})")
    for t in report["trades"]:
        z = t.get("z_score")
        zs = f"{z:+.2f}" if z is not None else "—"
        print(f"  [{t['verdict']:8}] {t['label']:22} Z={zs}  {t['dislocation']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())