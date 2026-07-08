#!/usr/bin/env python3
"""Chunk 07 — BBDM v2 eight-series rv_history map lock tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import TRADE_IDS_V2  # noqa: E402
from whinfell_pipeline.bbdm_registry import BBDM_TRADES, trade_for_series  # noqa: E402
from whinfell_pipeline.rv_history import (  # noqa: E402
    AI_COMPUTE_SERIES,
    BBDM_V2_PRIMARY_SERIES,
    RV_HISTORY_VERSION,
    SERIES_NODE_MAP,
    build_rv_history_block,
    gpu_compute_points,
    inject_eth_calendar,
    resolve_cockpit_meta,
)

DICT_YAML = ROOT / "whinfell_pipeline" / "data_dictionary.yaml"
META = ROOT / "data_dictionary_meta.json"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"


def test_primary_series_matches_registry():
    assert BBDM_V2_PRIMARY_SERIES == tuple(t.series_id for t in BBDM_TRADES)
    assert len(BBDM_V2_PRIMARY_SERIES) == 8


def test_series_node_map_covers_all_primary_and_fallbacks():
    for trade in BBDM_TRADES:
        assert trade.series_id in SERIES_NODE_MAP, f"missing primary map: {trade.series_id}"
        for fallback_id in trade.series_fallback_ids:
            assert fallback_id in SERIES_NODE_MAP, f"missing fallback map: {fallback_id}"


def test_trade_for_series_lookup():
    assert trade_for_series("btc_basis_spot_1m") is not None
    assert trade_for_series("btc_basis_vs_refs").id == "btc_basis"
    assert trade_for_series("gpu_crush_spread").id == "midwest_calendar"
    assert trade_for_series("missing_series_xyz") is None


def test_dictionary_yaml_bbdm_primary_series():
    rv = yaml.safe_load(DICT_YAML.read_text(encoding="utf-8"))["rv_series"]
    assert rv["version"] == RV_HISTORY_VERSION
    assert rv["bbdm_primary_series"] == list(BBDM_V2_PRIMARY_SERIES)
    series = rv["series"]
    for trade in BBDM_TRADES:
        entry = series[trade.series_id]
        assert entry["bbdm_trade_id"] == trade.id
        assert entry["quartile_direction"] == trade.quartile_direction


def test_dictionary_meta_rv_history_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("locked_chunk") == "09"
    assert stub.get("rv_history_module") == "whinfell_pipeline/rv_history.py"
    assert stub.get("rv_history_version") == RV_HISTORY_VERSION
    assert stub.get("rv_history_primary_series") == list(BBDM_V2_PRIMARY_SERIES)


def test_build_rv_history_block_from_hydration():
    if not HYDRATION.is_file():
        return
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    inject_eth_calendar(bundle)
    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION
    assert block["bbdm_primary_series"] == list(BBDM_V2_PRIMARY_SERIES)

    series = block["series"]
    expected_live = {
        "btc_calendar_bt_near_deferred",
        "eth_calendar_et_near_deferred",
        "sofr_ois_spread",
        "usgg2y10y",
        "gpu_basis_spread",
        "gpu_crush_calendar_spread",
        "gpu_crush_spread",
        "btc_basis_spot_1m",
    }
    for series_id in expected_live:
        assert series_id in series, f"missing built series: {series_id}"
        assert len(series[series_id]["points"]) >= 5, f"short history: {series_id}"

    btc_basis = series["btc_basis_spot_1m"]
    assert btc_basis.get("data_status") == "live"
    assert btc_basis.get("source") == "barchart_spread_history"

    btc_calendar = series["btc_calendar_bt_near_deferred"]
    assert btc_calendar.get("data_status") == "live"
    assert btc_calendar.get("source") == "barchart_spread_history"
    assert btc_calendar.get("bbdm_trade_id") == "btc_calendar"


def test_btc_basis_cockpit_or_fallback_resolution():
    if not HYDRATION.is_file():
        return
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    inject_eth_calendar(bundle)
    meta, resolved = resolve_cockpit_meta(bundle, "btc_basis_spot_1m")
    if meta is not None and resolved == "btc_basis_spot_1m":
        assert meta.get("data_status") == "live"
        return
    assert meta is not None
    assert resolved == "btc_basis_vs_refs"


def test_gpu_compute_series_values():
    if not HYDRATION.is_file():
        return
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    basis_pts = gpu_compute_points(bundle, "gpu_basis_spread")
    cal_pts = gpu_compute_points(bundle, "gpu_crush_calendar_spread")
    crush_pts = gpu_compute_points(bundle, "gpu_crush_spread")
    assert len(basis_pts) >= 5
    assert len(cal_pts) >= 5
    assert len(crush_pts) >= 5
    assert basis_pts[-1]["value"] == 0.33
    assert cal_pts[-1]["value"] == 0.33
    assert crush_pts[-1]["value"] == 0.66


def test_ai_compute_series_ids_locked():
    assert AI_COMPUTE_SERIES == frozenset(
        {"gpu_basis_spread", "gpu_crush_calendar_spread", "gpu_crush_spread"}
    )


def test_trade_ids_order_unchanged():
    assert [t.id for t in BBDM_TRADES] == list(TRADE_IDS_V2)


if __name__ == "__main__":
    test_primary_series_matches_registry()
    test_series_node_map_covers_all_primary_and_fallbacks()
    test_trade_for_series_lookup()
    test_dictionary_yaml_bbdm_primary_series()
    test_dictionary_meta_rv_history_stub()
    test_build_rv_history_block_from_hydration()
    test_btc_basis_fallback_resolution()
    test_gpu_compute_series_values()
    test_ai_compute_series_ids_locked()
    test_trade_ids_order_unchanged()
    print("bbdm_rv_history_map tests OK")