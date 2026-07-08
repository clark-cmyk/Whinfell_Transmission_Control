"""BBDM v2 Chunk 14 — registry-locked SOFR/FF and 2s10s singles (v1.2 cockpit flow unchanged)."""

from __future__ import annotations

from typing import Any

from whinfell_pipeline.bbdm_registry import trade_for_series

SOFR_OIS_SPREAD_ID = "sofr_ois_spread"
USGG2Y10Y_ID = "usgg2y10y"
ADAPTER_VERSION = "2.0.0-chunk14"
MIN_POINTS = 5

RATES_SERIES_IDS: frozenset[str] = frozenset({SOFR_OIS_SPREAD_ID, USGG2Y10Y_ID})

RATES_TRADE_BY_SERIES: dict[str, str] = {
    SOFR_OIS_SPREAD_ID: "sofr_fed_funds",
    USGG2Y10Y_ID: "curve_2s10s",
}


def registry_trade(series_id: str):
    """Registry-driven trade definition for a rates single (Chunk 14)."""
    expected_trade_id = RATES_TRADE_BY_SERIES.get(series_id)
    if expected_trade_id is None:
        raise RuntimeError(f"unknown rates series_id {series_id!r}")
    trade = trade_for_series(series_id)
    if trade is None or trade.id != expected_trade_id:
        raise RuntimeError(f"registry missing {expected_trade_id} trade for {series_id!r}")
    return trade


def _cockpit_entry(bundle: dict, series_id: str) -> dict | None:
    """Delegate to v1.2 cockpit reconstruction (no logic change)."""
    from whinfell_pipeline.rv_history import _build_cockpit_series_entry

    return _build_cockpit_series_entry(bundle, series_id)


def build_rates_series(bundle: dict, series_id: str) -> dict[str, Any] | None:
    """Build registry-stamped rv_history entry from liquidity cockpit horizons."""
    if series_id not in RATES_SERIES_IDS:
        return None

    entry = _cockpit_entry(bundle, series_id)
    if not entry:
        return None

    points = entry.get("points") or []
    if len(points) < MIN_POINTS:
        return None

    trade = registry_trade(series_id)
    stamped = dict(entry)
    stamped.update(
        {
            "series_id": series_id,
            "bbdm_trade_id": trade.id,
            "adapter_version": ADAPTER_VERSION,
            "data_status": "live",
            "label": trade.label,
            "unit": trade.unit,
            "quartile_direction": trade.quartile_direction,
        }
    )
    return stamped


def build_sofr_ois_spread_series(bundle: dict) -> dict[str, Any] | None:
    """Registry-locked SOFR vs Fed Funds single."""
    return build_rates_series(bundle, SOFR_OIS_SPREAD_ID)


def build_usgg2y10y_series(bundle: dict) -> dict[str, Any] | None:
    """Registry-locked 2s10s curve single."""
    return build_rates_series(bundle, USGG2Y10Y_ID)


def liquidity_cockpit_has_rates(bundle: dict) -> bool:
    """True when both rates singles exist in liquidity rv_basis cockpit."""
    series = (
        bundle.get("node_cockpits", {})
        .get("liquidity", {})
        .get("rv_basis", {})
        .get("series", {})
    )
    return SOFR_OIS_SPREAD_ID in series and USGG2Y10Y_ID in series