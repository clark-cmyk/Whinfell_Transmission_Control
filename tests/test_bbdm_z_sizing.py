#!/usr/bin/env python3
"""Chunk 04 — BBDM v2 Z-score sizing bucket lock tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import SIZING_MULTIPLIERS  # noqa: E402
from whinfell_pipeline.bbdm_registry import BBDM_TRADES, trade_direction  # noqa: E402
from whinfell_pipeline.bbdm_z_sizing import (  # noqa: E402
    SIZING_VERSION,
    get_z_size_multiplier,
    interpret_trade_direction,
    recommendation_for_trade,
    sizing_bucket,
    sizing_bucket_from_z,
    validate_sizing_engine,
)

META = ROOT / "data_dictionary_meta.json"


def test_sizing_engine_validates():
    errors = validate_sizing_engine()
    assert errors == [], f"sizing engine errors: {errors}"


@pytest.mark.parametrize(
    "z_score,expected_bucket,expected_mult",
    [
        (None, "DATA_GAP", None),
        (0.0, "PASS", 0),
        (0.5, "PASS", 0),
        (-0.5, "PASS", 0),
        (0.999, "PASS", 0),
        (1.0, "1x", 1),
        (-1.0, "1x", 1),
        (1.5, "1x", 1),
        (1.999, "1x", 1),
        (2.0, "2x", 2),
        (-2.0, "2x", 2),
        (2.5, "2x", 2),
        (2.999, "2x", 2),
        (3.0, "3x", 3),
        (-3.0, "3x", 3),
        (5.49, "3x", 3),
        (-10.0, "3x", 3),
    ],
)
def test_bucket_thresholds(z_score, expected_bucket, expected_mult):
    assert sizing_bucket_from_z(z_score) == expected_bucket
    assert get_z_size_multiplier(z_score) == expected_mult
    assert SIZING_MULTIPLIERS[expected_bucket] == expected_mult


def test_negative_z_same_bucket_as_positive():
    for z in (1.2, 2.2, 3.5):
        assert sizing_bucket_from_z(z) == sizing_bucket_from_z(-z)
        assert get_z_size_multiplier(z) == get_z_size_multiplier(-z)


def test_gate_blocked_overrides_bucket():
    assert sizing_bucket(5.0, blocked=True) == "BLOCKED"
    assert get_z_size_multiplier(5.0) == 3
    interp = interpret_trade_direction("btc_calendar", 5.0, blocked=True)
    assert interp.sizing_bucket == "BLOCKED"
    assert interp.sizing_multiplier is None
    assert interp.direction == "buy_spread"


def test_data_gap_overrides():
    assert sizing_bucket(2.0, data_ok=False) == "DATA_GAP"
    assert sizing_bucket(None) == "DATA_GAP"
    interp = interpret_trade_direction("eth_basis", None)
    assert interp.sizing_bucket == "DATA_GAP"
    assert interp.direction == "none"


def test_direction_positive_buy_negative_sell():
    assert trade_direction(1.5) == "buy_spread"
    assert trade_direction(-1.5) == "sell_spread"
    assert trade_direction(0.0) == "none"
    interp_buy = interpret_trade_direction("sofr_fed_funds", 1.8)
    interp_sell = interpret_trade_direction("sofr_fed_funds", -1.8)
    assert interp_buy.direction == "buy_spread"
    assert interp_sell.direction == "sell_spread"


def test_interpret_trade_direction_registry_integration():
    for trade in BBDM_TRADES:
        interp = interpret_trade_direction(trade.id, 2.1)
        assert interp.trade_id == trade.id
        assert interp.label == trade.label
        assert interp.series_id == trade.series_id
        assert interp.structure_type == trade.structure_type
        assert interp.sizing_bucket == "2x"
        assert interp.sizing_multiplier == 2


def test_interpret_unknown_trade_raises():
    with pytest.raises(KeyError, match="unknown trade_id"):
        interpret_trade_direction("not_a_trade", 1.0)


def test_recommendation_for_trade_shape():
    trade = BBDM_TRADES[0]
    rec = recommendation_for_trade(trade, 2.5)
    assert rec["direction"] == "buy_spread"
    assert rec["sizing_bucket"] == "2x"
    assert rec["sizing_multiplier"] == 2
    assert rec["structure"] == trade.suggested_structure


def test_recommendation_blocked_null_multiplier():
    trade = BBDM_TRADES[6]
    rec = recommendation_for_trade(trade, 4.0, blocked=True)
    assert rec["sizing_bucket"] == "BLOCKED"
    assert rec["sizing_multiplier"] is None


def test_all_registry_trades_direction_consistency():
    for trade in BBDM_TRADES:
        assert interpret_trade_direction(trade.id, 0.0).direction == "none"
        assert interpret_trade_direction(trade.id, 1.2).direction == "buy_spread"
        assert interpret_trade_direction(trade.id, -1.2).direction == "sell_spread"


def test_dictionary_meta_sizing_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("locked_chunk") == "08"
    assert stub.get("sizing_module") == "whinfell_pipeline/bbdm_z_sizing.py"
    assert stub.get("sizing_version") == SIZING_VERSION


if __name__ == "__main__":
    import pytest as _pytest

    raise SystemExit(_pytest.main([__file__, "-q"]))