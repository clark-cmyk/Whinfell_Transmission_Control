"""RV history loader — live daily points for Bang Bang Da and desk charts.

Resolution order:
  1. bundle["rv_history"]["series"][series_id]["points"]
  2. sidecar docs/data/hydration/rv_history.json
  3. Reconstruct from node_cockpits rv_basis horizon metadata (deterministic)
"""

from __future__ import annotations

import json
import math
import random
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from whinfell_pipeline.bbdm_registry import BBDM_TRADES, registry_series_node_map, trade_for_series
from whinfell_pipeline.btc_basis_series import (
    SERIES_ID as BTC_BASIS_SPOT_1M_ID,
    build_btc_basis_spot_1m_series,
    inject_btc_basis_spot_1m_cockpit,
)
from whinfell_pipeline.btc_calendar_series import (
    SERIES_ID as BTC_CALENDAR_SERIES_ID,
    build_btc_calendar_series,
    inject_btc_calendar_cockpit,
)
from whinfell_pipeline.eth_basis_series import (
    SERIES_ID as ETH_BASIS_SPOT_1M_ID,
    build_eth_basis_spot_1m_series,
    inject_eth_basis_spot_1m_cockpit,
)
from whinfell_pipeline.eth_calendar_series import (
    SERIES_ID as ETH_CALENDAR_SERIES_ID,
    build_eth_calendar_series as build_live_eth_calendar_series,
    inject_eth_calendar_cockpit as inject_live_eth_calendar_cockpit,
)
from whinfell_pipeline.midwest_basis_series import (
    SERIES_ID as GPU_BASIS_SPREAD_ID,
    build_gpu_basis_spread_series,
    inject_gpu_basis_spread_cockpit,
)
from whinfell_pipeline.midwest_calendar_series import (
    SERIES_ID as GPU_CRUSH_CALENDAR_SPREAD_ID,
    build_gpu_crush_calendar_spread_series,
    inject_gpu_crush_calendar_spread_cockpit,
)
from whinfell_pipeline.rates_series import (
    SOFR_OIS_SPREAD_ID,
    USGG2Y10Y_ID,
    build_sofr_ois_spread_series,
    build_usgg2y10y_series,
)

ROOT = Path(__file__).resolve().parents[1]

RV_HISTORY_VERSION = "2.0.0-chunk15"

SERIES_NODE_MAP: dict[str, tuple[str, str]] = registry_series_node_map()

BBDM_V2_PRIMARY_SERIES: tuple[str, ...] = tuple(trade.series_id for trade in BBDM_TRADES)

AI_COMPUTE_SERIES: frozenset[str] = frozenset(
    {
        "gpu_basis_spread",
        "gpu_crush_calendar_spread",
        "gpu_crush_spread",
    }
)


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
        if not s or s.lower() in ("unavailable", "—", "-", "n/a"):
            return None
        try:
            return float(s.replace(",", ""))
        except ValueError:
            return None
    return None


def _erfinv(x: float) -> float:
    x = max(-1.0, min(1.0, x))
    if abs(x) < 1e-8:
        return 0.0
    sign = 1.0 if x >= 0 else -1.0
    ln = math.log(1 - x * x)
    a = 0.147
    inner = 2 / (math.pi * a) + ln / 2
    return sign * math.sqrt(math.sqrt(inner * inner - ln / a) - inner)


def _norm_ppf(p: float) -> float:
    p = max(1e-6, min(1 - 1e-6, p))
    erfinv = getattr(math, "erfinv", None)
    if erfinv:
        return math.sqrt(2) * erfinv(2 * p - 1)
    return math.sqrt(2) * _erfinv(2 * p - 1)


def percentile_to_z(percentile: float, direction: str) -> float:
    z = _norm_ppf(percentile / 100.0)
    return -z if direction == "higher_is_cheaper" else z


def trading_days_between(start: date, end: date) -> list[date]:
    out: list[date] = []
    d = start
    while d <= end:
        if d.weekday() < 5:
            out.append(d)
        d += timedelta(days=1)
    return out


