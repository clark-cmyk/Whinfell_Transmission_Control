#!/usr/bin/env python3
"""Chunk 20 — BBDM v2 trade recommendations engine tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import SIZING_BUCKETS, SIZING_MULTIPLIERS, TRADE_DIRECTIONS  # noqa: E402
from bang_bang_da_calculator import BangBangCalculator  # noqa: E402
from whinfell_pipeline.bbdm_registry import BBDM_TRADES  # noqa: E402
from whinfell_pipeline.recommendations import (  # noqa: E402
    RECOMMENDATIONS_VERSION,
    build_structure_string,
    build_trade_recommendation,
    recommendation_for_trade,
    recommendation_from_z_result,
    resolve_trade,
    validate_recommendations_engine,
)
from whinfell_pipeline.z_engine import TradeZResult  # noqa: E402

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
REQUIRED_KEYS = ("direction", "sizing_bucket", "sizing_multiplier", "structure")


def test_recommendations_engine_validates():
    errors = validate_recommendations_engine()
    assert errors == [], f"recommendations engine errors: {errors}"


def test_recommendations_version_locked():
    assert RECOMMENDATIONS_VERSION == "2.0.0-chunk20"


@pytest.mark.parametrize("trade", BBDM_TRADES, ids=[t.id for t in BBDM_TRADES])
def test_all_eight_trades_emit_full_recommendation_block(trade):
    rec = build_trade_recommendation(2.2, trade=trade)
    assert set(rec.keys()) == set(REQUIRED_KEYS)
    assert rec["direction"] in TRADE_DIRECTIONS
    assert rec["sizing_bucket"] in SIZING_BUCKETS
    assert rec["structure"]
    if rec["sizing_bucket"] in SIZING_MULTIPLIERS:
        assert rec["sizing_multiplier"] == SIZING_MULTIPLIERS[rec["sizing_bucket"]]


@pytest.mark.parametrize("trade", BBDM_TRADES, ids=[t.id for t in BBDM_TRADES])
def test_positive_z_buy_negative_z_sell(trade):
    buy = build_trade_recommendation(1.5, trade=trade)
    sell = build_trade_recommendation(-1.5, trade=trade)
    assert buy["direction"] == "buy_spread"
    assert sell["direction"] == "sell_spread"


@pytest.mark.parametrize(
    "z_score,expected_bucket,expected_mult",
    [
        (0.5, "PASS", 0),
        (1.0, "1x", 1),
        (1.99, "1x", 1),
        (2.0, "2x", 2),
        (2.99, "2x", 2),
        (3.0, "3x", 3),
        (-3.5, "3x", 3),
    ],
)
def test_sizing_buckets_use_absolute_z(z_score, expected_bucket, expected_mult):
    trade = BBDM_TRADES[0]
    rec = build_trade_recommendation(z_score, trade=trade)
    assert rec["sizing_bucket"] == expected_bucket
    assert rec["sizing_multiplier"] == expected_mult


def test_blocked_gate_overrides_sizing_bucket():
    trade = BBDM_TRADES[0]
    rec = build_trade_recommendation(4.0, trade=trade, blocked=True)
    assert rec["sizing_bucket"] == "BLOCKED"
    assert rec["sizing_multiplier"] is None
    assert rec["direction"] == "buy_spread"


def test_data_gap_when_z_missing():
    trade = BBDM_TRADES[0]
    rec = build_trade_recommendation(None, trade=trade)
    assert rec["sizing_bucket"] == "DATA_GAP"
    assert rec["sizing_multiplier"] is None
    assert rec["direction"] == "none"


def test_buy_spread_uses_registry_suggested_structure():
    trade = next(t for t in BBDM_TRADES if t.id == "btc_calendar")
    rec = build_trade_recommendation(2.5, trade=trade)
    assert rec["structure"] == trade.suggested_structure


def test_sell_spread_flips_leg_sides():
    trade = next(t for t in BBDM_TRADES if t.id == "btc_calendar")
    rec = build_trade_recommendation(-2.5, trade=trade)
    assert rec["direction"] == "sell_spread"
    assert "Short BT Deferred" in rec["structure"]
    assert "Long BT Near" in rec["structure"]


def test_sofr_direction_aware_structure():
    trade = next(t for t in BBDM_TRADES if t.id == "sofr_fed_funds")
    buy = build_trade_recommendation(1.8, trade=trade)
    sell = build_trade_recommendation(-1.8, trade=trade)
    assert "Receive SOFR" in buy["structure"]
    assert "Pay SOFR" in sell["structure"]


def test_curve_direction_aware_structure():
    trade = next(t for t in BBDM_TRADES if t.id == "curve_2s10s")
    buy = build_trade_recommendation(2.0, trade=trade)
    sell = build_trade_recommendation(-2.0, trade=trade)
    assert "Flattener" in buy["structure"]
    assert "Steepener" in sell["structure"]


def test_build_structure_string_neutral_uses_trade_structure():
    trade = next(t for t in BBDM_TRADES if t.id == "eth_basis")
    assert build_structure_string(trade, "none") == trade.structure


def test_resolve_trade_v12_alias_midwest_compute():
    trade = resolve_trade("midwest_compute")
    assert trade is not None
    assert trade.id == "midwest_calendar"


def test_recommendation_for_trade_alias():
    trade = BBDM_TRADES[0]
    rec = recommendation_for_trade(trade, 2.5)
    assert rec["direction"] == "buy_spread"
    assert rec["sizing_bucket"] == "2x"
    assert rec["structure"] == trade.suggested_structure


def test_recommendation_from_z_result():
    trade = BBDM_TRADES[0]
    result = TradeZResult(
        trade_id=trade.id,
        series_id=trade.series_id,
        window_days=60,
        horizon_key="3m",
        z_score=2.5,
        percentile=84.0,
        current_value=1.2,
        unit=trade.unit,
        n_observations=60,
        richness="rich",
        data_status="live",
        source="test",
        method="rv_history",
        min_obs_required=5,
    )
    rec = recommendation_from_z_result(result)
    assert rec["direction"] == "buy_spread"
    assert rec["sizing_bucket"] == "2x"


def test_unknown_trade_raises():
    with pytest.raises(KeyError, match="unknown trade_id"):
        build_trade_recommendation(1.0, trade_id="not_a_trade")


def test_calculator_emits_recommendation_on_each_trade():
    if not HYDRATION.is_file():
        pytest.skip("hydration fixture missing")
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    report = BangBangCalculator(bundle, window_days=60).run()
    for trade in report["trades"]:
        rec = trade.get("recommendation")
        assert rec is not None, f"missing recommendation on {trade['id']}"
        assert set(rec.keys()) == set(REQUIRED_KEYS)
        assert rec["sizing_bucket"] in SIZING_BUCKETS
        z = trade.get("z_score")
        if z is not None and z > 0:
            assert rec["direction"] == "buy_spread"
        elif z is not None and z < 0:
            assert rec["direction"] == "sell_spread"


if __name__ == "__main__":
    import pytest as _pytest

    raise SystemExit(_pytest.main([__file__, "-q"]))