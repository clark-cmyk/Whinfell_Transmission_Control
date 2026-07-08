#!/usr/bin/env python3
"""Chunk 11 — registry-driven eth_calendar_et_near_deferred from Barchart spreads."""

from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_for_series  # noqa: E402
from whinfell_pipeline.eth_calendar_series import (  # noqa: E402
    ADAPTER_VERSION,
    SERIES_ID,
    build_eth_calendar_points,
    build_eth_calendar_series,
    discover_eth_calendar_csv_paths,
    extract_near_deferred_row,
    inject_eth_calendar_cockpit,
    parse_barchart_calendar_csv,
    registry_trade,
    spread_row_to_calendar_pct,
)
from whinfell_pipeline.rv_history import RV_HISTORY_VERSION, build_rv_history_block, enrich_bundle  # noqa: E402

FIXTURE_DIR = ROOT / "tests" / "fixtures" / "eth_basis"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"
REF_PRICE = 3_500.0


def _write_calendar_fixture(path: Path, obs_date: str, spread: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["Leg1", "Leg2", "Leg3", "Leg4", "Type", "Latest", "Change", "Open", "High", "Low", "Previous", "Volume", "Time"]
        )
        writer.writerow(["ETM6", "EAN6", "", "", "AE", f"{int(spread - 2)}.", "0", "0", "", "", "", "N/A", obs_date])
        writer.writerow(["ETM6", "ETQ6", "", "", "AE", f"{int(spread)}.", "0", "0", "", "", "", "N/A", obs_date])


def test_registry_trade_links_series():
    trade = registry_trade()
    assert trade.id == "eth_calendar"
    assert trade.series_id == SERIES_ID
    assert trade.structure_type == "calendar"
    assert trade_for_series(SERIES_ID).id == "eth_calendar"


def test_fixture_discovery():
    paths = discover_eth_calendar_csv_paths(ROOT)
    assert len(paths) >= 5
    assert all(p.suffix == ".csv" for p in paths)


def test_extract_near_deferred_row_prefers_ae():
    rows = [
        {"Leg1": "ETM6", "Leg2": "EAN6", "Type": "AE", "Latest": "-18.", "Time": "2026-06-18"},
        {"Leg1": "ETM6", "Leg2": "ETQ6", "Type": "AE", "Latest": "44.", "Time": "2026-06-18"},
    ]
    picked = extract_near_deferred_row(rows)
    assert picked is not None
    assert picked["Leg2"] == "ETQ6"


def test_parse_calendar_csv_from_fixture(tmp_path: Path):
    sample = tmp_path / "futures-spreads-etm26-06-18-2026.csv"
    _write_calendar_fixture(sample, "2026-06-18", 44.0)
    parsed = parse_barchart_calendar_csv(sample)
    assert parsed["ok"] is True
    assert parsed["leg1"] == "ETM6"
    assert parsed["leg2"] == "ETQ6"
    assert parsed["spread_type"] == "AE"
    assert parsed["spread_latest"] == 44.0
    assert parsed["obs_date"] == "2026-06-18"


def test_spread_row_to_calendar_pct():
    row = {"Leg1": "ETM6", "Leg2": "ETQ6", "Type": "AE", "Latest": "44.", "Time": "2026-06-18"}
    obs, value = spread_row_to_calendar_pct(row, reference_price=REF_PRICE)
    assert obs == "2026-06-18"
    assert value == round((44.0 / REF_PRICE) * 100, 4)


def test_build_live_points_and_series(tmp_path: Path):
    dates = ["2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"]
    spreads = [42.0, 43.0, 44.0, 45.0, 44.0]
    extra_paths = []
    for d, spread in zip(dates, spreads):
        p = tmp_path / f"futures-spreads-etm26-{d}.csv"
        _write_calendar_fixture(p, d, spread)
        extra_paths.append(p)

    bundle = {
        "crypto_sleeve": {
            "assets": {
                "eth_spot_usd": {"price": REF_PRICE},
            }
        }
    }
    points = build_eth_calendar_points(bundle, ROOT, extra_paths=extra_paths)
    assert len(points) == 5
    assert points[-1]["date"] == "2026-06-18"
    assert points[-1]["value"] == round((44.0 / REF_PRICE) * 100, 4)

    series = build_eth_calendar_series(bundle, ROOT, extra_paths=extra_paths)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["bbdm_trade_id"] == "eth_calendar"
    assert series["data_status"] == "live"
    assert series["source"] == "barchart_spread_history"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) == 5


def test_inject_cockpit_and_rv_history_block(tmp_path: Path):
    dates = ["2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"]
    spreads = [42.0, 43.0, 44.0, 45.0, 44.0]
    extra_paths = []
    for d, spread in zip(dates, spreads):
        p = tmp_path / f"futures-spreads-etm26-{d}.csv"
        _write_calendar_fixture(p, d, spread)
        extra_paths.append(p)

    bundle = {
        "crypto_sleeve": {
            "assets": {
                "eth_spot_usd": {"price": REF_PRICE},
            }
        },
        "as_of": "2026-06-18T12:00:00+00:00",
    }
    series = build_eth_calendar_series(bundle, ROOT, extra_paths=extra_paths)
    assert series is not None
    assert inject_eth_calendar_cockpit(bundle, series) is True
    cockpit = bundle["node_cockpits"]["basis"]["rv_basis"]["series"][SERIES_ID]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION
    live = block["series"][SERIES_ID]
    assert live["data_status"] == "live"
    assert live["source"] == "barchart_spread_history"
    assert live["bbdm_trade_id"] == "eth_calendar"
    assert len(live["points"]) == 5


def test_fixture_dir_calendar_rows():
    sample = FIXTURE_DIR / "futures-spreads-etm26-06-18-2026.csv"
    if not sample.is_file():
        return
    parsed = parse_barchart_calendar_csv(sample)
    assert parsed.get("ok") is True
    assert parsed.get("leg2") == "ETQ6"


def test_enrich_bundle_wires_live_eth_calendar():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw)
    entry = enriched.get("rv_history", {}).get("series", {}).get(SERIES_ID)
    assert entry is not None
    assert entry.get("data_status") == "live"
    assert entry.get("source") == "barchart_spread_history"
    assert entry.get("bbdm_trade_id") == "eth_calendar"


def test_enrich_hydration_rv_dry_run_reports_eth_calendar_live():
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
    assert "eth_calendar_et_near_deferred=live" in proc.stdout


if __name__ == "__main__":
    test_registry_trade_links_series()
    test_fixture_discovery()
    test_extract_near_deferred_row_prefers_ae()
    test_spread_row_to_calendar_pct()
    test_build_live_points_and_series(Path("/tmp"))
    print("eth_calendar_series tests OK")