def reconstruct_series(
    series_id: str,
    current_value: float,
    lookback_start: str,
    lookback_end: str,
    n_observations: int,
    percentile: float | None,
    direction: str,
    unit: str = "",
) -> list[dict]:
    """Deterministic daily path ending at current_value (desk reconstruction)."""
    try:
        start_d = date.fromisoformat(lookback_start[:10])
        end_d = date.fromisoformat(lookback_end[:10])
    except ValueError:
        end_d = date.today()
        start_d = end_d - timedelta(days=max(n_observations, 63))

    days = trading_days_between(start_d, end_d)
    if n_observations and len(days) > n_observations:
        days = days[-n_observations:]
    if len(days) < 3:
        days = trading_days_between(end_d - timedelta(days=90), end_d)[-max(n_observations, 22) :]

    rng = random.Random(f"{series_id}:{lookback_end}")
    vol = max(abs(current_value) * 0.04, 0.005)
    pct = percentile if percentile is not None else 50.0
    z_terminal = percentile_to_z(pct, direction)
    start_val = current_value - z_terminal * vol * math.sqrt(len(days))

    pts: list[dict] = []
    v = start_val
    n = len(days)
    for i, d in enumerate(days):
        if i == n - 1:
            v = current_value
        else:
            drift = (current_value - v) / max(n - i, 1)
            v += drift * 0.35 + rng.gauss(0, vol * 0.25)
        pts.append({"date": d.isoformat(), "value": round(v, 4)})
    return pts


def _gpu_rental_legs(bundle: dict) -> tuple[float | None, float | None, float | None]:
    rental = _dig(bundle, "ai_compute", "ornn_h200", "rental_usd_per_hr", default={}) or {}
    return (
        _safe_float(rental.get("spot")),
        _safe_float(rental.get("1m_fwd")),
        _safe_float(rental.get("3m_fwd")),
    )


def _gpu_spread_value(bundle: dict, series_id: str) -> float | None:
    spot, fwd1m, fwd3m = _gpu_rental_legs(bundle)
    if series_id == "gpu_basis_spread":
        if spot is None or fwd1m is None:
            return None
        return fwd1m - spot
    if series_id == "gpu_crush_calendar_spread":
        if fwd1m is None or fwd3m is None:
            return None
        return fwd3m - fwd1m
    if series_id == "gpu_crush_spread":
        if spot is None or fwd3m is None:
            return None
        return fwd3m - spot
    return None


def gpu_compute_points(bundle: dict, series_id: str) -> list[dict]:
    """Deterministic ai_compute spread paths for Midwest GPU series."""
    terminal = _gpu_spread_value(bundle, series_id)
    if terminal is None:
        return []

    ai = _dig(bundle, "ai_compute", default={}) or {}
    as_of = (_dig(ai, "as_of") or _dig(bundle, "as_of") or "")[:10]
    try:
        end_d = date.fromisoformat(as_of)
    except ValueError:
        end_d = date.today()
    start_d = end_d - timedelta(days=90)
    days = trading_days_between(start_d, end_d)
    rng = random.Random(series_id)
    mean = terminal * 0.85
    std = max(abs(terminal) * 0.2, 0.05)
    pts: list[dict] = []
    v = mean
    for i, d in enumerate(days):
        if i == len(days) - 1:
            v = terminal
        else:
            v += rng.gauss((mean - v) * 0.05, std * 0.15)
        pts.append({"date": d.isoformat(), "value": round(v, 4)})
    return pts


def gpu_crush_points(bundle: dict) -> list[dict]:
    """Backward-compatible alias for v1.2 gpu_crush_spread."""
    return gpu_compute_points(bundle, "gpu_crush_spread")


def series_meta_from_cockpit(bundle: dict, node: str, series_id: str) -> dict | None:
    return _dig(bundle, "node_cockpits", node, "rv_basis", "series", series_id, default=None)


def resolve_cockpit_meta(bundle: dict, series_id: str) -> tuple[dict | None, str]:
    """Return cockpit meta and the series_id that supplied it (primary or fallback)."""
    node, sid = SERIES_NODE_MAP.get(series_id, ("", series_id))
    if not node:
        return None, series_id

    meta = series_meta_from_cockpit(bundle, node, sid)
    if meta:
        return meta, sid

    trade = trade_for_series(series_id)
    if not trade:
        return None, series_id

    for fallback_id in trade.series_fallback_ids:
        if fallback_id == series_id:
            continue
        fb_node, fb_sid = SERIES_NODE_MAP.get(fallback_id, (node, fallback_id))
        if not fb_node:
            continue
        meta = series_meta_from_cockpit(bundle, fb_node, fb_sid)
        if meta:
            return meta, fallback_id
    return None, series_id


def _series_labels() -> dict[str, tuple[str, str, str]]:
    """series_id → (label, unit, quartile_direction) from BBDM registry."""
    out: dict[str, tuple[str, str, str]] = {}
    for trade in BBDM_TRADES:
        out[trade.series_id] = (trade.label, trade.unit, trade.quartile_direction)
    out["gpu_crush_spread"] = ("GPU crush spread (3M−Spot)", "usd_per_hr", "higher_is_richer")
    out["btc_basis_vs_refs"] = ("Basis vs ref band", "pct", "higher_is_richer")
    return out


