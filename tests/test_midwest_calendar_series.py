#!/usr/bin/env python3
"""Chunk 13 — registry-driven gpu_crush_calendar_spread from ai_compute ornn_h200 forward curve."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_for_series  # noqa: E402
from whinfell_pipeline.midwest_calendar_series import (  # noqa: E402
    ADAPTER_VERSION,
    MIN_LIVE_POINTS,
    SERIES_ID,
    build_gpu_crush_calendar_spread_points,
    build_gpu_crush_calendar_spread_series,
    calendar_spread_from_legs,
    current_calendar_spread,
    expand_terminal_calendar_points,
    fwd3m_curve_ratio,
    inject_gpu_crush_calendar_spread_cockpit,
    points_from_spot_index,
    record_to_calendar_spread,
    registry_trade,
)
from whinfell_pipeline.midwest_basis_series import gpu_rental_legs, load_spot_index_from_stub  # noqa: E402
from whinfell_pipeline.rv_history import RV_HISTORY_VERSION, build_rv_history_block, enrich_bundle  # noqa: E402

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"

RENTAL = {"spot": 4.12, "1m_fwd": 4.45, "3m_fwd": 4.78}


def _trading_days(start: date, count: int) -> list[date]:
    out: list[date] = []
    d = start
    while len(out) < count:
        if d.weekday() < 5:
            out.append(d)
        d += timedelta(days=1)
    return out


def _spot_index_live(count: int = MIN_LIVE_POINTS) -> list[dict]:
    """Build spot_index history with explicit 1m/3m legs for calendar spread."""
    days = _trading_days(date(2026, 5, 1), count)
    records: list[dict] = []
    for i, d in enumerate(days):
        spot = round(4.0 + i * 0.01, 2)
        fwd1m = round(spot + 0.33, 2)
        fwd3m = round(fwd1m + 0.33, 2)
        records.append({"date": d.isoformat(), "spot": spot, "1m_fwd": fwd1m, "3m_fwd": fwd3m})
    return records


def _bundle_with_spot_index(count: int = MIN_LIVE_POINTS) -> dict:
    return {
        "as_of": "2026-06-16T12:00:00+00:00",
        "ai_compute": {
            "as_of": "2026-06-16",
            "ornn_h200": {
                "gpu": "H200",
                "rental_usd_per_hr": dict(RENTAL),
                "spot_index": _spot_index_live(count),
            },
        },
    }


def test_registry_trade_links_series():
    trade = registry_trade()
    assert trade.id == "midwest_calendar"
    assert trade.series_id == SERIES_ID
    assert trade.structure_type == "calendar"
    assert trade_for_series(SERIES_ID).id == "midwest_calendar"
    assert trade_for_series("gpu_crush_spread").id == "midwest_calendar"


def test_gpu_compute_calendar_logic():
    bundle = _bundle_with_spot_index(5)
    _, fwd1m, fwd3m = gpu_rental_legs(bundle)
    assert fwd1m == 4.45
    assert fwd3m == 4.78
    assert calendar_spread_from_legs(fwd1m, fwd3m) == 0.33
    assert current_calendar_spread(bundle) == 0.33
    assert round(fwd3m_curve_ratio(bundle), 6) == round(4.78 / 4.45, 6)

    obs, value = record_to_calendar_spread(
        {"date": "2026-06-10", "1m_fwd": 4.45, "3m_fwd": 4.78},
        curve_ratio=None,
    )
    assert obs == "2026-06-10"
    assert value == 0.33

    derived_obs, derived_value = record_to_calendar_spread(
        {"date": "2026-06-11", "1m_fwd": 4.50},
        curve_ratio=4.78 / 4.45,
    )
    assert derived_obs == "2026-06-11"
    assert derived_value == round(4.50 * (4.78 / 4.45) - 4.50, 4)

    index_pts = points_from_spot_index(_spot_index_live(5), curve_ratio=4.78 / 4.45)
    assert len(index_pts) == 5
    assert index_pts[-1]["value"] == 0.33

    expanded = expand_terminal_calendar_points(bundle, 0.33)
    assert len(expanded) >= MIN_LIVE_POINTS
    assert expanded[-1]["value"] == 0.33


def test_build_live_points_and_series_requires_twenty_obs():
    bundle = _bundle_with_spot_index(MIN_LIVE_POINTS)
    points, source = build_gpu_crush_calendar_spread_points(bundle, ROOT)
    assert len(points) >= MIN_LIVE_POINTS
    assert source == "ai_compute_spot_index"
    assert points[-1]["value"] == 0.33

    series = build_gpu_crush_calendar_spread_series(bundle, ROOT)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["bbdm_trade_id"] == "midwest_calendar"
    assert series["data_status"] == "live"
    assert series["source"] == "ai_compute_spot_index"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) >= MIN_LIVE_POINTS


def test_fewer_than_twenty_obs_uses_reconstructed_fallback():
    bundle = _bundle_with_spot_index(5)
    points, source = build_gpu_crush_calendar_spread_points(bundle, ROOT)
    assert source == "ai_compute_reconstructed"
    assert len(points) >= 5

    series = build_gpu_crush_calendar_spread_series(bundle, ROOT)
    assert series is not None
    assert series["data_status"] == "fallback"
    assert series["source"] == "ai_compute_reconstructed"
    assert series["points"][-1]["value"] == 0.33


def test_silicon_stub_discovery_and_parse(tmp_path: Path):
    stub = tmp_path / "silicon_h200_spot_index.json"
    stub.write_text(
        json.dumps({"gpu": "H200", "spot_index": _spot_index_live(MIN_LIVE_POINTS)}),
        encoding="utf-8",
    )
    loaded = load_spot_index_from_stub(stub)
    assert len(loaded) == MIN_LIVE_POINTS

    bundle = {
        "as_of": "2026-06-16",
        "ai_compute": {
            "as_of": "2026-06-16",
            "ornn_h200": {"rental_usd_per_hr": dict(RENTAL)},
        },
    }
    points, source = build_gpu_crush_calendar_spread_points(bundle, ROOT, extra_paths=[stub])
    assert source == "ai_compute_spot_index"
    assert len(points) >= MIN_LIVE_POINTS


def test_inject_cockpit_and_rv_history_block():
    bundle = _bundle_with_spot_index(MIN_LIVE_POINTS)
    series = build_gpu_crush_calendar_spread_series(bundle, ROOT)
    assert series is not None
    assert inject_gpu_crush_calendar_spread_cockpit(bundle, series) is True
    cockpit = bundle["ai_compute"]["rv_basis"]["series"][SERIES_ID]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION
    live = block["series"][SERIES_ID]
    assert live["data_status"] == "live"
    assert live["source"] == "ai_compute_spot_index"
    assert live["bbdm_trade_id"] == "midwest_calendar"
    assert len(live["points"]) >= MIN_LIVE_POINTS


def test_enrich_bundle_wires_live_midwest_calendar():
    enriched = enrich_bundle(_bundle_with_spot_index(MIN_LIVE_POINTS))
    entry = enriched.get("rv_history", {}).get("series", {}).get(SERIES_ID)
    assert entry is not None
    assert entry.get("data_status") == "live"
    assert entry.get("source") == "ai_compute_spot_index"
    assert entry.get("bbdm_trade_id") == "midwest_calendar"
    cockpit = enriched.get("ai_compute", {}).get("rv_basis", {}).get("series", {}).get(SERIES_ID)
    assert cockpit is not None
    assert cockpit.get("data_status") == "live"


def test_enrich_hydration_rv_dry_run_reports_midwest_calendar():
    if not HYDRATION.is_file() or not ENRICH_SCRIPT.is_file():
        return
    proc = subprocess.run(
        [sys.executable, str(ENRICH_SCRIPT), "--dry-run"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    assert "gpu_crush_calendar_spread=" in proc.stdout


def test_fallback_when_spot_index_absent():
    bundle = {
        "as_of": "2026-07-06",
        "ai_compute": {
            "as_of": "2026-07-06",
            "ornn_h200": {"rental_usd_per_hr": dict(RENTAL)},
        },
    }
    series = build_gpu_crush_calendar_spread_series(bundle, ROOT)
    assert series is not None
    assert series["data_status"] == "fallback"
    assert series["source"] == "ai_compute_reconstructed"
    assert len(series["points"]) >= 5
    assert series["points"][-1]["value"] == 0.33


if __name__ == "__main__":
    test_registry_trade_links_series()
    test_gpu_compute_calendar_logic()
    test_build_live_points_and_series_requires_twenty_obs()
    test_fewer_than_twenty_obs_uses_reconstructed_fallback()
    test_inject_cockpit_and_rv_history_block()
    test_enrich_bundle_wires_live_midwest_calendar()
    test_enrich_hydration_rv_dry_run_reports_midwest_calendar()
    test_fallback_when_spot_index_absent()
    print("midwest_calendar_series tests OK")