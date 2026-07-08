#!/usr/bin/env python3
"""Chunk 19 — unified Z engine for all eight BBDM v2 trades."""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import TRADE_IDS_V2  # noqa: E402
from bang_bang_da_calculator import BangBangCalculator  # noqa: E402
from whinfell_pipeline.bbdm_registry import BBDM_TRADES  # noqa: E402
from whinfell_pipeline.rv_history import RvHistoryStore, inject_eth_calendar  # noqa: E402
from whinfell_pipeline.z_engine import (  # noqa: E402
    HORIZON_WINDOWS,
    Z_ENGINE_VERSION,
    compute_trade_horizons,
    compute_trade_z,
    horizon_key_for_window,
    min_obs_for_rv_history,
    validate_z_engine,
)

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"


def _daily_points(n: int, terminal: float, *, seed: str = "pts") -> list[dict]:
    end = date.today()
    pts: list[dict] = []
    for i in range(n):
        d = end - timedelta(days=n - 1 - i)
        value = terminal + (i - n + 1) * 0.01
        pts.append({"date": d.isoformat(), "value": round(value, 4)})
    pts[-1]["value"] = round(terminal, 4)
    return pts


def _bundle_with_rv(series_id: str, points: list[dict], *, source: str = "test_live") -> dict:
    return {
        "as_of": date.today().isoformat(),
        "rv_history": {
            "version": "test",
            "series": {
                series_id: {
                    "label": series_id,
                    "unit": "pct",
                    "quartile_direction": "higher_is_richer",
                    "source": source,
                    "points": points,
                }
            },
        },
    }


def _bundle_with_cockpit_percentile(
    trade_id: str,
    *,
    percentile: float = 84.0,
    current_value: float = 1.25,
    n_obs: int = 63,
    short_rv_points: list[dict] | None = None,
) -> dict:
    trade = next(t for t in BBDM_TRADES if t.id == trade_id)
    horizons = {
        "1m": {
            "current_value": current_value,
            "percentile": percentile,
            "n_observations": n_obs,
            "unit": trade.unit,
            "richness_label": "rich",
        },
        "3m": {
            "current_value": current_value,
            "percentile": percentile,
            "n_observations": n_obs,
            "unit": trade.unit,
            "richness_label": "rich",
        },
    }
    series = {
        "quartile_direction": trade.quartile_direction,
        "unit": trade.unit,
        "horizons": horizons,
    }
    rv_points = short_rv_points if short_rv_points is not None else _daily_points(3, current_value)
    bundle: dict = {
        "as_of": date.today().isoformat(),
        "rv_history": {
            "series": {
                trade.series_id: {
                    "label": trade.label,
                    "unit": trade.unit,
                    "quartile_direction": trade.quartile_direction,
                    "source": "test_short",
                    "points": rv_points,
                }
            }
        },
    }
    if trade.node_id == "aicompute":
        bundle["ai_compute"] = {"rv_basis": {"series": {trade.series_id: series}}}
    else:
        bundle.setdefault("node_cockpits", {}).setdefault(trade.node_id, {}).setdefault(
            "rv_basis", {}
        )["series"] = {trade.series_id: series}
    return bundle


def test_z_engine_validates():
    errors = validate_z_engine()
    assert errors == [], f"z_engine errors: {errors}"


def test_registry_covers_eight_trades():
    assert [t.id for t in BBDM_TRADES] == list(TRADE_IDS_V2)
    assert len(BBDM_TRADES) == 8


@pytest.mark.parametrize("window_days,expected_key", [(30, "1m"), (60, "3m"), (90, "3m")])
def test_horizon_key_mapping(window_days, expected_key):
    assert horizon_key_for_window(window_days) == expected_key


@pytest.mark.parametrize("trade_id", list(TRADE_IDS_V2))
def test_rv_history_primary_all_trades(trade_id: str):
    trade = next(t for t in BBDM_TRADES if t.id == trade_id)
    bundle = _bundle_with_rv(trade.series_id, _daily_points(30, 2.5))
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z(trade_id, 60, rv, bundle)
    assert result.method == "rv_history"
    assert result.z_score is not None
    assert result.n_observations is not None
    assert result.n_observations >= min_obs_for_rv_history(trade_id)
    assert result.data_status in ("live", "rv_history")


