#!/usr/bin/env python3
"""Chunk 10 — registry-driven eth_basis_spot_1m from Barchart futures-spreads."""

from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_for_series  # noqa: E402
from whinfell_pipeline.eth_basis_series import (  # noqa: E402
    ADAPTER_VERSION,
    SERIES_ID,
    build_eth_basis_spot_1m_points,
    build_eth_basis_spot_1m_series,
    discover_eth_basis_csv_paths,
    extract_spot_1m_row,
    inject_eth_basis_spot_1m_cockpit,
    parse_barchart_spreads_csv,
    registry_trade,
    spread_row_to_basis_pct,
)
from whinfell_pipeline.rv_history import RV_HISTORY_VERSION, build_rv_history_block, enrich_bundle  # noqa: E402

FIXTURE_DIR = ROOT / "tests" / "fixtures" / "eth_basis"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"
REF_PRICE = 3_500.0


def _write_basis_fixture(path: Path, obs_date: str, spread: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["Leg1", "Leg2", "Leg3", "Leg4", "Type", "Latest", "Change", "Open", "High", "Low", "Previous", "Volume", "Time"]
        )
        writer.writerow(["ETM6", "EAN6", "", "", "AE", f"{int(spread)}.", "0", "0", "", "", "", "N/A", obs_date])


def test_registry_trade_links_series():
    trade = registry_trade()
    assert trade.id == "eth_basis"
    assert trade.series_id == SERIES_ID
    assert trade.structure_type == "basis"
    assert trade_for_series(SERIES_ID).id == "eth_basis"


def test_fixture_discovery():
    paths = discover_eth_basis_csv_paths(ROOT)
    assert len(paths) >= 5
    assert all(p.suffix == ".csv" for p in paths)


def test_parse_spot_1m_row_from_fixture():
    sample = FIXTURE_DIR / "futures-spreads-etm26-06-18-2026.csv"
    parsed = parse_barchart_spreads_csv(sample)
    assert parsed["ok"] is True
    assert parsed["leg1"] == "ETM6"
    assert parsed["leg2"] == "EAN6"
    assert parsed["spread_type"] == "AE"
    assert parsed["spread_latest"] == -18.0
    assert parsed["obs_date"] == "2026-06-18"


def test_extract_spot_1m_row_prefers_ae():
    rows = [
        {"Leg1": "ETM6", "Leg2": "ETN6", "Type": "EQ", "Latest": "12", "Time": "2026-06-18"},
        {"Leg1": "ETM6", "Leg2": "EAN6", "Type": "AE", "Latest": "-18.", "Time": "2026-06-18"},
    ]
    picked = extract_spot_1m_row(rows)
    assert picked is not None
    assert picked["Leg2"] == "EAN6"


def test_spread_row_to_basis_pct():
    row = {"Leg1": "ETM6", "Leg2": "EAN6", "Type": "AE", "Latest": "-18.", "Time": "2026-06-18"}
    obs, value = spread_row_to_basis_pct(row, reference_price=REF_PRICE)
    assert obs == "2026-06-18"
    assert value == round((-18.0 / REF_PRICE) * 100, 4)


def test_build_live_points_and_series():
    bundle = {
        "crypto_sleeve": {
            "assets": {
                "eth_spot_usd": {"price": REF_PRICE},
            }
        }
    }
    points = build_eth_basis_spot_1m_points(bundle, ROOT)
    assert len(points) >= 5
    last = points[-1]
    assert last["date"] == "2026-06-18"
    assert last["value"] == round((-18.0 / REF_PRICE) * 100, 4)

    series = build_eth_basis_spot_1m_series(bundle, ROOT)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["bbdm_trade_id"] == "eth_basis"
    assert series["data_status"] == "live"
    assert series["source"] == "barchart_spread_history"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) >= 5


def test_inject_cockpit_and_rv_history_block():
    bundle = {
        "crypto_sleeve": {
            "assets": {
                "eth_spot_usd": {"price": REF_PRICE},
            }
        },
        "as_of": "2026-06-18T12:00:00+00:00",
    }
    series = build_eth_basis_spot_1m_series(bundle, ROOT)
    assert series is not None
    assert inject_eth_basis_spot_1m_cockpit(bundle, series) is True
    cockpit = bundle["node_cockpits"]["basis"]["rv_basis"]["series"][SERIES_ID]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION
    live = block["series"][SERIES_ID]
    assert live["data_status"] == "live"
    assert live["source"] == "barchart_spread_history"
    assert live["bbdm_trade_id"] == "eth_basis"
    assert len(live["points"]) >= 5


def test_enrich_bundle_wires_live_eth_basis():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw)
    entry = enriched.get("rv_history", {}).get("series", {}).get(SERIES_ID)
    assert entry is not None
    assert entry.get("data_status") == "live"
    assert entry.get("source") == "barchart_spread_history"
    assert entry.get("bbdm_trade_id") == "eth_basis"


def test_enrich_hydration_rv_dry_run_reports_eth_basis():
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
    assert "eth_basis_spot_1m=live" in proc.stdout


def test_tmp_path_parser(tmp_path: Path):
    sample = tmp_path / "futures-spreads-etm26-06-18-2026.csv"
    _write_basis_fixture(sample, "2026-06-18", -18.0)
    parsed = parse_barchart_spreads_csv(sample)
    assert parsed["ok"] is True
    assert parsed["spread_latest"] == -18.0


if __name__ == "__main__":
    test_registry_trade_links_series()
    test_fixture_discovery()
    test_parse_spot_1m_row_from_fixture()
    test_extract_spot_1m_row_prefers_ae()
    test_spread_row_to_basis_pct()
    test_build_live_points_and_series()
    test_inject_cockpit_and_rv_history_block()
    test_enrich_bundle_wires_live_eth_basis()
    test_enrich_hydration_rv_dry_run_reports_eth_basis()
    print("eth_basis_series tests OK")