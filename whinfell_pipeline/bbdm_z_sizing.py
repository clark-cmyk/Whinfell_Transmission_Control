"""BBDM v2.0 Z-score sizing buckets — locked by Chunk 04 (bbdm-z-sizing-buckets)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from bang_bang_da.bbdm_report_schema import SIZING_BUCKETS, SIZING_MULTIPLIERS
from whinfell_pipeline.bbdm_registry import BBDM_TRADES, BbdmTrade, trade_by_id, trade_direction

SIZING_VERSION = "2.0.0-chunk04"

# Spec §4 thresholds on |Z| (sign determines direction only).
_BUCKET_THRESHOLDS: tuple[tuple[float, str], ...] = (
    (1.0, "PASS"),
    (2.0, "1x"),
    (3.0, "2x"),
    (float("inf"), "3x"),
)


@dataclass(frozen=True)
class TradeSizingInterpretation:
    trade_id: str
    z_score: float | None
    direction: str
    sizing_bucket: str
    sizing_multiplier: int | None
    structure_type: str
    label: str
    series_id: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "trade_id": self.trade_id,
            "z_score": self.z_score,
            "direction": self.direction,
            "sizing_bucket": self.sizing_bucket,
            "sizing_multiplier": self.sizing_multiplier,
            "structure_type": self.structure_type,
            "label": self.label,
            "series_id": self.series_id,
        }


def sizing_bucket_from_z(z_score: float | None) -> str:
    """Map Z to PASS/1x/2x/3x using spec §4 |Z| bands (ignores gate overrides)."""
    if z_score is None:
        return "DATA_GAP"
    az = abs(z_score)
    for limit, bucket in _BUCKET_THRESHOLDS:
        if az < limit:
            return bucket
    return "3x"


def get_z_size_multiplier(z_score: float | None) -> int | None:
    """Return sizing multiplier (0–3) for a Z score; None for DATA_GAP."""
    bucket = sizing_bucket_from_z(z_score)
    return SIZING_MULTIPLIERS[bucket]


def sizing_bucket(
    z_score: float | None,
    *,
    blocked: bool = False,
    data_ok: bool = True,
) -> str:
    """Resolve final bucket with gate/data overrides (BLOCKED/DATA_GAP authoritative)."""
    if not data_ok:
        return "DATA_GAP"
    if z_score is None:
        return "DATA_GAP"
    if blocked:
        return "BLOCKED"
    return sizing_bucket_from_z(z_score)


def interpret_trade_direction(
    trade_id: str,
    z_score: float | None,
    *,
    blocked: bool = False,
    data_ok: bool = True,
) -> TradeSizingInterpretation:
    """Combine registry trade metadata with Z sizing and direction rules."""
    trade = trade_by_id(trade_id)
    if trade is None:
        raise KeyError(f"unknown trade_id: {trade_id!r}")

    bucket = sizing_bucket(z_score, blocked=blocked, data_ok=data_ok)
    return TradeSizingInterpretation(
        trade_id=trade.id,
        z_score=z_score,
        direction=trade_direction(z_score),
        sizing_bucket=bucket,
        sizing_multiplier=SIZING_MULTIPLIERS[bucket],
        structure_type=trade.structure_type,
        label=trade.label,
        series_id=trade.series_id,
    )


def recommendation_for_trade(
    trade: BbdmTrade,
    z_score: float | None,
    *,
    blocked: bool = False,
    data_ok: bool = True,
) -> dict[str, Any]:
    """Build v2 report recommendation block for a registry trade."""
    from whinfell_pipeline.recommendations import recommendation_for_trade as _build

    return _build(trade, z_score, blocked=blocked, data_ok=data_ok)


def validate_sizing_engine() -> list[str]:
    """Return sizing engine consistency violations (empty list means valid)."""
    errors: list[str] = []

    cases: list[tuple[float | None, str, int | None]] = [
        (None, "DATA_GAP", None),
        (0.0, "PASS", 0),
        (0.99, "PASS", 0),
        (-0.99, "PASS", 0),
        (1.0, "1x", 1),
        (-1.0, "1x", 1),
        (1.99, "1x", 1),
        (2.0, "2x", 2),
        (-2.5, "2x", 2),
        (2.99, "2x", 2),
        (3.0, "3x", 3),
        (-4.2, "3x", 3),
    ]
    for z, expected_bucket, expected_mult in cases:
        bucket = sizing_bucket_from_z(z)
        mult = get_z_size_multiplier(z)
        if bucket != expected_bucket:
            errors.append(f"sizing_bucket_from_z({z!r}): expected {expected_bucket!r}, got {bucket!r}")
        if mult != expected_mult:
            errors.append(f"get_z_size_multiplier({z!r}): expected {expected_mult!r}, got {mult!r}")

    for trade in BBDM_TRADES:
        pos = interpret_trade_direction(trade.id, 2.5)
        neg = interpret_trade_direction(trade.id, -2.5)
        if pos.direction != "buy_spread":
            errors.append(f"{trade.id}: +Z should be buy_spread")
        if neg.direction != "sell_spread":
            errors.append(f"{trade.id}: -Z should be sell_spread")
        if pos.sizing_bucket != "2x" or neg.sizing_bucket != "2x":
            errors.append(f"{trade.id}: |Z|=2.5 should map to 2x")

    blocked = sizing_bucket(5.0, blocked=True)
    if blocked != "BLOCKED":
        errors.append("blocked gate must return BLOCKED")

    gap = sizing_bucket(2.0, data_ok=False)
    if gap != "DATA_GAP":
        errors.append("data_ok=False must return DATA_GAP")

    for bucket in ("PASS", "1x", "2x", "3x"):
        if bucket not in SIZING_BUCKETS:
            errors.append(f"SIZING_BUCKETS missing {bucket!r}")

    return errors