@pytest.mark.parametrize("trade_id", list(TRADE_IDS_V2))
def test_percentile_fallback_when_short_history(trade_id: str):
    trade = next(t for t in BBDM_TRADES if t.id == trade_id)
    bundle = _bundle_with_cockpit_percentile(trade_id, percentile=84.0)
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z(trade_id, 60, rv, bundle)
    assert result.method == "percentile_fallback"
    assert result.z_score is not None
    assert result.percentile == 84.0
    assert result.data_status == "live"


def test_sofr_cheaper_direction_inverts_z():
    bundle = _bundle_with_cockpit_percentile("sofr_fed_funds", percentile=84.0)
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z("sofr_fed_funds", 60, rv, bundle)
    assert result.method == "percentile_fallback"
    assert result.z_score is not None
    assert result.z_score < 0


def test_midwest_calendar_live_requires_twenty_obs():
    trade = next(t for t in BBDM_TRADES if t.id == "midwest_calendar")
    bundle = _bundle_with_cockpit_percentile(
        "midwest_calendar",
        percentile=75.0,
        current_value=0.45,
        short_rv_points=_daily_points(12, 0.45),
    )
    bundle["rv_history"]["series"][trade.series_id]["source"] = "ai_compute_spot_index"
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z("midwest_calendar", 60, rv, bundle)
    assert result.method == "percentile_fallback"
    assert min_obs_for_rv_history("midwest_calendar", rv_source="ai_compute_spot_index") == 20


def test_midwest_calendar_live_uses_rv_at_twenty_obs():
    trade = next(t for t in BBDM_TRADES if t.id == "midwest_calendar")
    bundle = _bundle_with_rv(
        trade.series_id,
        _daily_points(25, 0.55),
        source="ai_compute_spot_index",
    )
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z("midwest_calendar", 60, rv, bundle)
    assert result.method == "rv_history"
    assert result.z_score is not None


@pytest.mark.parametrize("trade_id", list(TRADE_IDS_V2))
def test_all_three_horizons(trade_id: str):
    trade = next(t for t in BBDM_TRADES if t.id == trade_id)
    bundle = _bundle_with_rv(trade.series_id, _daily_points(90, 1.1))
    rv = RvHistoryStore(bundle, ROOT)
    horizons = compute_trade_horizons(trade_id, rv, bundle)
    assert len(horizons) == 3
    assert [h.window_days for h in horizons] == list(HORIZON_WINDOWS)
    assert all(h.z_score is not None for h in horizons)


def test_missing_data_returns_none():
    trade = next(t for t in BBDM_TRADES if t.id == "btc_basis")
    bundle = {
        "as_of": date.today().isoformat(),
        "rv_history": {
            "series": {
                trade.series_id: {
                    "label": trade.label,
                    "unit": trade.unit,
                    "quartile_direction": trade.quartile_direction,
                    "source": "missing",
                    "points": [],
                }
            }
        },
    }
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z("btc_basis", 60, rv, bundle)
    assert result.method == "missing"
    assert result.z_score is None
    assert result.data_status == "missing"


def test_btc_basis_fallback_series():
    trade = next(t for t in BBDM_TRADES if t.id == "btc_basis")
    bundle = _bundle_with_rv("btc_basis_vs_refs", _daily_points(40, 0.08))
    rv = RvHistoryStore(bundle, ROOT)
    result = compute_trade_z(trade.id, 30, rv, bundle)
    assert result.method == "rv_history"
    assert result.series_id == "btc_basis_vs_refs"


def test_calculator_uses_unified_engine():
    if not HYDRATION.is_file():
        return
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    inject_eth_calendar(bundle)
    report = BangBangCalculator(bundle, window_days=60).run()
    assert len(report["trades"]) == 5
    for trade in report["trades"]:
        horizons = trade.get("horizons") or []
        assert len(horizons) == 3
        window_days = {h["window_days"] for h in horizons}
        assert window_days == {30, 60, 90}


def test_z_engine_version_locked():
    assert Z_ENGINE_VERSION == "2.0.0-chunk19"