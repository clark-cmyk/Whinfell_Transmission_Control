#!/usr/bin/env python3
"""Chunk 09 — registry-driven btc_calendar_bt_near_deferred from Barchart spreads."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_for_series  # noqa: E402
from whinfell_pipeline.btc_calendar_series import (  # noqa: E402
    ADAPTER_VERSION,
    SERIES_ID,
    build_btc_calendar_points,
    build_btc_calendar_series,
    extract_near_deferred_row,
    inject_btc_calendar_cockpit,
    parse_barchart_calendar_csv,
    registry_trade,
    spread_row_to_calendar_pct,
)
from whinfell_pipeline.rv_history import build_rv_history_block, enrich_bundle  # noqa: E402

FIXTURE_DIR = ROOT / "tests" / "fixtures" / "btc_basis"
META = ROOT / "data_dictionary_meta.json"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
REF_PRICE = 60_000.0


def _write_calendar_fixture(path: Path, obs_date: str, spread: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["Leg1", "Leg2", "Leg3", "Leg4", "Type", "Latest", "Change", "Open", "High", "Low", "Previous", "Volume", "Time"]
        )
        writer.writerow(["BTM6", "BAN6", "", "", "AE", f"{int(spread - 50)}.", "0", "0", "", "", "", "N/A", obs_date])
        writer.writerow(["BTM6", "BTQ6", "", "", "AE", f"{int(spread)}.", "0", "0", "", "", "", "N/A", obs_date])


def test_registry_trade_links_series():
    trade = registry_trade()
    assert trade.id == "btc_calendar"
    assert trade.series_id == SERIES_ID
    assert trade.structure_type == "calendar"
    assert trade_for_series(SERIES_ID).id == "btc_calendar"


def test_extract_near_deferred_row_prefers_ae():
    rows = [
        {"Leg1": "BTM6", "Leg2": "BAN6", "Type": "AE", "Latest": "-295.", "Time": "2026-06-18"},
        {"Leg1": "BTM6", "Leg2": "BTQ6", "Type": "AE", "Latest": "750.", "Time": "2026-06-18"},
    ]
    picked = extract_near_deferred_row(rows)
    assert picked is not None
    assert picked["Leg2"] == "BTQ6"


def test_parse_calendar_csv_from_fixture(tmp_path: Path):
    sample = tmp_path / "futures-spreads-btm26-06-18-2026.csv"
    _write_calendar_fixture(sample, "2026-06-18", 750.0)
    parsed = parse_barchart_calendar_csv(sample)
    assert parsed["ok"] is True
    assert parsed["leg1"] == "BTM6"
    assert parsed["leg2"] == "BTQ6"
    assert parsed["spread_type"] == "AE"
    assert parsed["spread_latest"] == 750.0
    assert parsed["obs_date"] == "2026-06-18"


def test_spread_row_to_calendar_pct():
    row = {"Leg1": "BTM6", "Leg2": "BTQ6", "Type": "AE", "Latest": "750.", "Time": "2026-06-18"}
    obs, value = spread_row_to_calendar_pct(row, reference_price=REF_PRICE)
    assert obs == "2026-06-18"
    assert value == round((750.0 / REF_PRICE) * 100, 4)


def test_build_live_points_and_series(tmp_path: Path):
    dates = ["2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"]
    spreads = [720.0, 735.0, 750.0, 765.0, 750.0]
    extra_paths = []
    for d, spread in zip(dates, spreads):
        p = tmp_path / f"futures-spreads-btm26-{d}.csv"
        _write_calendar_fixture(p, d, spread)
        extra_paths.append(p)

    bundle = {
        "crypto_sleeve": {
            "assets": {
                "btc_spot_usd": {"price": REF_PRICE},
            }
        }
    }
    points = build_btc_calendar_points(bundle, ROOT, extra_paths=extra_paths)
    assert len(points) == 5
    assert points[-1]["date"] == "2026-06-18"
    assert points[-1]["value"] == round((750.0 / REF_PRICE) * 100, 4)

    series = build_btc_calendar_series(bundle, ROOT, extra_paths=extra_paths)
    assert series is not None
    assert series["series_id"] == SERIES_ID
    assert series["bbdm_trade_id"] == "btc_calendar"
    assert series["data_status"] == "live"
    assert series["source"] == "barchart_spread_history"
    assert series["adapter_version"] == ADAPTER_VERSION
    assert len(series["points"]) == 5


def test_inject_cockpit_and_rv_history_block(tmp_path: Path):
    dates = ["2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"]
    spreads = [720.0, 735.0, 750.0, 765.0, 750.0]
    extra_paths = []
    for d, spread in zip(dates, spreads):
        p = tmp_path / f"futures-spreads-btm26-{d}.csv"
        _write_calendar_fixture(p, d, spread)
        extra_paths.append(p)

    bundle = {
        "crypto_sleeve": {
            "assets": {
                "btc_spot_usd": {"price": REF_PRICE},
            }
        },
        "as_of": "2026-06-18T12:00:00+00:00",
    }
    series = build_btc_calendar_series(bundle, ROOT, extra_paths=extra_paths)
    assert series is not None
    assert inject_btc_calendar_cockpit(bundle, series) is True
    cockpit = bundle["node_cockpits"]["basis"]["rv_basis"]["series"][SERIES_ID]
    assert cockpit["data_status"] == "live"
    assert cockpit["horizons"]["1m"]["current_value"] == series["points"][-1]["value"]

    block = build_rv_history_block(bundle)
    live = block["series"][SERIES_ID]
    assert live["data_status"] == "live"
    assert live["source"] == "barchart_spread_history"
    assert live["bbdm_trade_id"] == "btc_calendar"
    assert len(live["points"]) == 5


def test_fixture_dir_calendar_rows():
    sample = FIXTURE_DIR / "futures-spreads-btm26-06-18-2026.csv"
    if not sample.is_file():
        return
    parsed = parse_barchart_calendar_csv(sample)
    assert parsed.get("ok") is True
    assert parsed.get("leg2") == "BTQ6"


def test_enrich_bundle_wires_live_btc_calendar():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw)
    entry = enriched.get("rv_history", {}).get("series", {}).get(SERIES_ID)
    assert entry is not None
    if entry.get("data_status") == "live":
        assert entry.get("source") == "barchart_spread_history"
        assert entry.get("bbdm_trade_id") == "btc_calendar"


def test_dictionary_meta_btc_calendar_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("locked_chunk") == "09"
    assert stub.get("btc_calendar_module") == "whinfell_pipeline/btc_calendar_series.py"
    assert stub.get("btc_calendar_version") == ADAPTER_VERSION
    assert stub.get("btc_calendar_series_id") == SERIES_ID
    assert stub.get("rv_history_version") == "2.0.0-chunk09"


if __name__ == "__main__":
    test_registry_trade_links_series()
    test_extract_near_deferred_row_prefers_ae()
    test_parse_calendar_csv_from_fixture(Path("/tmp"))
    test_spread_row_to_calendar_pct()
    print("btc_calendar_series tests OK")