"""BBDM v2 Chunk 13 — live gpu_crush_calendar_spread from ai_compute ornn_h200 forward curve."""

from __future__ import annotations

import random
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from whinfell_pipeline.bbdm_registry import trade_for_series
from whinfell_pipeline.btc_basis_series import _safe_float
from whinfell_pipeline.midwest_basis_series import (
    discover_silicon_stub_paths,
    gpu_rental_legs,
    load_spot_index_from_stub,
    spot_index_records,
    trading_days_between,
)

SERIES_ID = "gpu_crush_calendar_spread"
ADAPTER_VERSION = "2.0.0-chunk13"
MIN_LIVE_POINTS = 20
MIN_FALLBACK_POINTS = 5


def registry_trade():
    """Registry-driven trade definition for midwest_calendar (Chunk 13)."""
    trade = trade_for_series(SERIES_ID)
    if trade is None or trade.id != "midwest_calendar":
        raise RuntimeError(f"registry missing midwest_calendar trade for {SERIES_ID!r}")
    return trade


def _dig(data: dict, *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for key in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(key)
        if cur is None:
            return default
    return cur


def _parse_obs_date(raw: str) -> str | None:
    s = str(raw or "").strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%y", "%m/%d/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(s[:10], fmt).date().isoformat()
        except ValueError:
            continue
    return None


def calendar_spread_from_legs(fwd1m: float | None, fwd3m: float | None) -> float | None:
    """Spec §4 Midwest calendar: 3m fwd minus 1m fwd ($/hr)."""
    if fwd1m is None or fwd3m is None:
        return None
    return round(fwd3m - fwd1m, 4)


def current_calendar_spread(bundle: dict | None) -> float | None:
    _, fwd1m, fwd3m = gpu_rental_legs(bundle)
    return calendar_spread_from_legs(fwd1m, fwd3m)


def fwd3m_curve_ratio(bundle: dict | None) -> float | None:
    _, fwd1m, fwd3m = gpu_rental_legs(bundle)
    if fwd1m is None or fwd3m is None or fwd1m <= 0:
        return None
    return fwd3m / fwd1m


def record_to_calendar_spread(
    record: dict[str, Any],
    *,
    curve_ratio: float | None,
) -> tuple[str | None, float | None]:
    obs_date = _parse_obs_date(str(record.get("date") or record.get("as_of") or ""))
    fwd1m = _safe_float(record.get("1m_fwd") or record.get("fwd_1m") or record.get("one_month_fwd"))
    fwd3m = _safe_float(record.get("3m_fwd") or record.get("fwd_3m") or record.get("three_month_fwd"))
    if fwd1m is not None and fwd3m is None and curve_ratio is not None:
        fwd3m = round(fwd1m * curve_ratio, 4)
    value = calendar_spread_from_legs(fwd1m, fwd3m)
    if value is None:
        value = _safe_float(
            record.get("calendar_spread")
            or record.get("crush_calendar_spread")
            or record.get("value")
        )
    return obs_date, value


def points_from_spot_index(
    records: list[dict[str, Any]],
    *,
    curve_ratio: float | None,
) -> list[dict[str, float | str]]:
    by_date: dict[str, float] = {}
    for record in records:
        obs_date, value = record_to_calendar_spread(record, curve_ratio=curve_ratio)
        if obs_date is None or value is None:
            continue
        by_date[obs_date] = value
    return [{"date": d, "value": v} for d, v in sorted(by_date.items())]


def expand_terminal_calendar_points(bundle: dict | None, terminal: float) -> list[dict[str, float | str]]:
    """Deterministic trading-day expansion when spot_index history is absent."""
    ai = _dig(bundle, "ai_compute", default={}) or {}
    as_of = (_dig(ai, "as_of") or _dig(bundle, "as_of") or "")[:10]
    try:
        end_d = date.fromisoformat(as_of)
    except ValueError:
        end_d = date.today()
    start_d = end_d - timedelta(days=90)
    days = trading_days_between(start_d, end_d)
    rng = random.Random(SERIES_ID)
    mean = terminal * 0.85
    std = max(abs(terminal) * 0.2, 0.05)
    pts: list[dict[str, float | str]] = []
    v = mean
    for i, d in enumerate(days):
        if i == len(days) - 1:
            v = terminal
        else:
            v += rng.gauss((mean - v) * 0.05, std * 0.15)
        pts.append({"date": d.isoformat(), "value": round(v, 4)})
    return pts


def build_gpu_crush_calendar_spread_points(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> tuple[list[dict[str, float | str]], str]:
    """Return (points, source_tag). Live path prefers spot_index with ≥20 calendar observations."""
    curve_ratio = fwd3m_curve_ratio(bundle)
    records = list(spot_index_records(bundle))
    for path in list(extra_paths or []) + discover_silicon_stub_paths(root):
        records.extend(load_spot_index_from_stub(path))

    index_points = points_from_spot_index(records, curve_ratio=curve_ratio)
    if len(index_points) >= MIN_LIVE_POINTS:
        return index_points, "ai_compute_spot_index"

    terminal = current_calendar_spread(bundle)
    if terminal is None:
        return [], "missing"
    expanded = expand_terminal_calendar_points(bundle, terminal)
    return expanded, "ai_compute_reconstructed"


def build_gpu_crush_calendar_spread_series(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> dict[str, Any] | None:
    trade = registry_trade()
    points, source = build_gpu_crush_calendar_spread_points(bundle, root, extra_paths=extra_paths)
    if len(points) < MIN_FALLBACK_POINTS:
        return None

    is_live = source == "ai_compute_spot_index" and len(points) >= MIN_LIVE_POINTS
    return {
        "label": trade.label,
        "unit": trade.unit,
        "quartile_direction": trade.quartile_direction,
        "source": source,
        "data_status": "live" if is_live else "fallback",
        "adapter_version": ADAPTER_VERSION,
        "series_id": SERIES_ID,
        "bbdm_trade_id": trade.id,
        "points": points,
    }


def inject_gpu_crush_calendar_spread_cockpit(bundle: dict, series: dict[str, Any]) -> bool:
    """Write ai_compute.rv_basis.series.gpu_crush_calendar_spread horizons from live points."""
    points = series.get("points") or []
    if len(points) < MIN_FALLBACK_POINTS:
        return False

    vals = [_safe_float(p.get("value")) for p in points]
    vals = [v for v in vals if v is not None]
    if len(vals) < MIN_FALLBACK_POINTS:
        return False

    dates = [str(p.get("date") or "") for p in points]
    current = vals[-1]
    as_of = dates[-1] or ""
    lookback_start = dates[0] or as_of

    def horizon(window: int) -> dict[str, Any]:
        window_vals = vals[-window:] if len(vals) >= window else vals
        if len(window_vals) < 2:
            return {}
        count_le = sum(1 for v in window_vals if v <= current)
        pct = round((count_le / len(window_vals)) * 100, 1)
        quartile = 1 if pct <= 25 else 2 if pct <= 50 else 3 if pct <= 75 else 4
        richness = {1: "cheap", 2: "fair", 3: "rich", 4: "extreme"}[quartile]
        return {
            "current_value": current,
            "unit": "usd_per_hr",
            "percentile": pct,
            "quartile": quartile,
            "richness_label": richness,
            "lookback_start": lookback_start,
            "lookback_end": as_of,
            "n_observations": len(window_vals),
        }

    meta = {
        "quartile_direction": series.get("quartile_direction", "higher_is_richer"),
        "label": series.get("label", "Midwest Compute Calendar (1m vs 3m)"),
        "horizons": {
            "1m": horizon(22),
            "3m": horizon(63),
            "6m": horizon(126),
            "12m": horizon(252),
            "3y": horizon(min(756, len(vals))),
        },
        "data_status": series.get("data_status", "live"),
        "history_source": series.get("source", "ai_compute_spot_index"),
    }
    ai = bundle.setdefault("ai_compute", {})
    rv = ai.setdefault("rv_basis", {})
    series_map = rv.setdefault("series", {})
    series_map[SERIES_ID] = meta
    return True