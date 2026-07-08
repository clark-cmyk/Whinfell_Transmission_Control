"""BBDM v2 Chunk 20 — trade recommendations engine (direction, sizing, structure)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from whinfell_pipeline.bbdm_registry import BBDM_TRADES, BbdmTrade, trade_by_id, trade_direction
from whinfell_pipeline.bbdm_z_sizing import interpret_trade_direction, sizing_bucket
from whinfell_pipeline.z_engine import TradeZResult

RECOMMENDATIONS_VERSION = "2.0.0-chunk20"

# Direction-aware structure templates for single-leg registry trades (no spread legs).
_SINGLE_STRUCTURE_TEMPLATES: dict[str, dict[str, str]] = {
    "sofr_fed_funds": {
        "buy_spread": "Receive SOFR / pay Fed Funds — fade cheap front-end funding",
        "sell_spread": "Pay SOFR / receive Fed Funds — fade rich front-end funding",
        "none": "SOFR-OIS / front-end funding spread — no actionable dislocation",
    },
    "curve_2s10s": {
        "buy_spread": "Flattener via long front / short back (IEF/TLT pair) — fade rich curve",
        "sell_spread": "Steepener via short front / long back (IEF/TLT pair) — fade cheap curve",
        "none": "2s10s curve — no actionable dislocation",
    },
}


@dataclass(frozen=True)
class TradeRecommendation:
    direction: str
    sizing_bucket: str
    sizing_multiplier: int | None
    structure: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "direction": self.direction,
            "sizing_bucket": self.sizing_bucket,
            "sizing_multiplier": self.sizing_multiplier,
            "structure": self.structure,
        }


def resolve_trade(trade_id: str) -> BbdmTrade | None:
    """Resolve v2 registry trade by id or v1.2 sleeve alias."""
    trade = trade_by_id(trade_id)
    if trade is not None:
        return trade

    matches = [t for t in BBDM_TRADES if t.v12_id == trade_id]
    if not matches:
        return None

    if trade_id == "midwest_compute":
        for candidate in matches:
            if candidate.id == "midwest_calendar":
                return candidate

    return matches[0]


def _flip_side(side: str) -> str:
    if side == "long":
        return "short"
    if side == "short":
        return "long"
    return side


def _structure_from_legs(
    legs: tuple[dict[str, str | int], ...],
    direction: str,
) -> str:
    if not legs:
        return ""

    parts: list[str] = []
    for leg in legs:
        side = str(leg.get("side", ""))
        if direction == "sell_spread":
            side = _flip_side(side)
        elif direction == "none":
            side = "watch"
        ticker = str(leg.get("ticker", ""))
        parts.append(f"{side.capitalize()} {ticker}")
    return " / ".join(parts)


def build_structure_string(
    trade: BbdmTrade,
    direction: str,
    *,
    z_score: float | None = None,
) -> str:
    """Build direction-aware suggested structure per spec §4."""
    if direction == "none":
        return trade.structure

    if direction in _SINGLE_STRUCTURE_TEMPLATES.get(trade.id, {}):
        return _SINGLE_STRUCTURE_TEMPLATES[trade.id][direction]

    if direction == "buy_spread" and trade.suggested_structure:
        return trade.suggested_structure

    if trade.legs:
        leg_structure = _structure_from_legs(trade.legs, direction)
        if leg_structure:
            return leg_structure

    return trade.suggested_structure or trade.structure


def build_trade_recommendation(
    z_score: float | None,
    *,
    trade: BbdmTrade | None = None,
    trade_id: str | None = None,
    blocked: bool = False,
    data_ok: bool = True,
) -> dict[str, Any]:
    """Build v2 ``trade.recommendation`` block from Z score and registry trade."""
    resolved = trade
    if resolved is None:
        if trade_id is None:
            raise ValueError("build_trade_recommendation requires trade or trade_id")
        resolved = resolve_trade(trade_id)
        if resolved is None:
            raise KeyError(f"unknown trade_id: {trade_id!r}")

    interp = interpret_trade_direction(
        resolved.id,
        z_score,
        blocked=blocked,
        data_ok=data_ok,
    )
    direction = interp.direction
    structure = build_structure_string(resolved, direction, z_score=z_score)

    return TradeRecommendation(
        direction=direction,
        sizing_bucket=interp.sizing_bucket,
        sizing_multiplier=interp.sizing_multiplier,
        structure=structure,
    ).to_dict()


def recommendation_for_trade(
    trade: BbdmTrade,
    z_score: float | None,
    *,
    blocked: bool = False,
    data_ok: bool = True,
) -> dict[str, Any]:
    """Backward-compatible alias used by sizing module and report builders."""
    return build_trade_recommendation(
        z_score,
        trade=trade,
        blocked=blocked,
        data_ok=data_ok,
    )


def recommendation_from_z_result(
    result: TradeZResult,
    *,
    blocked: bool = False,
    data_ok: bool | None = None,
) -> dict[str, Any]:
    """Build recommendation from unified Z engine output."""
    if data_ok is None:
        data_ok = result.z_score is not None and result.data_status != "missing"
    return build_trade_recommendation(
        result.z_score,
        trade_id=result.trade_id,
        blocked=blocked,
        data_ok=data_ok,
    )


def validate_recommendations_engine() -> list[str]:
    """Return recommendations engine consistency violations (empty list means valid)."""
    errors: list[str] = []

    if len(BBDM_TRADES) != 8:
        errors.append(f"expected 8 registry trades, got {len(BBDM_TRADES)}")

    for trade in BBDM_TRADES:
        buy = build_trade_recommendation(2.5, trade=trade)
        sell = build_trade_recommendation(-2.5, trade=trade)
        if buy["direction"] != "buy_spread":
            errors.append(f"{trade.id}: +Z should be buy_spread")
        if sell["direction"] != "sell_spread":
            errors.append(f"{trade.id}: -Z should be sell_spread")
        if buy["sizing_bucket"] != "2x" or sell["sizing_bucket"] != "2x":
            errors.append(f"{trade.id}: |Z|=2.5 should map to 2x bucket")
        if buy["sizing_multiplier"] != 2 or sell["sizing_multiplier"] != 2:
            errors.append(f"{trade.id}: |Z|=2.5 should map to 2x multiplier")
        if not buy.get("structure"):
            errors.append(f"{trade.id}: buy structure string required")
        if not sell.get("structure"):
            errors.append(f"{trade.id}: sell structure string required")

        blocked = build_trade_recommendation(3.5, trade=trade, blocked=True)
        if blocked["sizing_bucket"] != "BLOCKED":
            errors.append(f"{trade.id}: blocked gate must return BLOCKED bucket")
        if blocked["sizing_multiplier"] is not None:
            errors.append(f"{trade.id}: BLOCKED bucket must have null multiplier")

        gap = build_trade_recommendation(None, trade=trade)
        if gap["sizing_bucket"] != "DATA_GAP":
            errors.append(f"{trade.id}: missing Z must return DATA_GAP bucket")
        if gap["direction"] != "none":
            errors.append(f"{trade.id}: missing Z must return none direction")

    if resolve_trade("midwest_compute") is None:
        errors.append("midwest_compute v1.2 alias must resolve to registry trade")

    if trade_direction(1.0) != "buy_spread" or trade_direction(-1.0) != "sell_spread":
        errors.append("trade_direction sign rules violated")

    bucket_cases: list[tuple[float, str]] = [
        (0.5, "PASS"),
        (1.0, "1x"),
        (2.0, "2x"),
        (3.0, "3x"),
    ]
    for z, expected in bucket_cases:
        if sizing_bucket(z) != expected:
            errors.append(f"sizing_bucket({z}): expected {expected!r}")

    return errors