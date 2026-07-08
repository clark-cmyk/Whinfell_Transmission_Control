"""BBDM v2 Chunk 11 — live eth_calendar_et_near_deferred from Barchart futures-spreads."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from whinfell_pipeline.bbdm_registry import trade_for_series
from whinfell_pipeline.btc_basis_series import _parse_obs_date, _safe_float, is_barchart_spreads_csv
from whinfell_pipeline.eth_basis_series import (
    discover_eth_basis_csv_paths,
    parse_barchart_spreads_csv,
    resolve_eth_reference_price,
)

SERIES_ID = "eth_calendar_et_near_deferred"
ADAPTER_VERSION = "2.0.0-chunk11"
MIN_LIVE_POINTS = 5

# Barchart ETH calendar: front month (ETM*) vs deferred ET (ETQ/ETN — 1m vs 3m).
_NEAR_LEG_RE = re.compile(r"^ET[MNUQZ]\d$", re.I)
_DEFERRED_LEG_RE = re.compile(r"^ET[NQUVZ]\d$", re.I)
_SPOT_LEG_RE = re.compile(r"^EA[NQUVZ]\d$", re.I)


def registry_trade():
    """Registry-driven trade definition for eth_calendar (Chunk 11)."""
    trade = trade_for_series(SERIES_ID)
    if trade is None or trade.id != "eth_calendar":
        raise RuntimeError(f"registry missing eth_calendar trade for {SERIES_ID!r}")
    return trade


def extract_near_deferred_row(rows: list[dict[str, str]]) -> dict[str, str] | None:
    """Pick ETM near vs ET deferred AE row (1m vs 3m calendar — not spot basis)."""
    best: dict[str, str] | None = None
    for row in rows:
        leg1 = (row.get("Leg1") or "").strip().upper()
        leg2 = (row.get("Leg2") or "").strip().upper()
        typ = (row.get("Type") or "").strip().upper()
        if not _NEAR_LEG_RE.match(leg1):
            continue
        if _SPOT_LEG_RE.match(leg2) or not leg2.startswith("ET"):
            continue
        if leg1 == leg2:
            continue
        if typ == "AE" and _DEFERRED_LEG_RE.match(leg2):
            return row
        if typ == "EQ" and _DEFERRED_LEG_RE.match(leg2):
            best = row
    return best


def parse_barchart_calendar_csv(path: Path) -> dict[str, Any]:
    """Parse spreads CSV and return the near-deferred ETH calendar row if present."""
    base = parse_barchart_spreads_csv(path)
    if not base.get("ok"):
        return {
            "ok": False,
            "path": str(path),
            "reason": base.get("reason", "parse_failed"),
            "headers": base.get("headers"),
        }

    with path.open(encoding="utf-8", errors="replace", newline="") as fh:
        import csv

        reader = csv.DictReader(fh)
        rows = [dict(r) for r in reader]

    row = extract_near_deferred_row(rows)
    if not row:
        return {
            "ok": False,
            "path": str(path),
            "reason": "no_near_deferred_row",
            "headers": base.get("headers"),
        }

    return {
        "ok": True,
        "path": str(path),
        "headers": base.get("headers"),
        "row": row,
        "leg1": row.get("Leg1"),
        "leg2": row.get("Leg2"),
        "spread_type": row.get("Type"),
        "spread_latest": _safe_float(row.get("Latest")),
        "obs_date": _parse_obs_date(row.get("Time") or row.get("Date") or ""),
    }


def spread_row_to_calendar_pct(
    row: dict[str, str],
    *,
    reference_price: float | None,
) -> tuple[str | None, float | None]:
    obs_date = _parse_obs_date(row.get("Time") or row.get("Date") or "")
    spread = _safe_float(row.get("Latest"))
    if spread is None:
        return obs_date, None

    ref = reference_price if reference_price and reference_price > 0 else None
    if ref is None:
        return obs_date, round(spread, 4)

    # Spec §4 calendar: express spread dislocation as pct of reference ETH price.
    return obs_date, round((spread / ref) * 100.0, 4)


def discover_eth_calendar_csv_paths(root: Path) -> list[Path]:
    """Reuse Barchart ETH spread discovery; calendar rows live in the same exports."""
    return [p for p in discover_eth_basis_csv_paths(root) if is_barchart_spreads_csv(p)]


def build_eth_calendar_points(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> list[dict[str, float | str]]:
    paths = list(extra_paths or []) + discover_eth_calendar_csv_paths(root)
    by_date: dict[str, tuple[float, float]] = {}

    for path in paths:
        parsed = parse_barchart_calendar_csv(path)
        if not parsed.get("ok"):
            continue
        row = parsed["row"]
        ref = resolve_eth_reference_price(bundle, root, parsed.get("obs_date"))
        obs_date, value = spread_row_to_calendar_pct(row, reference_price=ref)
        if obs_date is None or value is None:
            continue
        mtime = path.stat().st_mtime
        prev = by_date.get(obs_date)
        if prev is None or mtime >= prev[1]:
            by_date[obs_date] = (value, mtime)

    return [{"date": d, "value": v} for d, (v, _) in sorted(by_date.items())]


def build_eth_calendar_series(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> dict[str, Any] | None:
    trade = registry_trade()
    points = build_eth_calendar_points(bundle, root, extra_paths=extra_paths)
    if len(points) < MIN_LIVE_POINTS:
        return None

    return {
        "label": trade.label,
        "unit": trade.unit,
        "quartile_direction": trade.quartile_direction,
        "source": "barchart_spread_history",
        "data_status": "live",
        "adapter_version": ADAPTER_VERSION,
        "series_id": SERIES_ID,
        "bbdm_trade_id": trade.id,
        "points": points,
    }


def inject_eth_calendar_cockpit(bundle: dict, series: dict[str, Any]) -> bool:
    """Write basis.rv_basis.series.eth_calendar_et_near_deferred horizons from live points."""
    points = series.get("points") or []
    if len(points) < MIN_LIVE_POINTS:
        return False

    vals = [_safe_float(p.get("value")) for p in points]
    vals = [v for v in vals if v is not None]
    if len(vals) < MIN_LIVE_POINTS:
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
            "unit": "pct",
            "percentile": pct,
            "quartile": quartile,
            "richness_label": richness,
            "lookback_start": lookback_start,
            "lookback_end": as_of,
            "n_observations": len(window_vals),
        }

    meta = {
        "quartile_direction": series.get("quartile_direction", "higher_is_richer"),
        "label": series.get("label", "ET near-deferred calendar"),
        "horizons": {
            "1m": horizon(22),
            "3m": horizon(63),
            "6m": horizon(126),
            "12m": horizon(252),
            "3y": horizon(min(756, len(vals))),
        },
        "data_status": "live",
        "history_source": "barchart_spread_history",
    }
    nc = bundle.setdefault("node_cockpits", {})
    basis = nc.setdefault("basis", {})
    rv = basis.setdefault("rv_basis", {})
    series_map = rv.setdefault("series", {})
    series_map[SERIES_ID] = meta
    return True