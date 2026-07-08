#!/usr/bin/env python3
"""Chunk 08 — live btc_basis_spot_1m from Barchart futures-spreads."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.btc_basis_series import (  # noqa: E402
    ADAPTER_VERSION,
    SERIES_ID,
    build_btc_basis_spot_1m_points,
    build_btc_basis_spot_1m_series,
    discover_btc_basis_csv_paths,
    extract_spot_1m_row,
    inject_btc_basis_spot_1m_cockpit,
    parse_barchart_spreads_csv,
)
from whinfell_pipeline.rv_history import build_rv_history_block, enrich_bundle  # noqa: E402

FIXTURE_DIR = ROOT / "tests" / "fixtures" / "btc_basis"
META = ROOT / "data_dictionary_meta.json"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
REF_PRICE = 60_000.0


def test_fixture_discovery():
    paths = discover_btc_basis_csv_paths(ROOT)
    assert len(paths) >= 5
    assert all(p.suffix == ".csv" for p in paths)


def test_parse_spot_1m_row():
    sample = FIXTURE_DIR / "futures-spreads-btm26-06-18-2026.csv"
    parsed = parse_barchart_spreads_csv(sample)
    assert parsed["ok"] is True
    assert parsed["leg1"] == "BTM6"
    assert parsed["leg2"] == "BAN6"
    assert parsed["spread_type"] == "AE"
    assert parsed["spread_latest"] == -295.0
    assert parsed["obs_date"] == "2026-06-18"


def test_extract_spot_1m_row_prefers_ae():
    rows = [
        {"Leg1": "BTM6", "Leg2": "BTN6", "Type": "EQ", "Latest": "299", "Time": "2026-06-18"},
        {"Leg1": "BTM6", "Leg2": "BAN6", "Type": "AE", "Latest": "-295.", "Time": "2026-06-18"},
    ]
    picked = extract_spot_1m_row(rows)
    assert picked is not None
    assert picked["Leg2"] == "BAN6"


def test_build_live_points_and_series():
    bundle = {
        "crypto_sleeve": {
            "assets": {
                "btc_spot_usd": {"price": REF_PRICE},
            }
        }
    }
    points = build_btc_basis_spot_1m_points(bundle, ROOT)
    assert len(points) >= 5
    last = points[-1]
    assert last["date"] == "2026-06-18"
    assert last["value"] == round((-295.0 / REF_PRICE) * 100, 4)

    series = build_btc_basis_spot_1m_series(bundle, ROOT)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["data_status"] == "live"
    assert series["source"] == "barchart_spread_history"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) >= 5


def test_inject_cockpit_and_rv_history_block():
    bundle = {
        "crypto_sleeve": {
            "assets": {
                "btc_spot_usd": {"price": REF_PRICE},
            }
        },
        "as_of": "2026-06-18T12:00:00+00:00",
    }
    series = build_btc_basis_spot_1m_series(bundle, ROOT)
    assert series is not None
    assert inject_btc_basis_spot_1m_cockpit(bundle, series) is True
    cockpit = bundle["node_cockpits"]["basis"]["rv_basis"]["series"]["btc_basis_spot_1m"]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    live = block["series"]["btc_basis_spot_1m"]
    assert live["data_status"] == "live"
    assert live["source"] == "barchart_spread_history"
    assert len(live["points"]) >= 5


def test_enrich_bundle_wires_live_btc_basis():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw)
    entry = enriched.get("rv_history", {}).get("series", {}).get("btc_basis_spot_1m")
    assert entry is not None
    assert entry.get("data_status") == "live"
    assert entry.get("source") == "barchart_spread_history"


def test_dictionary_meta_btc_basis_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("locked_chunk") == "09"
    assert stub.get("btc_basis_module") == "whinfell_pipeline/btc_basis_series.py"
    assert stub.get("btc_basis_version") == ADAPTER_VERSION


if __name__ == "__main__":
    test_fixture_discovery()
    test_parse_spot_1m_row()
    test_extract_spot_1m_row_prefers_ae()
    test_build_live_points_and_series()
    test_inject_cockpit_and_rv_history_block()
    test_enrich_bundle_wires_live_btc_basis()
    test_dictionary_meta_btc_basis_stub()
    print("btc_basis_series tests OK")