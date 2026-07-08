"""BBDM v2.0 eight-trade registry — locked by Chunk 03 (bbdm-eight-trade-registry)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from bang_bang_da.bbdm_report_schema import STRUCTURE_TYPES, TRADE_DIRECTIONS, TRADE_IDS_V2

StructureType = Literal["basis", "calendar", "single"]
QuartileDirection = Literal["higher_is_richer", "higher_is_cheaper"]
TradeDirection = Literal["buy_spread", "sell_spread", "none"]

REGISTRY_VERSION = "2.0.0-chunk03"


@dataclass(frozen=True)
class BbdmTrade:
    """Canonical trade definition for Bang Bang Da v2 scoring and UI layers."""

    id: str
    label: str
    structure_type: StructureType
    trade_type: str
    series_id: str
    node_id: str
    quartile_direction: QuartileDirection
    unit: str
    structure: str
    pair_group: str | None = None
    v12_id: str | None = None
    series_fallback_ids: tuple[str, ...] = ()
    suggested_structure: str = ""
    legs: tuple[dict[str, str | int], ...] = ()

    @property
    def cockpit_series_path(self) -> tuple[str, ...]:
        if self.node_id == "aicompute":
            return ("ai_compute",)
        return ("node_cockpits", self.node_id, "rv_basis", "series", self.series_id)

    @property
    def rv_series_dict_path(self) -> tuple[str, ...]:
        return ("rv_series", "series", self.series_id)


def trade_direction(z_score: float | None, *, epsilon: float = 0.01) -> TradeDirection:
    """Spec §4: +Z buy spread (long back / short front); −Z sell spread."""
    if z_score is None:
        return "none"
    if z_score >= epsilon:
        return "buy_spread"
    if z_score <= -epsilon:
        return "sell_spread"
    return "none"


BBDM_TRADES: tuple[BbdmTrade, ...] = (
    BbdmTrade(
        id="btc_basis",
        label="BTC Basis (Spot vs 1m)",
        structure_type="basis",
        trade_type="crypto_basis",
        series_id="btc_basis_spot_1m",
        node_id="basis",
        quartile_direction="higher_is_richer",
        unit="pct",
        structure="Spot vs 1-month BTC forward",
        pair_group="btc",
        v12_id="btc_calendar",
        series_fallback_ids=("btc_basis_vs_refs",),
        suggested_structure="Long 1M BT forward / short spot or IBIT — fade basis richness",
        legs=(
            {"side": "long", "ticker": "BT 1M Fwd", "ratio": 1},
            {"side": "short", "ticker": "BTC Spot / IBIT", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="btc_calendar",
        label="BTC Calendar (1m vs 3m)",
        structure_type="calendar",
        trade_type="crypto_calendar",
        series_id="btc_calendar_bt_near_deferred",
        node_id="basis",
        quartile_direction="higher_is_richer",
        unit="pct",
        structure="BT near vs deferred calendar",
        pair_group="btc",
        v12_id="btc_calendar",
        suggested_structure="Long deferred BT (BTQ) / short near BT (BTM) — fade richness",
        legs=(
            {"side": "long", "ticker": "BT Deferred", "ratio": 1},
            {"side": "short", "ticker": "BT Near", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="eth_basis",
        label="ETH Basis (Spot vs 1m)",
        structure_type="basis",
        trade_type="crypto_basis",
        series_id="eth_basis_spot_1m",
        node_id="basis",
        quartile_direction="higher_is_richer",
        unit="pct",
        structure="Spot vs 1-month ETH forward",
        pair_group="eth",
        v12_id="eth_calendar",
        suggested_structure="Long 1M ET forward / short spot or ETH vehicle — fade basis richness",
        legs=(
            {"side": "long", "ticker": "ET 1M Fwd", "ratio": 1},
            {"side": "short", "ticker": "ETH Spot", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="eth_calendar",
        label="ETH Calendar (1m vs 3m)",
        structure_type="calendar",
        trade_type="crypto_calendar",
        series_id="eth_calendar_et_near_deferred",
        node_id="basis",
        quartile_direction="higher_is_richer",
        unit="pct",
        structure="ET near vs deferred calendar",
        pair_group="eth",
        v12_id="eth_calendar",
        suggested_structure="Long deferred ET / short near ET — confirm vs BTC calendar peer",
        legs=(
            {"side": "long", "ticker": "ET Deferred", "ratio": 1},
            {"side": "short", "ticker": "ET Near", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="midwest_basis",
        label="Midwest Compute Basis (Spot vs 1m)",
        structure_type="basis",
        trade_type="compute",
        series_id="gpu_basis_spread",
        node_id="aicompute",
        quartile_direction="higher_is_richer",
        unit="$/hr spread",
        structure="Long 1M H200 fwd · Short spot rental (Ornn)",
        pair_group="midwest",
        v12_id="midwest_compute",
        series_fallback_ids=("gpu_crush_spread",),
        suggested_structure="Long 1M H200 fwd / short spot rental; overlay MISO RT hedge if summer peak",
        legs=(
            {"side": "long", "ticker": "H200 1M Fwd", "ratio": 1},
            {"side": "short", "ticker": "H200 Spot", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="midwest_calendar",
        label="Midwest Compute Calendar (1m vs 3m)",
        structure_type="calendar",
        trade_type="compute",
        series_id="gpu_crush_calendar_spread",
        node_id="aicompute",
        quartile_direction="higher_is_richer",
        unit="$/hr spread",
        structure="Long 3M H200 fwd · Short 1M fwd",
        pair_group="midwest",
        v12_id="midwest_compute",
        series_fallback_ids=("gpu_crush_spread",),
        suggested_structure="Long 3M H200 fwd / short 1M fwd; overlay MISO RT hedge if summer peak",
        legs=(
            {"side": "long", "ticker": "H200 3M Fwd", "ratio": 1},
            {"side": "short", "ticker": "H200 1M Fwd", "ratio": 1},
        ),
    ),
    BbdmTrade(
        id="sofr_fed_funds",
        label="SOFR vs Fed Funds",
        structure_type="single",
        trade_type="rates",
        series_id="sofr_ois_spread",
        node_id="liquidity",
        quartile_direction="higher_is_cheaper",
        unit="bps",
        structure="SOFR-OIS / front-end funding spread",
        v12_id="sofr_fed_funds",
        suggested_structure="Receive SOFR vs pay Fed Funds when spread rich; EFFR leg may be proxy",
    ),
    BbdmTrade(
        id="curve_2s10s",
        label="2s10s Curve",
        structure_type="single",
        trade_type="rates",
        series_id="usgg2y10y",
        node_id="liquidity",
        quartile_direction="higher_is_richer",
        unit="pct",
        structure="2s10s curve trade / duration RV",
        v12_id="curve_2s10s",
        suggested_structure="Steepener if cheap (Z < −1.5); flattener if rich (Z > +1.5) via IEF/TLT pair",
    ),
)

BBDM_TRADE_BY_ID: dict[str, BbdmTrade] = {trade.id: trade for trade in BBDM_TRADES}


def trade_by_id(trade_id: str) -> BbdmTrade | None:
    return BBDM_TRADE_BY_ID.get(trade_id)


def trade_for_series(series_id: str) -> BbdmTrade | None:
    """Resolve BBDM trade owning a primary or fallback rv_history series_id."""
    matches = [
        trade
        for trade in BBDM_TRADES
        if trade.series_id == series_id or series_id in trade.series_fallback_ids
    ]
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]
    # v1.2 legacy crush spread is shared; calendar trade is authoritative owner.
    if series_id == "gpu_crush_spread":
        for trade in matches:
            if trade.id == "midwest_calendar":
                return trade
    return matches[0]


def registry_series_node_map() -> dict[str, tuple[str, str]]:
    """Primary series_id → (cockpit node, series_id) for rv_history SERIES_NODE_MAP extension."""
    out: dict[str, tuple[str, str]] = {}
    for trade in BBDM_TRADES:
        node = trade.node_id if trade.node_id != "aicompute" else ""
        out[trade.series_id] = (node, trade.series_id)
        for fallback_id in trade.series_fallback_ids:
            out.setdefault(fallback_id, (node, fallback_id))
    return out


def validate_registry() -> list[str]:
    """Return registry consistency violations (empty list means valid)."""
    errors: list[str] = []
    ids = [trade.id for trade in BBDM_TRADES]
    if len(ids) != 8:
        errors.append(f"BBDM_TRADES: expected 8 entries, got {len(ids)}")
    if tuple(ids) != TRADE_IDS_V2:
        errors.append(f"BBDM_TRADES ids must match TRADE_IDS_V2 order: {ids!r}")
    if len(set(ids)) != 8:
        errors.append("BBDM_TRADES: duplicate trade ids")

    pair_groups: dict[str, set[str]] = {}
    for trade in BBDM_TRADES:
        if trade.structure_type not in STRUCTURE_TYPES:
            errors.append(f"{trade.id}: invalid structure_type {trade.structure_type!r}")
        if trade.pair_group:
            pair_groups.setdefault(trade.pair_group, set()).add(trade.structure_type)
        if trade.structure_type in ("basis", "calendar") and not trade.pair_group:
            errors.append(f"{trade.id}: basis/calendar trades require pair_group")

    for group, types in pair_groups.items():
        if types != {"basis", "calendar"}:
            errors.append(f"pair_group {group!r}: expected basis+calendar, got {sorted(types)}")

    v12_ids = {trade.v12_id for trade in BBDM_TRADES if trade.v12_id}
    expected_v12 = {
        "btc_calendar",
        "eth_calendar",
        "midwest_compute",
        "sofr_fed_funds",
        "curve_2s10s",
    }
    if v12_ids != expected_v12:
        errors.append(f"v12_id coverage mismatch: {v12_ids!r}")

    for direction in ("buy_spread", "sell_spread", "none"):
        if direction not in TRADE_DIRECTIONS:
            errors.append(f"TRADE_DIRECTIONS missing {direction!r}")

    sample = trade_direction(1.5)
    if sample != "buy_spread":
        errors.append("trade_direction(+1.5) should be buy_spread")
    if trade_direction(-2.0) != "sell_spread":
        errors.append("trade_direction(-2.0) should be sell_spread")
    if trade_direction(0.0) != "none":
        errors.append("trade_direction(0.0) should be none")

    return errors