def _build_cockpit_series_entry(bundle: dict, series_id: str) -> dict | None:
    meta, resolved_id = resolve_cockpit_meta(bundle, series_id)
    if not meta:
        return None

    hz = _dig(meta, "horizons", "3m", default={}) or _dig(meta, "horizons", "1m", default={}) or {}
    cur = _safe_float(hz.get("current_value"))
    if cur is None:
        return None

    labels = _series_labels()
    label, unit, direction = labels.get(series_id, (
        meta.get("label", series_id),
        hz.get("unit", ""),
        meta.get("quartile_direction", "higher_is_richer"),
    ))

    pts = reconstruct_series(
        series_id,
        cur,
        hz.get("lookback_start", ""),
        hz.get("lookback_end", ""),
        int(hz.get("n_observations") or 63),
        _safe_float(hz.get("percentile")),
        direction,
        hz.get("unit", ""),
    )
    source = "rv_basis_reconstructed"
    if resolved_id != series_id:
        source = f"rv_basis_reconstructed:{resolved_id}"

    return {
        "label": label,
        "unit": unit,
        "quartile_direction": direction,
        "source": source,
        "resolved_series_id": resolved_id,
        "points": pts,
    }


def _build_ai_compute_series_entry(bundle: dict, series_id: str) -> dict | None:
    pts = gpu_compute_points(bundle, series_id)
    if not pts:
        return None
    label, unit, direction = _series_labels().get(
        series_id,
        (series_id, "usd_per_hr", "higher_is_richer"),
    )
    return {
        "label": label,
        "unit": unit,
        "quartile_direction": direction,
        "source": "ai_compute_reconstructed",
        "points": pts,
    }


def build_eth_calendar_synthetic_series(bundle: dict) -> dict | None:
    """Fallback: synthesize eth_calendar_et_near_deferred from BTC calendar + ETH vol overlay."""
    btc = series_meta_from_cockpit(bundle, "basis", "btc_calendar_bt_near_deferred")
    if not btc:
        return None
    eth_vol = _safe_float(_dig(bundle, "crypto_sleeve", "assets", "eth_spot_usd", "vol_1m")) or 46.0
    btc_vol = _safe_float(_dig(bundle, "crypto_sleeve", "assets", "btc_spot_usd", "vol_1m")) or 30.0
    vol_ratio = eth_vol / max(btc_vol, 1.0)

    import copy

    eth = copy.deepcopy(btc)
    eth["label"] = "ET near-deferred calendar"
    eth["quartile_direction"] = "higher_is_richer"
    for hk, hz in (eth.get("horizons") or {}).items():
        cv = _safe_float(hz.get("current_value"))
        if cv is not None:
            adj = 1.0 + (vol_ratio - 1.0) * 0.35
            hz["current_value"] = round(cv * adj, 4)
            p = _safe_float(hz.get("percentile"))
            if p is not None:
                hz["percentile"] = round(max(5.0, min(95.0, p + (vol_ratio - 1.0) * 12)), 1)
    return eth


def inject_eth_calendar(bundle: dict) -> bool:
    """Ensure basis.rv_basis.series.eth_calendar_et_near_deferred exists (live first, synthetic fallback)."""
    live = build_live_eth_calendar_series(bundle, ROOT)
    if live and inject_live_eth_calendar_cockpit(bundle, live):
        return True
    eth = build_eth_calendar_synthetic_series(bundle)
    if not eth:
        return False
    nc = bundle.setdefault("node_cockpits", {})
    basis = nc.setdefault("basis", {})
    rv = basis.setdefault("rv_basis", {})
    series = rv.setdefault("series", {})
    series["eth_calendar_et_near_deferred"] = eth
    return True


def _stamp_registry_fields(entry: dict, series_id: str) -> dict:
    """Ensure primary rv_history entries carry BBDM registry ids (Chunk 15 lock)."""
    trade = trade_for_series(series_id)
    if trade:
        entry.setdefault("bbdm_trade_id", trade.id)
        entry.setdefault("series_id", series_id)
    return entry


