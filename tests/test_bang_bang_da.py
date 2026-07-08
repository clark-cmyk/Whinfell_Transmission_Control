#!/usr/bin/env python3
"""Regression tests for Bang Bang Da Machine v2.0 calculator."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import BBDM_VERSION, TRADE_IDS_V2, validate_report  # noqa: E402
from bang_bang_da_calculator import BangBangCalculator, VERDICT_BLOCKED  # noqa: E402
from whinfell_pipeline.rv_history import RvHistoryStore, inject_eth_calendar  # noqa: E402


def _bundle():
    bundle_path = ROOT / "docs" / "data" / "hydration" / "latest.json"
    if not bundle_path.is_file():
        return None
    return json.loads(bundle_path.read_text(encoding="utf-8"))


def test_eight_trades_from_hydration():
    bundle = _bundle()
    if bundle is None:
        return
    report = BangBangCalculator(bundle, window_days=60).run()
    assert report["bang_bang_da_version"] == BBDM_VERSION
    assert len(report["trades"]) == 8
    ids = [trade["id"] for trade in report["trades"]]
    assert set(ids) == set(TRADE_IDS_V2)
    assert report["summary"]["trade_count"] == 8
    for block in ("litmus", "articulator", "inspection", "risk_dashboard"):
        assert block in report


def test_v2_report_schema_validates():
    bundle = _bundle()
    if bundle is None:
        return
    report = BangBangCalculator(bundle, window_days=60).run()
    errors = validate_report(report)
    assert errors == [], f"schema errors: {errors}"


def test_gate_blocks_low_score():
    bundle = _bundle()
    if bundle is None:
        return
    report = BangBangCalculator(bundle).run()
    if report["gate"]["whinfell_score"] is not None and report["gate"]["whinfell_score"] < 50:
        assert all(trade["verdict"] == VERDICT_BLOCKED for trade in report["trades"])


def test_sorted_by_abs_z():
    bundle = _bundle()
    if bundle is None:
        return
    trades = BangBangCalculator(bundle).run()["trades"]
    zvals = [trade["z_abs"] if trade["z_abs"] is not None else -1 for trade in trades]
    assert zvals == sorted(zvals, reverse=True)


def test_eth_calendar_injected():
    bundle = _bundle()
    if bundle is None:
        return
    assert inject_eth_calendar(bundle)
    series = bundle["node_cockpits"]["basis"]["rv_basis"]["series"]
    assert "eth_calendar_et_near_deferred" in series


def test_rv_history_points():
    bundle = _bundle()
    if bundle is None:
        return
    inject_eth_calendar(bundle)
    store = RvHistoryStore(bundle, ROOT)
    pts = store.points("btc_calendar_bt_near_deferred")
    assert len(pts) >= 5
    z, _, src = store.z_score("btc_calendar_bt_near_deferred", 60)
    assert z is not None
    assert src


def test_history_not_mock_only():
    bundle = _bundle()
    if bundle is None:
        return
    report = BangBangCalculator(bundle).run()
    for trade in report["trades"]:
        if trade.get("z_score") is None:
            continue
        assert trade.get("history_source"), f"missing history_source on {trade['id']}"
        assert len(trade.get("history") or []) >= 5, f"short history on {trade['id']}"


def test_midwest_corporate_gm_url_wired():
    from whinfell_pipeline.koyfin_corporate_gm import load_watchlist_url  # noqa: E402

    url = load_watchlist_url(ROOT / "whinfell_pipeline")
    assert "790f7aab-ba98-43df-9807-78b01c779a29" in url


if __name__ == "__main__":
    test_eight_trades_from_hydration()
    test_v2_report_schema_validates()
    test_gate_blocks_low_score()
    test_sorted_by_abs_z()
    test_eth_calendar_injected()
    test_rv_history_points()
    test_history_not_mock_only()
    test_midwest_corporate_gm_url_wired()
    print("bang_bang_da tests OK")