#!/usr/bin/env python3
"""Chunk 21 — BBDM v2 three-score gate overlay tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import SIZING_BUCKETS  # noqa: E402
from bang_bang_da_calculator import BangBangCalculator  # noqa: E402
from whinfell_pipeline.bbdm_gate import (  # noqa: E402
    GATE_VERSION,
    apply_gate_to_recommendation,
    build_global_gate,
    evaluate_trade_gate,
    min_verdict_cap,
    verdict_cap_from_zones,
    validate_gate_overlay,
)
from whinfell_pipeline.bbdm_registry import BBDM_TRADES  # noqa: E402
from whinfell_pipeline.recommendations import build_trade_recommendation  # noqa: E402

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"


def _bundle(
    *,
    combined: float = 72.0,
    whinfell_ex_china: float = 75.0,
    sq3: float = 80.0,
    node_gates: dict | None = None,
) -> dict:
    bundle = {
        "global": {"whinfell_score": combined, "transmission_state": "normal"},
        "china": {"sq3_score": sq3},
        "task_force": {
            "specialists": {
                "global_transmission": {"global_only_score": whinfell_ex_china},
            }
        },
    }
    if node_gates:
        bundle["node_cockpits"] = node_gates
    return bundle


def test_gate_overlay_validates():
    errors = validate_gate_overlay()
    assert errors == [], f"gate overlay errors: {errors}"


def test_gate_version_locked():
    assert GATE_VERSION == "2.0.0-chunk21"


def test_combined_below_fifty_blocks_globally():
    gate = build_global_gate(_bundle(combined=38.0, whinfell_ex_china=52.0, sq3=61.0))
    assert gate.blocked is True
    assert gate.verdict_cap == "BLOCKED"
    assert "38" in gate.block_reason
    assert gate.whinfell_score == 38.0
    assert gate.combined == 38.0
    assert gate.zones["combined"] == "red"


def test_combined_at_fifty_opens_global_gate():
    gate = build_global_gate(_bundle(combined=50.0))
    assert gate.blocked is False


@pytest.mark.parametrize(
    "zones,expected_cap",
    [
        ({"whinfell_ex_china": "green", "sq3": "green", "combined": "green"}, "3x"),
        ({"whinfell_ex_china": "green", "sq3": "amber", "combined": "green"}, "1x"),
        ({"whinfell_ex_china": "red", "sq3": "green", "combined": "green"}, "BLOCKED"),
        ({"whinfell_ex_china": "amber", "sq3": "amber", "combined": "amber"}, "1x"),
    ],
)
def test_verdict_cap_from_three_score_zones(zones, expected_cap):
    assert verdict_cap_from_zones(zones) == expected_cap


def test_min_verdict_cap_prefers_tightest():
    assert min_verdict_cap("3x", "1x", "2x") == "1x"
    assert min_verdict_cap("3x", "BLOCKED") == "BLOCKED"


def test_node_blocks_rv_blocks_trade_even_when_global_open():
    bundle = _bundle(
        combined=72.0,
        node_gates={
            "basis": {
                "gate_interaction": {
                    "zone": "red",
                    "blocks_rv": True,
                    "note": "Basis node blocks RV expression",
                }
            }
        },
    )
    global_gate = build_global_gate(bundle)
    trade_gate = evaluate_trade_gate("basis", global_gate, bundle)
    assert global_gate.blocked is False
    assert trade_gate.blocked is True
    assert trade_gate.verdict_cap == "BLOCKED"
    assert trade_gate.block_reason == "Basis node blocks RV expression"
    assert trade_gate.node_blocks_rv is True


def test_aicompute_aliases_highbeta_gate_node():
    bundle = _bundle(
        node_gates={
            "highbeta": {
                "gate_interaction": {
                    "zone": "amber",
                    "blocks_rv": False,
                    "note": "Layer2 probe cap",
                }
            }
        },
    )
    global_gate = build_global_gate(bundle)
    trade_gate = evaluate_trade_gate("aicompute", global_gate, bundle)
    assert trade_gate.cockpit_gate_node == "highbeta"
    assert trade_gate.blocked is False
    assert trade_gate.verdict_cap == "1x"


def test_blocked_overrides_recommendation_sizing_bucket():
    trade = BBDM_TRADES[0]
    rec = build_trade_recommendation(3.5, trade=trade, blocked=True)
    assert rec["sizing_bucket"] == "BLOCKED"
    assert rec["sizing_multiplier"] is None


def test_apply_gate_to_recommendation_enforces_blocked():
    trade_gate = evaluate_trade_gate(
        "basis",
        build_global_gate(_bundle(combined=38.0)),
        _bundle(combined=38.0),
    )
    rec = apply_gate_to_recommendation(
        {
            "direction": "buy_spread",
            "sizing_bucket": "3x",
            "sizing_multiplier": 3,
            "structure": "Long BT / short spot",
        },
        trade_gate,
    )
    assert rec["sizing_bucket"] == "BLOCKED"
    assert rec["sizing_multiplier"] is None


@pytest.mark.parametrize("trade", BBDM_TRADES, ids=[t.id for t in BBDM_TRADES])
def test_registry_trades_get_verdict_cap_when_blocked(trade):
    bundle = _bundle(combined=38.0)
    global_gate = build_global_gate(bundle)
    trade_gate = evaluate_trade_gate(trade.node_id, global_gate, bundle)
    assert trade_gate.blocked is True
    assert trade_gate.verdict_cap == "BLOCKED"


def test_calculator_emits_gate_overlay_fields():
    if not HYDRATION.is_file():
        pytest.skip("hydration fixture missing")
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    report = BangBangCalculator(bundle, window_days=60).run()

    assert "risk_dashboard" in report
    assert report["risk_dashboard"]["combined"] is not None
    assert set(report["gate"].keys()) >= {
        "whinfell_score",
        "whinfell_ex_china",
        "sq3",
        "combined",
        "zones",
        "blocked",
        "block_reason",
        "verdict_cap",
    }

    for trade in report["trades"]:
        assert "verdict_cap" in trade
        assert trade["verdict_cap"] in SIZING_BUCKETS
        rec = trade["recommendation"]
        if trade["blocked"]:
            assert trade["verdict_cap"] == "BLOCKED"
            assert rec["sizing_bucket"] == "BLOCKED"
            assert rec["sizing_multiplier"] is None
            assert trade["verdict"] == "BLOCKED"


def test_live_hydration_basis_node_blocks_rv():
    if not HYDRATION.is_file():
        pytest.skip("hydration fixture missing")
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    global_gate = build_global_gate(bundle)
    trade_gate = evaluate_trade_gate("basis", global_gate, bundle)
    basis_gate = bundle["node_cockpits"]["basis"]["gate_interaction"]
    if basis_gate.get("blocks_rv"):
        assert trade_gate.blocked is True
        assert trade_gate.node_blocks_rv is True


if __name__ == "__main__":
    import pytest as _pytest

    raise SystemExit(_pytest.main([__file__, "-q"]))