"""BBDM v2 Chunk 19 — unified Z engine for all eight trades.

Resolution order (spec §4 / Chunk 19):
  1. rv_history daily points (mean/std Z) when observations meet min-obs policy
  2. Cockpit horizon percentile fallback (inverse normal CDF + quartile_direction)
  3. missing — z_score None, data_status missing
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from whinfell_pipeline.bbdm_registry import BBDM_TRADES, BbdmTrade, trade_by_id
from whinfell_pipeline.rv_history import RvHistoryStore, percentile_to_z, resolve_cockpit_meta

Z_ENGINE_VERSION = "2.0.0-chunk19"

HORIZON_WINDOWS: tuple[int, ...] = (30, 60, 90)
WINDOW_TO_HORIZON_KEY: dict[int, str] = {30: "1m", 60: "3m", 90: "3m"}

MIN_RV_HISTORY_OBS_DEFAULT = 5
MIN_RV_HISTORY_OBS_MIDWEST_CALENDAR_LIVE = 20
MIN_PERCENTILE_OBS = 2

ZMethod = Literal["rv_history", "percentile_fallback", "missing"]


@dataclass(frozen=True)
class TradeZResult:
    trade_id: str
    series_id: str
    window_days: int
    horizon_key: str
    z_score: float | None
    percentile: float | None
    current_value: float | None
    unit: str
    n_observations: int | None
    richness: str
    data_status: str
    source: str
    method: ZMethod
    min_obs_required: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "trade_id": self.trade_id,
            "series_id": self.series_id,
            "window_days": self.window_days,
            "horizon_key": self.horizon_key,
            "z_score": self.z_score,
            "percentile": self.percentile,
            "current_value": self.current_value,
            "unit": self.unit,
            "n_observations": self.n_observations,
            "richness": self.richness,
            "data_status": self.data_status,
            "source": self.source,
            "method": self.method,
            "min_obs_required": self.min_obs_required,
        }


def _dig(data: dict, *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur


def _safe_float(val: Any) -> float | None:
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


def dislocation_label(z: float | None) -> str:
    if z is None:
        return "unavailable"
    az = abs(z)
    if az >= 2.5:
        return "extreme"
    if z >= 1.5:
        return "rich"
    if z <= -1.5:
        return "cheap"
    return "fair"


def horizon_key_for_window(window_days: int) -> str:
    return WINDOW_TO_HORIZON_KEY.get(window_days, "3m")


def min_obs_for_rv_history(trade_id: str, *, rv_source: str = "") -> int:
    """Min daily observations before rv_history Z is authoritative."""
    if trade_id == "midwest_calendar" and "spot_index" in rv_source:
        return MIN_RV_HISTORY_OBS_MIDWEST_CALENDAR_LIVE
    return MIN_RV_HISTORY_OBS_DEFAULT


def cockpit_series_for_trade(bundle: dict, trade: BbdmTrade) -> dict | None:
    """Load cockpit rv_basis series meta for a registry trade."""
    if trade.node_id == "aicompute":
        return _dig(bundle, "ai_compute", "rv_basis", "series", trade.series_id)

    meta = _dig(
        bundle,
        "node_cockpits",
        trade.node_id,
        "rv_basis",
        "series",
        trade.series_id,
    )
    if meta:
        return meta

    resolved, _ = resolve_cockpit_meta(bundle, trade.series_id)
    return resolved


def _resolve_rv_series_id(trade: BbdmTrade, rv: RvHistoryStore) -> str:
    for sid in (trade.series_id, *trade.series_fallback_ids):
        if rv.points(sid):
            return sid
    return trade.series_id


def _rv_data_status(source: str) -> str:
    if "reconstructed" in source:
        return "rv_history"
    if source in ("unknown", "", "missing"):
        return "missing"
    return "live"


def _percentile_fallback(
    *,
    trade_id: str,
    series_id: str,
    window_days: int,
    direction: str,
    cockpit: dict | None,
    unit_default: str,
) -> TradeZResult | None:
    if not cockpit:
        return None

    hk = horizon_key_for_window(window_days)
    hz = _dig(cockpit, "horizons", hk, default={}) or {}
    pct = _safe_float(hz.get("percentile"))
    cur = _safe_float(hz.get("current_value"))
    n_obs = hz.get("n_observations")
    n_obs_int = int(n_obs) if isinstance(n_obs, (int, float)) else None

    if pct is None or cur is None:
        return None
    if n_obs_int is not None and n_obs_int < MIN_PERCENTILE_OBS:
        return None

    z = round(percentile_to_z(pct, direction), 2)
    richness = hz.get("richness_label") or dislocation_label(z)
    unit = hz.get("unit", "") or cockpit.get("unit", "") or unit_default

    return TradeZResult(
        trade_id=trade_id,
        series_id=series_id,
        window_days=window_days,
        horizon_key=hk,
        z_score=z,
        percentile=pct,
        current_value=cur,
        unit=unit,
        n_observations=n_obs_int,
        richness=str(richness),
        data_status="live",
        source="cockpit_percentile",
        method="percentile_fallback",
        min_obs_required=MIN_PERCENTILE_OBS,
    )


def compute_series_z(
    series_id: str,
    window_days: int,
    rv: RvHistoryStore,
    bundle: dict,
    *,
    direction: str = "higher_is_richer",
    trade_id: str = "",
    unit: str = "",
    cockpit: dict | None = None,
    fallback_ids: tuple[str, ...] = (),
    min_obs_override: int | None = None,
) -> TradeZResult:
    """Compute Z for a series_id with rv_history-first policy."""
    hk = horizon_key_for_window(window_days)
    resolved_id = series_id
    pts = rv.points(series_id)
    if not pts:
        for fb in fallback_ids:
            fb_pts = rv.points(fb)
            if fb_pts:
                resolved_id = fb
                pts = fb_pts
                break

    src = rv.source(resolved_id)
    min_obs = min_obs_override if min_obs_override is not None else min_obs_for_rv_history(trade_id, rv_source=src)
    meta = rv.meta(resolved_id)
    direction = direction or meta.get("quartile_direction", "higher_is_richer")
    unit_default = unit or meta.get("unit", "")

    window_pts = rv.slice_window(resolved_id, window_days)
    n_window = len(window_pts)

    if n_window >= min_obs:
        z, pct_proxy, z_src = rv.z_score(resolved_id, window_days, direction)
        if z is not None:
            cur = _safe_float(window_pts[-1].get("value")) if window_pts else None
            return TradeZResult(
                trade_id=trade_id or series_id,
                series_id=resolved_id,
                window_days=window_days,
                horizon_key=hk,
                z_score=z,
                percentile=pct_proxy,
                current_value=cur,
                unit=unit_default,
                n_observations=n_window,
                richness=dislocation_label(z),
                data_status=_rv_data_status(z_src),
                source=z_src,
                method="rv_history",
                min_obs_required=min_obs,
            )

    cockpit_meta = cockpit
    if cockpit_meta is None and trade_id:
        trade = trade_by_id(trade_id)
        if trade:
            cockpit_meta = cockpit_series_for_trade(bundle, trade)
    if cockpit_meta is None:
        cockpit_meta, _ = resolve_cockpit_meta(bundle, resolved_id)

    fb = _percentile_fallback(
        trade_id=trade_id or series_id,
        series_id=resolved_id,
        window_days=window_days,
        direction=direction,
        cockpit=cockpit_meta,
        unit_default=unit_default,
    )
    if fb:
        return fb

    cur = _safe_float(window_pts[-1].get("value")) if window_pts else None
    return TradeZResult(
        trade_id=trade_id or series_id,
        series_id=resolved_id,
        window_days=window_days,
        horizon_key=hk,
        z_score=None,
        percentile=None,
        current_value=cur,
        unit=unit_default,
        n_observations=n_window or None,
        richness="unavailable",
        data_status="missing",
        source=src,
        method="missing",
        min_obs_required=min_obs,
    )


def compute_trade_z(
    trade: BbdmTrade | str,
    window_days: int,
    rv: RvHistoryStore,
    bundle: dict,
) -> TradeZResult:
    """Unified Z computation for any BBDM v2 registry trade."""
    if isinstance(trade, str):
        resolved = trade_by_id(trade)
        if resolved is None:
            raise KeyError(f"unknown trade_id: {trade!r}")
        trade = resolved

    series_id = _resolve_rv_series_id(trade, rv)
    cockpit = cockpit_series_for_trade(bundle, trade)

    return compute_series_z(
        series_id,
        window_days,
        rv,
        bundle,
        direction=trade.quartile_direction,
        trade_id=trade.id,
        unit=trade.unit,
        cockpit=cockpit,
        fallback_ids=trade.series_fallback_ids,
    )


def compute_trade_horizons(
    trade: BbdmTrade | str,
    rv: RvHistoryStore,
    bundle: dict,
    windows: tuple[int, ...] = HORIZON_WINDOWS,
) -> list[TradeZResult]:
    """Compute 30/60/90d Z horizons for a registry trade."""
    return [compute_trade_z(trade, wd, rv, bundle) for wd in windows]


def validate_z_engine() -> list[str]:
    """Return z-engine consistency violations (empty list means valid)."""
    errors: list[str] = []

    if len(BBDM_TRADES) != 8:
        errors.append(f"expected 8 registry trades, got {len(BBDM_TRADES)}")

    for trade in BBDM_TRADES:
        if trade.id == "sofr_fed_funds" and trade.quartile_direction != "higher_is_cheaper":
            errors.append("sofr_fed_funds must use higher_is_cheaper")
        for wd in HORIZON_WINDOWS:
            if horizon_key_for_window(wd) not in ("1m", "3m"):
                errors.append(f"invalid horizon key for window {wd}")

    if horizon_key_for_window(30) != "1m":
        errors.append("30d window must map to 1m horizon key")
    if horizon_key_for_window(60) != "3m" or horizon_key_for_window(90) != "3m":
        errors.append("60/90d windows must map to 3m horizon key")

    if min_obs_for_rv_history("btc_basis") != MIN_RV_HISTORY_OBS_DEFAULT:
        errors.append("default min obs should be 5")
    if min_obs_for_rv_history("midwest_calendar", rv_source="ai_compute_spot_index") != 20:
        errors.append("midwest_calendar live min obs should be 20")

    z = round(percentile_to_z(84.0, "higher_is_richer"), 2)
    if z <= 0:
        errors.append("84th percentile richer series should yield positive Z")

    cheap = round(percentile_to_z(84.0, "higher_is_cheaper"), 2)
    if cheap >= 0:
        errors.append("higher_is_cheaper should invert Z sign")

    return errors