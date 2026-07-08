"""BBDM v2 Chunk 15 — enrich hydration with all 8 RV series + lineage stamps."""

from __future__ import annotations

import copy
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from whinfell_pipeline.bbdm_registry import BBDM_TRADES
from whinfell_pipeline.btc_basis_series import (
    ADAPTER_VERSION as BTC_BASIS_ADAPTER_VERSION,
    build_btc_basis_spot_1m_series,
    inject_btc_basis_spot_1m_cockpit,
)
from whinfell_pipeline.btc_calendar_series import (
    ADAPTER_VERSION as BTC_CALENDAR_ADAPTER_VERSION,
    build_btc_calendar_series,
    inject_btc_calendar_cockpit,
)
from whinfell_pipeline.eth_basis_series import (
    ADAPTER_VERSION as ETH_BASIS_ADAPTER_VERSION,
    build_eth_basis_spot_1m_series,
    inject_eth_basis_spot_1m_cockpit,
)
from whinfell_pipeline.eth_calendar_series import (
    ADAPTER_VERSION as ETH_CALENDAR_ADAPTER_VERSION,
    build_eth_calendar_series,
    inject_eth_calendar_cockpit,
)
from whinfell_pipeline.midwest_basis_series import (
    ADAPTER_VERSION as MIDWEST_BASIS_ADAPTER_VERSION,
    build_gpu_basis_spread_series,
    inject_gpu_basis_spread_cockpit,
)
from whinfell_pipeline.midwest_calendar_series import (
    ADAPTER_VERSION as MIDWEST_CALENDAR_ADAPTER_VERSION,
    build_gpu_crush_calendar_spread_series,
    inject_gpu_crush_calendar_spread_cockpit,
)
from whinfell_pipeline.rates_series import ADAPTER_VERSION as RATES_ADAPTER_VERSION
from whinfell_pipeline.rv_history import (  # noqa: F401 — re-exported for CLI/tests
    BBDM_V2_PRIMARY_SERIES,
    RV_HISTORY_VERSION,
    build_rv_history_block,
    inject_eth_calendar,
)

__all__ = [
    "BBDM_V2_PRIMARY_SERIES",
    "ENRICH_VERSION",
    "build_bbdm_rv_enrich_block",
    "build_series_lineage",
    "enrich_bundle",
    "enrich_lineage_hash",
    "primary_series_status",
]

ENRICH_VERSION = "2.0.0-chunk15"

SERIES_ADAPTER_META: dict[str, tuple[str, str]] = {
    "btc_basis_spot_1m": ("whinfell_pipeline/btc_basis_series.py", BTC_BASIS_ADAPTER_VERSION),
    "btc_calendar_bt_near_deferred": ("whinfell_pipeline/btc_calendar_series.py", BTC_CALENDAR_ADAPTER_VERSION),
    "eth_basis_spot_1m": ("whinfell_pipeline/eth_basis_series.py", ETH_BASIS_ADAPTER_VERSION),
    "eth_calendar_et_near_deferred": ("whinfell_pipeline/eth_calendar_series.py", ETH_CALENDAR_ADAPTER_VERSION),
    "gpu_basis_spread": ("whinfell_pipeline/midwest_basis_series.py", MIDWEST_BASIS_ADAPTER_VERSION),
    "gpu_crush_calendar_spread": ("whinfell_pipeline/midwest_calendar_series.py", MIDWEST_CALENDAR_ADAPTER_VERSION),
    "sofr_ois_spread": ("whinfell_pipeline/rates_series.py", RATES_ADAPTER_VERSION),
    "usgg2y10y": ("whinfell_pipeline/rates_series.py", RATES_ADAPTER_VERSION),
}

COCKPIT_NODE_BY_SERIES: dict[str, str] = {
    "btc_basis_spot_1m": "basis",
    "btc_calendar_bt_near_deferred": "basis",
    "eth_basis_spot_1m": "basis",
    "eth_calendar_et_near_deferred": "basis",
    "gpu_basis_spread": "ai_compute",
    "gpu_crush_calendar_spread": "ai_compute",
    "sofr_ois_spread": "liquidity",
    "usgg2y10y": "liquidity",
}


def _cockpit_series_map(bundle: dict, node: str) -> dict:
    if node == "ai_compute":
        return bundle.get("ai_compute", {}).get("rv_basis", {}).get("series", {}) or {}
    return (
        bundle.get("node_cockpits", {})
        .get(node, {})
        .get("rv_basis", {})
        .get("series", {})
        or {}
    )


def _series_present_in_cockpit(bundle: dict, series_id: str) -> bool:
    node = COCKPIT_NODE_BY_SERIES.get(series_id, "")
    if not node:
        return False
    return series_id in _cockpit_series_map(bundle, node)