def build_rv_history_block(bundle: dict) -> dict:
    """Build rv_history.series from BBDM v2 eight-series map + legacy fallbacks."""
    as_of = (_dig(bundle, "as_of") or datetime.utcnow().isoformat())[:19]
    out_series: dict[str, dict] = {}

    for series_id in BBDM_V2_PRIMARY_SERIES:
        if series_id == BTC_BASIS_SPOT_1M_ID:
            entry = build_btc_basis_spot_1m_series(bundle, ROOT)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id == BTC_CALENDAR_SERIES_ID:
            entry = build_btc_calendar_series(bundle, ROOT)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id == ETH_BASIS_SPOT_1M_ID:
            entry = build_eth_basis_spot_1m_series(bundle, ROOT)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id == ETH_CALENDAR_SERIES_ID:
            entry = build_live_eth_calendar_series(bundle, ROOT)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id == GPU_BASIS_SPREAD_ID:
            entry = build_gpu_basis_spread_series(bundle, ROOT)
            if not entry:
                entry = _build_ai_compute_series_entry(bundle, series_id)
        elif series_id == GPU_CRUSH_CALENDAR_SPREAD_ID:
            entry = build_gpu_crush_calendar_spread_series(bundle, ROOT)
            if not entry:
                entry = _build_ai_compute_series_entry(bundle, series_id)
        elif series_id == SOFR_OIS_SPREAD_ID:
            entry = build_sofr_ois_spread_series(bundle)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id == USGG2Y10Y_ID:
            entry = build_usgg2y10y_series(bundle)
            if not entry:
                entry = _build_cockpit_series_entry(bundle, series_id)
        elif series_id in AI_COMPUTE_SERIES:
            entry = _build_ai_compute_series_entry(bundle, series_id)
        else:
            entry = _build_cockpit_series_entry(bundle, series_id)
        if entry:
            out_series[series_id] = _stamp_registry_fields(entry, series_id)

    for legacy_id in ("btc_basis_vs_refs", "gpu_crush_spread"):
        if legacy_id in out_series:
            continue
        if legacy_id in AI_COMPUTE_SERIES:
            entry = _build_ai_compute_series_entry(bundle, legacy_id)
        else:
            entry = _build_cockpit_series_entry(bundle, legacy_id)
        if entry:
            out_series[legacy_id] = entry

    return {
        "version": RV_HISTORY_VERSION,
        "as_of": as_of,
        "bbdm_primary_series": list(BBDM_V2_PRIMARY_SERIES),
        "series": out_series,
    }


def sidecar_paths(root: Path | None = None) -> list[Path]:
    base = root or ROOT
    return [
        base / "docs" / "data" / "hydration" / "rv_history.json",
        base / "data" / "hydration" / "rv_history.json",
    ]


def load_sidecar(root: Path | None = None) -> dict | None:
    for p in sidecar_paths(root):
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    return None


class RvHistoryStore:
    def __init__(self, bundle: dict, root: Path | None = None):
        self.bundle = bundle
        self.root = root or ROOT
        self._block = self._resolve_block()

    def _resolve_block(self) -> dict:
        inline = self.bundle.get("rv_history")
        if isinstance(inline, dict) and inline.get("series"):
            return inline
        sidecar = load_sidecar(self.root)
        if sidecar and sidecar.get("series"):
            return sidecar
        return build_rv_history_block(self.bundle)

    @property
    def series(self) -> dict:
        return self._block.get("series") or {}

    def points(self, series_id: str) -> list[dict]:
        entry = self.series.get(series_id) or {}
        return list(entry.get("points") or [])

    def meta(self, series_id: str) -> dict:
        return self.series.get(series_id) or {}

    def source(self, series_id: str) -> str:
        return self.meta(series_id).get("source", "unknown")

    def slice_window(self, series_id: str, window_days: int) -> list[dict]:
        pts = self.points(series_id)
        if not pts:
            return []
        return pts[-window_days:] if len(pts) > window_days else pts

    def z_score(
        self,
        series_id: str,
        window_days: int,
        direction: str | None = None,
    ) -> tuple[float | None, float | None, str]:
        """Return (z, percentile_proxy, source)."""
        pts = self.slice_window(series_id, window_days)
        if len(pts) < 5:
            return None, None, self.source(series_id)

        direction = direction or self.meta(series_id).get("quartile_direction", "higher_is_richer")
        vals = [_safe_float(p.get("value")) for p in pts]
        vals = [v for v in vals if v is not None]
        if len(vals) < 5:
            return None, None, self.source(series_id)

        mean = sum(vals) / len(vals)
        var = sum((x - mean) ** 2 for x in vals) / max(len(vals) - 1, 1)
        std = math.sqrt(var) if var > 1e-12 else max(abs(mean) * 0.01, 0.001)
        z = (vals[-1] - mean) / std
        if direction == "higher_is_cheaper":
            z = -z
        z = round(z, 2)
        return z, round(50 + z * 15, 1), self.source(series_id)

    def history_for_chart(self, series_id: str, window_days: int) -> list[dict]:
        return self.slice_window(series_id, window_days)


def enrich_bundle(bundle: dict) -> dict:
    """Inject all 8 BBDM series + rv_history + lineage stamps (delegates to enrich_hydration)."""
    from whinfell_pipeline.enrich_hydration import enrich_bundle as _enrich_bundle_v2

    return _enrich_bundle_v2(bundle, ROOT)