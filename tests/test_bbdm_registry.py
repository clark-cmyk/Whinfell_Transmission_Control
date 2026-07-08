#!/usr/bin/env python3
"""Chunk 03 — BBDM v2 eight-trade registry lock tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import TRADE_IDS_V2  # noqa: E402
from whinfell_pipeline.bbdm_registry import (  # noqa: E402
    BBDM_TRADES,
    REGISTRY_VERSION,
    registry_series_node_map,
    trade_by_id,
    trade_direction,
    validate_registry,
)

DICT_YAML = ROOT / "whinfell_pipeline" / "data_dictionary.yaml"
META = ROOT / "data_dictionary_meta.json"


def test_registry_validates():
    errors = validate_registry()
    assert errors == [], f"registry errors: {errors}"


def test_eight_trades_locked_order():
    assert len(BBDM_TRADES) == 8
    assert tuple(t.id for t in BBDM_TRADES) == TRADE_IDS_V2


def test_dual_structure_pairs():
    for group in ("btc", "eth", "midwest"):
        trades = [t for t in BBDM_TRADES if t.pair_group == group]
        assert len(trades) == 2
        types = {t.structure_type for t in trades}
        assert types == {"basis", "calendar"}


def test_single_structure_rates():
    singles = [t for t in BBDM_TRADES if t.structure_type == "single"]
    assert {t.id for t in singles} == {"sofr_fed_funds", "curve_2s10s"}
    assert all(t.pair_group is None for t in singles)


def test_trade_direction_rules():
    assert trade_direction(2.1) == "buy_spread"
    assert trade_direction(-1.2) == "sell_spread"
    assert trade_direction(0.0) == "none"
    assert trade_direction(None) == "none"


def test_series_paths_unique_primary():
    primary = [t.series_id for t in BBDM_TRADES]
    assert len(primary) == len(set(primary))


def test_registry_series_node_map_covers_live_series():
    node_map = registry_series_node_map()
    for trade in BBDM_TRADES:
        assert trade.series_id in node_map, f"missing primary map for {trade.series_id}"
        for fallback_id in trade.series_fallback_ids:
            assert fallback_id in node_map, f"missing fallback map for {fallback_id}"


def test_trade_by_id_lookup():
    trade = trade_by_id("curve_2s10s")
    assert trade is not None
    assert trade.series_id == "usgg2y10y"
    assert trade.quartile_direction == "higher_is_richer"
    assert trade_by_id("missing") is None


def test_rv_series_yaml_alignment_for_live_ids():
    text = DICT_YAML.read_text(encoding="utf-8")
    rv = yaml.safe_load(text)["rv_series"]["series"]
    for trade in BBDM_TRADES:
        if trade.series_id in rv:
            assert rv[trade.series_id]["quartile_direction"] == trade.quartile_direction
        for fallback_id in trade.series_fallback_ids:
            if fallback_id in rv:
                assert rv[fallback_id]["quartile_direction"] == trade.quartile_direction


def test_v12_migration_coverage():
    v12 = {t.v12_id for t in BBDM_TRADES if t.v12_id}
    assert v12 == {
        "btc_calendar",
        "eth_calendar",
        "midwest_compute",
        "sofr_fed_funds",
        "curve_2s10s",
    }


def test_dictionary_meta_registry_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("registry_module") == "whinfell_pipeline/bbdm_registry.py"
    assert stub.get("locked_chunk") == "08"
    assert stub.get("registry_version") == REGISTRY_VERSION
    assert stub.get("trade_ids") == list(TRADE_IDS_V2)


if __name__ == "__main__":
    test_registry_validates()
    test_eight_trades_locked_order()
    test_dual_structure_pairs()
    test_single_structure_rates()
    test_trade_direction_rules()
    test_series_paths_unique_primary()
    test_registry_series_node_map_covers_live_series()
    test_trade_by_id_lookup()
    test_rv_series_yaml_alignment_for_live_ids()
    test_v12_migration_coverage()
    test_dictionary_meta_registry_stub()
    print("bbdm_registry tests OK")