def _inject_all_series_cockpits(bundle: dict, root: Path) -> list[dict[str, str]]:
    """Inject live adapter cockpits for all eight primary series where applicable."""
    injected: list[dict[str, str]] = []

    if inject_eth_calendar(bundle):
        injected.append({"node": "basis", "series_id": "eth_calendar_et_near_deferred", "method": "eth_calendar"})

    live_btc_basis = build_btc_basis_spot_1m_series(bundle, root)
    if live_btc_basis and inject_btc_basis_spot_1m_cockpit(bundle, live_btc_basis):
        injected.append({"node": "basis", "series_id": "btc_basis_spot_1m", "method": "btc_basis"})

    live_btc_calendar = build_btc_calendar_series(bundle, root)
    if live_btc_calendar and inject_btc_calendar_cockpit(bundle, live_btc_calendar):
        injected.append({"node": "basis", "series_id": "btc_calendar_bt_near_deferred", "method": "btc_calendar"})

    live_eth_basis = build_eth_basis_spot_1m_series(bundle, root)
    if live_eth_basis and inject_eth_basis_spot_1m_cockpit(bundle, live_eth_basis):
        injected.append({"node": "basis", "series_id": "eth_basis_spot_1m", "method": "eth_basis"})

    live_midwest_basis = build_gpu_basis_spread_series(bundle, root)
    if live_midwest_basis and live_midwest_basis.get("data_status") == "live":
        if inject_gpu_basis_spread_cockpit(bundle, live_midwest_basis):
            injected.append({"node": "ai_compute", "series_id": "gpu_basis_spread", "method": "midwest_basis"})

    live_midwest_calendar = build_gpu_crush_calendar_spread_series(bundle, root)
    if live_midwest_calendar and live_midwest_calendar.get("data_status") == "live":
        if inject_gpu_crush_calendar_spread_cockpit(bundle, live_midwest_calendar):
            injected.append(
                {"node": "ai_compute", "series_id": "gpu_crush_calendar_spread", "method": "midwest_calendar"}
            )

    live_eth_calendar = build_eth_calendar_series(bundle, root)
    if live_eth_calendar and inject_eth_calendar_cockpit(bundle, live_eth_calendar):
        if not any(row.get("series_id") == "eth_calendar_et_near_deferred" for row in injected):
            injected.append(
                {"node": "basis", "series_id": "eth_calendar_et_near_deferred", "method": "eth_calendar_live"}
            )

    return injected


def build_series_lineage(bundle: dict, rv_block: dict) -> list[dict[str, Any]]:
    """Per-series lineage stamps for all eight BBDM primary trades."""
    series = rv_block.get("series") or {}
    stamps: list[dict[str, Any]] = []

    for trade in BBDM_TRADES:
        series_id = trade.series_id
        entry = series.get(series_id) or {}
        adapter_module, adapter_version = SERIES_ADAPTER_META.get(series_id, ("unknown", "unknown"))
        points = entry.get("points") or []
        stamps.append(
            {
                "series_id": series_id,
                "bbdm_trade_id": trade.id,
                "structure_type": trade.structure_type,
                "trade_type": trade.trade_type,
                "data_status": entry.get("data_status", "fallback"),
                "source": entry.get("source", "missing"),
                "adapter_module": adapter_module,
                "adapter_version": adapter_version,
                "points_count": len(points),
                "cockpit_present": _series_present_in_cockpit(bundle, series_id),
                "resolved_series_id": entry.get("resolved_series_id", series_id),
            }
        )
    return stamps


def enrich_lineage_hash(stamps: dict[str, Any]) -> str:
    payload = json.dumps(stamps, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_bbdm_rv_enrich_block(
    bundle: dict,
    rv_block: dict,
    *,
    cockpit_injects: list[dict[str, str]],
) -> dict[str, Any]:
    series_lineage = build_series_lineage(bundle, rv_block)
    live_count = sum(1 for row in series_lineage if row.get("data_status") == "live")
    fallback_count = len(series_lineage) - live_count
    stamp_body = {
        "version": ENRICH_VERSION,
        "enriched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "rv_history_version": rv_block.get("version", RV_HISTORY_VERSION),
        "primary_series": list(BBDM_V2_PRIMARY_SERIES),
        "series_lineage": series_lineage,
        "cockpit_injects": cockpit_injects,
        "input_lineage_hash": bundle.get("lineage_hash"),
        "live_count": live_count,
        "fallback_count": fallback_count,
    }
    stamp_body["enrich_lineage_hash"] = enrich_lineage_hash(stamp_body)
    return stamp_body


def enrich_bundle(bundle: dict, root: Path | None = None) -> dict:
    """Inject all 8 BBDM series cockpits, rv_history block, and lineage stamps."""
    from whinfell_pipeline.rv_history import ROOT as RV_ROOT

    base = root or RV_ROOT
    out = copy.deepcopy(bundle)
    cockpit_injects = _inject_all_series_cockpits(out, base)
    rv_block = build_rv_history_block(out)
    out["rv_history"] = rv_block
    out["bbdm_rv_enrich"] = build_bbdm_rv_enrich_block(out, rv_block, cockpit_injects=cockpit_injects)
    return out


def primary_series_status(rv_block: dict) -> dict[str, str]:
    """Map series_id → live|fallback|missing for CLI reporting."""
    series = rv_block.get("series") or {}
    out: dict[str, str] = {}
    for series_id in BBDM_V2_PRIMARY_SERIES:
        entry = series.get(series_id)
        if not entry:
            out[series_id] = "missing"
        elif entry.get("data_status") == "live":
            out[series_id] = "live"
        else:
            out[series_id] = "fallback"
    return out