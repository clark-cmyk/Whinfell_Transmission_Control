#!/usr/bin/env python3
"""Chunk 16 — Koyfin corporate GM% Litmus stub adapter tests."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.litmus_midwest import litmus_rows_from_corporate_gm  # noqa: E402
from whinfell_pipeline.koyfin_corporate_gm import (  # noqa: E402
    ADAPTER_VERSION,
    DEFAULT_OUT,
    EXPORT_ID,
    LITMUS_COLUMNS,
    NICE_TO_HAVE_TICKERS,
    PRIMARY_TICKERS,
    SAVED_VIEW,
    SCHEMA_VERSION,
    WATCHLIST_URL,
    build_corporate_gm_stub,
    discover_koyfin_csv,
    ingest_corporate_gm,
    load_watchlist_url,
    merge_csv_into_stub,
    parse_koyfin_watchlist_csv,
    validate_corporate_gm_doc,
    write_corporate_gm_stub,
)

FIXTURE_CSV = """\
Ticker,Name,Gross Margin %,3yr Avg,3yr Z-Score,Quartile
MSFT,Microsoft Corp,69.8,68.2,1.4,Q1
GOOGL,Alphabet Inc,58.1,57.4,0.6,Q2
AMZN,Amazon.com Inc,48.9,47.5,-0.3,Q3
ORCL,Oracle Corp,72.5,71.0,1.8,Q1
SMCI,Super Micro Computer,15.2,18.4,-2.1,Q4
"""


def test_watchlist_url_wired():
    url = load_watchlist_url(ROOT / "whinfell_pipeline")
    assert "790f7aab-ba98-43df-9807-78b01c779a29" in url
    doc = build_corporate_gm_stub()
    assert doc["lineage"]["watchlist_url"] == url
    assert WATCHLIST_URL in url


def test_build_stub_contract():
    doc = build_corporate_gm_stub(as_of="2026-07-07T12:00:00+00:00")
    assert doc["schema_version"] == SCHEMA_VERSION
    assert doc["adapter_version"] == ADAPTER_VERSION
    assert doc["data_status"] == "stub"
    assert doc["source"] == "koyfin"
    assert doc["export_id"] == EXPORT_ID
    assert doc["saved_view"] == SAVED_VIEW
    assert doc["trade_ids"] == ["midwest_basis", "midwest_calendar"]
    assert len(doc["tables"]) == 2
    assert doc["tables"][0]["columns"] == list(LITMUS_COLUMNS)
    assert len(doc["rows"]) == len(PRIMARY_TICKERS)
    assert [row["ticker"] for row in doc["rows"]] == [m["ticker"] for m in PRIMARY_TICKERS]
    for row in doc["rows"]:
        assert row["current_gm_pct"] is None
        assert row["avg_gm_3yr"] is None
        assert row["gm_z_3yr"] is None
        assert row["quartile"] is None
        assert row["cloud_multiplier"] == 1.0
        assert row["status"] == "pending_koyfin"
    assert len(doc["nice_to_have"]) == len(NICE_TO_HAVE_TICKERS)
    assert [row["ticker"] for row in doc["nice_to_have"]] == [
        meta["ticker"] for meta in NICE_TO_HAVE_TICKERS
    ]


def test_validate_stub_doc_passes():
    doc = build_corporate_gm_stub()
    assert validate_corporate_gm_doc(doc) == []


def test_committed_stub_file_matches_contract():
    assert DEFAULT_OUT.is_file(), f"missing committed stub {DEFAULT_OUT}"
    doc = json.loads(DEFAULT_OUT.read_text(encoding="utf-8"))
    assert validate_corporate_gm_doc(doc) == []
    # stub until Collect maps a Koyfin Midwest GM CSV; live/partial after ingest
    assert doc["data_status"] in {"stub", "partial", "live"}


def test_parse_koyfin_watchlist_csv():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        parsed = parse_koyfin_watchlist_csv(csv_path)
    assert set(parsed) == {"MSFT", "GOOGL", "AMZN", "ORCL", "SMCI"}
    assert parsed["MSFT"]["current_gm_pct"] == 69.8
    assert parsed["MSFT"]["avg_gm_3yr"] == 68.2
    assert parsed["MSFT"]["gm_z_3yr"] == 1.4
    assert parsed["MSFT"]["quartile"] == "Q1"
    assert parsed["SMCI"]["current_gm_pct"] == 15.2


# Live Koyfin WTM-Midwest-Corporate-GM headers (fraction scale, LTM GM column)
REAL_KOYFIN_CSV = """\
Ticker,Name,Gross Profit Margin % (LTM),Gross Profit Margin % (FQ),Gross Profit Margin % (FY),GM % - Est Avg (FY2E)
MSFT,Microsoft Corporation,0.6831,0.6763,0.6882,0.6660
GOOGL,Alphabet Inc.,0.6037,0.6245,0.5965,0.6128
AMZN,Amazon.com Inc.,0.5060,0.5182,0.5029,0.5243
ORCL,Oracle Corporation,0.6582,0.6523,0.6582,0.5476
SMCI,Super Micro Computer Inc.,0.0839,0.0995,0.1106,0.0831
"""


def test_parse_real_koyfin_export_headers():
    """Real Koyfin watchlist uses Gross Profit Margin % (LTM) as 0–1 fractions."""
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "koyfin_WTM-Midwest-Corporate-GM_2026.07.08.csv"
        csv_path.write_text(REAL_KOYFIN_CSV, encoding="utf-8")
        parsed = parse_koyfin_watchlist_csv(csv_path)
    assert parsed["MSFT"]["current_gm_pct"] == 68.31
    assert parsed["SMCI"]["current_gm_pct"] == 8.39
    # avg falls back to FY2E estimate or FY margin aliases
    assert parsed["MSFT"]["avg_gm_3yr"] == 66.6


def test_discover_canonical_midwest_corporate_gm_name():
    """After normalize, drop holds midwest_corporate_gm_YYYYMMDD_HHMM.csv."""
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp)
        csv_path = drop / "midwest_corporate_gm_20260708_0955.csv"
        csv_path.write_text(REAL_KOYFIN_CSV, encoding="utf-8")
        found = discover_koyfin_csv(drop)
    assert found is not None
    assert found.name.startswith("midwest_corporate_gm_")


def test_merge_csv_into_stub_promotes_live_status():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "koyfin_WTM-Midwest-Corporate-GM_2026.07.07.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        merged = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    assert merged["data_status"] == "live"
    assert merged["lineage"]["drop_file"] == str(csv_path)
    assert merged["lineage"]["live_primary_count"] == 5
    msft = next(row for row in merged["rows"] if row["ticker"] == "MSFT")
    assert msft["current_gm_pct"] == 69.8
    assert msft["status"] == "live"


def test_merge_real_koyfin_fills_right_half_columns():
    """Live Koyfin LTM GM export lacks z/quartile — derive full Litmus right half."""
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "koyfin_WTM-Midwest-Corporate-GM_2026.07.08.csv"
        csv_path.write_text(REAL_KOYFIN_CSV, encoding="utf-8")
        merged = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    assert merged["data_status"] == "live"
    msft = next(row for row in merged["rows"] if row["ticker"] == "MSFT")
    assert msft["current_gm_pct"] == 68.31
    assert msft["gm_z_3yr"] is not None
    assert msft["quartile"] in {"Q1", "Q2", "Q3", "Q4"}
    assert msft["cloud_multiplier"] == 1.0
    assert msft["regime_signal"] in {
        "extreme_rich",
        "rich",
        "fair",
        "cheap",
        "extreme_cheap",
    }
    assert msft["status"] == "live"
    # All primary right-half cells hydrated
    for row in merged["rows"]:
        assert row["gm_z_3yr"] is not None
        assert row["quartile"] is not None
        assert row["cloud_multiplier"] == 1.0
        assert row["regime_signal"] is not None
        assert row["status"] == "live"


def test_discover_koyfin_csv_prefers_newest():
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp)
        older = drop / "WTM-Midwest-Corporate-GM.csv"
        newer = drop / "koyfin_WTM-Midwest-Corporate-GM_2026.07.07.csv"
        older.write_text("Ticker\nMSFT\n", encoding="utf-8")
        newer.write_text(FIXTURE_CSV, encoding="utf-8")
        older_ts = older.stat().st_mtime
        newer_ts = newer.stat().st_mtime
        if newer_ts <= older_ts:
            newer.write_text(FIXTURE_CSV + "\n", encoding="utf-8")
        found = discover_koyfin_csv(drop)
    assert found is not None
    assert found.name.startswith("koyfin_WTM-Midwest-Corporate-GM")


def test_ingest_without_csv_writes_stub():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "corporate_gm.json"
        drop = Path(tmp) / "empty_drop"
        drop.mkdir()
        doc = ingest_corporate_gm(drop, out_path=out)
        assert out.is_file()
        assert doc["data_status"] == "stub"
        assert validate_corporate_gm_doc(json.loads(out.read_text(encoding="utf-8"))) == []


def test_ingest_with_csv_writes_live_doc():
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp)
        csv_path = drop / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        out = drop / "corporate_gm.json"
        doc = ingest_corporate_gm(drop, out_path=out)
        assert doc["data_status"] == "live"
        saved = json.loads(out.read_text(encoding="utf-8"))
        assert saved["rows"][0]["status"] == "live"


def test_litmus_rows_projection():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        merged = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    rows = litmus_rows_from_corporate_gm(merged)
    assert len(rows) == 5
    assert set(rows[0]) == set(LITMUS_COLUMNS)
    assert rows[0]["company"] == "Microsoft"
    assert rows[0]["regime_signal"] == "rich"


def test_write_corporate_gm_stub_roundtrip():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "corporate_gm.json"
        path = write_corporate_gm_stub(out, as_of="2026-07-07T00:00:00+00:00")
        doc = json.loads(path.read_text(encoding="utf-8"))
        assert path == out
        assert doc["as_of"] == "2026-07-07T00:00:00+00:00"
        assert validate_corporate_gm_doc(doc) == []


def main() -> int:
    tests = [
        test_watchlist_url_wired,
        test_build_stub_contract,
        test_validate_stub_doc_passes,
        test_committed_stub_file_matches_contract,
        test_parse_koyfin_watchlist_csv,
        test_parse_real_koyfin_export_headers,
        test_discover_canonical_midwest_corporate_gm_name,
        test_merge_csv_into_stub_promotes_live_status,
        test_merge_real_koyfin_fills_right_half_columns,
        test_discover_koyfin_csv_prefers_newest,
        test_ingest_without_csv_writes_stub,
        test_ingest_with_csv_writes_live_doc,
        test_litmus_rows_projection,
        test_write_corporate_gm_stub_roundtrip,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_koyfin_corporate_gm_stub.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())