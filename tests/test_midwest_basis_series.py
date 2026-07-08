#!/usr/bin/env python3
"""Chunk 12 — registry-driven gpu_basis_spread from ai_compute ornn_h200 spot index."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_for_series  # noqa: E402
from whinfell_pipeline.midwest_basis_series import (  # noqa: E402
    ADAPTER_VERSION,
    SERIES_ID,
    basis_spread_from_legs,
    build_gpu_basis_spread_points,
    build_gpu_basis_spread_series,
    current_basis_spread,
    discover_silicon_stub_paths,
    expand_terminal_basis_points,
    gpu_rental_legs,
    inject_gpu_basis_spread_cockpit,
    load_spot_index_from_stub,
    points_from_spot_index,
    registry_trade,
)
from whinfell_pipeline.rv_history import RV_HISTORY_VERSION, build_rv_history_block, enrich_bundle  # noqa: E402

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"

SPOT_INDEX = [
    {"date": "2026-06-10", "spot": 4.02, "1m_fwd": 4.34},
    {"date": "2026-06-11", "spot": 4.05, "1m_fwd": 4.36},
    {"date": "2026-06-12", "spot": 4.08, "1m_fwd": 4.39},
    {"date": "2026-06-13", "spot": 4.10, "1m_fwd": 4.41},
    {"date": "2026-06-16", "spot": 4.12, "1m_fwd": 4.45},
]


def _bundle_with_spot_index() -> dict:
    return {
        "as_of": "2026-06-16T12:00:00+00:00",
        "ai_compute": {
            "as_of": "2026-06-16",
            "ornn_h200": {
                "gpu": "H200",
                "rental_usd_per_hr": {"spot": 4.12, "1m_fwd": 4.45, "3m_fwd": 4.78},
                "spot_index": SPOT_INDEX,
            },
        },
    }


def test_registry_trade_links_series():
    trade = registry_trade()
    assert trade.id == "midwest_basis"
    assert trade.series_id == SERIES_ID
    assert trade.structure_type == "basis"
    assert trade_for_series(SERIES_ID).id == "midwest_basis"


def test_gpu_compute_builders():
    bundle = _bundle_with_spot_index()
    spot, fwd1m, fwd3m = gpu_rental_legs(bundle)
    assert spot == 4.12
    assert fwd1m == 4.45
    assert fwd3m == 4.78
    assert basis_spread_from_legs(spot, fwd1m) == 0.33
    assert current_basis_spread(bundle) == 0.33

    index_pts = points_from_spot_index(SPOT_INDEX, curve_ratio=fwd1m / spot)
    assert len(index_pts) == 5
    assert index_pts[-1]["value"] == 0.33

    expanded = expand_terminal_basis_points(bundle, 0.33)
    assert len(expanded) >= 5
    assert expanded[-1]["value"] == 0.33


def test_build_live_points_and_series():
    bundle = _bundle_with_spot_index()
    points, source = build_gpu_basis_spread_points(bundle, ROOT)
    assert len(points) >= 5
    assert source == "ai_compute_spot_index"
    assert points[-1]["value"] == 0.33

    series = build_gpu_basis_spread_series(bundle, ROOT)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["bbdm_trade_id"] == "midwest_basis"
    assert series["data_status"] == "live"
    assert series["source"] == "ai_compute_spot_index"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) >= 5


def test_silicon_stub_discovery_and_parse(tmp_path: Path):
    stub = tmp_path / "silicon_h200_spot_index.json"
    stub.write_text(
        json.dumps({"gpu": "H200", "spot_index": SPOT_INDEX}),
        encoding="utf-8",
    )
    loaded = load_spot_index_from_stub(stub)
    assert len(loaded) == 5
    assert loaded[0]["spot"] == 4.02

    bundle = {
        "as_of": "2026-06-16",
        "ai_compute": {
            "as_of": "2026-06-16",
            "ornn_h200": {"rental_usd_per_hr": {"spot": 4.12, "1m_fwd": 4.45}},
        },
    }
    points, source = build_gpu_basis_spread_points(bundle, ROOT, extra_paths=[stub])
    assert source == "ai_compute_spot_index"
    assert len(points) >= 5


def test_inject_cockpit_and_rv_history_block():
    bundle = _bundle_with_spot_index()
    series = build_gpu_basis_spread_series(bundle, ROOT)
    assert series is not None
    assert inject_gpu_basis_spread_cockpit(bundle, series) is True
    cockpit = bundle["ai_compute"]["rv_basis"]["series"][SERIES_ID]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION
    live = block["series"][SERIES_ID]
    assert live["data_status"] == "live"
    assert live["source"] == "ai_compute_spot_index"
    assert live["bbdm_trade_id"] == "midwest_basis"
    assert len(live["points"]) >= 5


def test_enrich_bundle_wires_live_midwest_basis():
    enriched = enrich_bundle(_bundle_with_spot_index())
    entry = enriched.get("rv_history", {}).get("series", {}).get(SERIES_ID)
    assert entry is not None
    assert entry.get("data_status") == "live"
    assert entry.get("source") == "ai_compute_spot_index"
    assert entry.get("bbdm_trade_id") == "midwest_basis"
    cockpit = enriched.get("ai_compute", {}).get("rv_basis", {}).get("series", {}).get(SERIES_ID)
    assert cockpit is not None
    assert cockpit.get("data_status") == "live"


def test_enrich_hydration_rv_dry_run_reports_midwest_basis():
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
    assert "gpu_basis_spread=" in proc.stdout


def test_fallback_when_spot_index_absent():
    bundle = {
        "as_of": "2026-07-06",
        "ai_compute": {
            "as_of": "2026-07-06",
            "ornn_h200": {"rental_usd_per_hr": {"spot": 4.12, "1m_fwd": 4.45, "3m_fwd": 4.78}},
        },
    }
    series = build_gpu_basis_spread_series(bundle, ROOT)
    assert series is not None
    assert series["data_status"] == "fallback"
    assert series["source"] == "ai_compute_reconstructed"
    assert len(series["points"]) >= 5
    assert series["points"][-1]["value"] == 0.33


def test_discover_silicon_stub_paths_is_list():
    paths = discover_silicon_stub_paths(ROOT)
    assert isinstance(paths, list)


if __name__ == "__main__":
    test_registry_trade_links_series()
    test_gpu_compute_builders()
    test_build_live_points_and_series()
    test_inject_cockpit_and_rv_history_block()
    test_enrich_bundle_wires_live_midwest_basis()
    test_enrich_hydration_rv_dry_run_reports_midwest_basis()
    test_fallback_when_spot_index_absent()
    print("midwest_basis_series tests OK")