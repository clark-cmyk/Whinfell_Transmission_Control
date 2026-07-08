"""BBDM v2 Chunk 10 — live eth_basis_spot_1m from Barchart futures-spreads exports."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from whinfell_pipeline.bbdm_registry import trade_for_series
from whinfell_pipeline.btc_basis_series import (
    _parse_obs_date,
    _safe_float,
    is_barchart_spreads_csv,
)

SERIES_ID = "eth_basis_spot_1m"
ADAPTER_VERSION = "2.0.0-chunk10"
MIN_LIVE_POINTS = 5

# Barchart ETH basis: front month (ETM*) vs spot/index equivalent (EAN*, AE leg).
_FRONT_LEG_RE = re.compile(r"^ET[MNUQZ]\d$", re.I)
_SPOT_LEG_RE = re.compile(r"^EA[NQUVZ]\d$", re.I)
_ONE_MONTH_LEG_RE = re.compile(r"^ET[NQU]\d$", re.I)

_FILENAME_PATTERNS = (
    "eth_basis_*.csv",
    "futures-spreads-etm*.csv",
    "futures-spreads-etn*.csv",
)


def registry_trade():
    """Registry-driven trade definition for eth_basis (Chunk 10)."""
    trade = trade_for_series(SERIES_ID)
    if trade is None or trade.id != "eth_basis":
        raise RuntimeError(f"registry missing eth_basis trade for {SERIES_ID!r}")
    return trade


def extract_spot_1m_row(rows: list[dict[str, str]]) -> dict[str, str] | None:
    """Pick ETM front vs EA spot-equivalent AE row (spot vs 1m basis)."""
    best: dict[str, str] | None = None
    for row in rows:
        leg1 = (row.get("Leg1") or "").strip().upper()
        leg2 = (row.get("Leg2") or "").strip().upper()
        typ = (row.get("Type") or "").strip().upper()
        if not leg1.startswith("ET"):
            continue
        if typ == "AE" and _FRONT_LEG_RE.match(leg1) and _SPOT_LEG_RE.match(leg2):
            return row
        if typ == "EQ" and _FRONT_LEG_RE.match(leg1) and _ONE_MONTH_LEG_RE.match(leg2):
            best = row
    return best


def spread_row_to_basis_pct(
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

    # Spec §4 spot vs 1m: express dislocation as pct of reference ETH price.
    return obs_date, round((spread / ref) * 100.0, 4)


def parse_barchart_spreads_csv(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        headers = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    row = extract_spot_1m_row(rows)
    if not row:
        return {
            "ok": False,
            "path": str(path),
            "reason": "no_spot_1m_row",
            "headers": headers,
        }

    return {
        "ok": True,
        "path": str(path),
        "headers": headers,
        "row": row,
        "leg1": row.get("Leg1"),
        "leg2": row.get("Leg2"),
        "spread_type": row.get("Type"),
        "spread_latest": _safe_float(row.get("Latest")),
        "obs_date": _parse_obs_date(row.get("Time") or row.get("Date") or ""),
    }


def _dig(data: dict, *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for key in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(key)
        if cur is None:
            return default
    return cur


def resolve_eth_reference_price(bundle: dict | None, root: Path, obs_date: str | None) -> float | None:
    if bundle:
        spot = _safe_float(_dig(bundle, "crypto_sleeve", "assets", "eth_spot_usd", "price"))
        if spot is None:
            spot = _safe_float(_dig(bundle, "crypto_sleeve", "assets", "eth_spot_usd", "last"))
        if spot is not None:
            return spot

    curve_paths = [
        root / "docs" / "data" / "barchart" / "v1" / "barchart_curve_history.json",
        root / "data" / "barchart" / "v1" / "barchart_curve_history.json",
    ]
    for curve_path in curve_paths:
        if not curve_path.is_file():
            continue
        try:
            payload = json.loads(curve_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for rec in payload.get("records") or []:
            sym = str(rec.get("raw_symbol") or "").upper()
            if not sym.startswith("ETM"):
                continue
            for pt in rec.get("points") or []:
                d = str(pt.get("date") or "")
                if obs_date and d != obs_date:
                    continue
                close = _safe_float(pt.get("close"))
                if close is not None:
                    return close
            latest = rec.get("latest") or {}
            close = _safe_float(latest.get("close"))
            if close is not None:
                return close
    return None


def discover_eth_basis_csv_paths(root: Path) -> list[Path]:
    search_dirs = [
        root / "tests" / "fixtures" / "eth_basis",
        root / "data" / "staged",
        root / "data" / "archive" / "drop",
        root / "data" / "barchart",
        Path.home() / "Downloads" / "whinfell_drop",
    ]
    found: dict[str, Path] = {}
    for base in search_dirs:
        if not base.is_dir():
            continue
        for pattern in _FILENAME_PATTERNS:
            for path in base.rglob(pattern):
                if not path.is_file() or not is_barchart_spreads_csv(path):
                    continue
                key = path.resolve().as_posix()
                prev = found.get(key)
                if prev is None or path.stat().st_mtime > prev.stat().st_mtime:
                    found[key] = path
    return sorted(found.values(), key=lambda p: p.stat().st_mtime)


def build_eth_basis_spot_1m_points(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> list[dict[str, float | str]]:
    paths = list(extra_paths or []) + discover_eth_basis_csv_paths(root)
    by_date: dict[str, tuple[float, float]] = {}

    for path in paths:
        parsed = parse_barchart_spreads_csv(path)
        if not parsed.get("ok"):
            continue
        row = parsed["row"]
        ref = resolve_eth_reference_price(bundle, root, parsed.get("obs_date"))
        obs_date, value = spread_row_to_basis_pct(row, reference_price=ref)
        if obs_date is None or value is None:
            continue
        mtime = path.stat().st_mtime
        prev = by_date.get(obs_date)
        if prev is None or mtime >= prev[1]:
            by_date[obs_date] = (value, mtime)

    return [{"date": d, "value": v} for d, (v, _) in sorted(by_date.items())]


def build_eth_basis_spot_1m_series(
    bundle: dict | None,
    root: Path,
    *,
    extra_paths: list[Path] | None = None,
) -> dict[str, Any] | None:
    trade = registry_trade()
    points = build_eth_basis_spot_1m_points(bundle, root, extra_paths=extra_paths)
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


def inject_eth_basis_spot_1m_cockpit(bundle: dict, series: dict[str, Any]) -> bool:
    """Write basis.rv_basis.series.eth_basis_spot_1m horizons from live points."""
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
        "label": series.get("label", "ETH basis (spot vs 1m)"),
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