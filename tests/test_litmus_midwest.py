#!/usr/bin/env python3
"""Chunks 24–25 — Midwest Litmus primary + nice-to-have secondary tables."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.litmus_midwest import (  # noqa: E402
    BUILD_VERSION,
    NICE_TO_HAVE_TICKERS,
    build_midwest_litmus_tables,
    build_midwest_secondary_litmus_tables,
    litmus_rows_from_corporate_gm,
    litmus_rows_from_nice_to_have,
    project_litmus_row,
    regime_signal_from_gm,
    validate_midwest_litmus_tables,
    validate_midwest_secondary_litmus_tables,
)
from bang_bang_da.litmus_schema import MIDWEST_CORPORATE_COLUMNS  # noqa: E402
from whinfell_pipeline.bbdm_report_builder import build_litmus_block  # noqa: E402
from whinfell_pipeline.koyfin_corporate_gm import (  # noqa: E402
    build_corporate_gm_stub,
    merge_csv_into_stub,
)

FIXTURE_CSV = """\
Ticker,Name,Gross Margin %,3yr Avg,3yr Z-Score,Quartile
MSFT,Microsoft Corp,69.8,68.2,1.4,Q1
GOOGL,Alphabet Inc,58.1,57.4,0.6,Q2
AMZN,Amazon.com Inc,48.9,47.5,-0.3,Q3
ORCL,Oracle Corp,72.5,71.0,1.8,Q1
SMCI,Super Micro Computer,15.2,18.4,-2.1,Q4
META,Meta Platforms Inc,81.2,79.5,1.1,Q1
VST,Vistra Corp,32.4,30.1,0.8,Q2
CEG,Constellation Energy Corp,28.6,27.0,-0.5,Q3
NVDA,Nvidia Corp,75.3,73.8,2.2,Q1
"""


def test_regime_signal_from_z_score():
    assert regime_signal_from_gm(2.4, None) == "extreme_rich"
    assert regime_signal_from_gm(1.2, None) == "rich"
    assert regime_signal_from_gm(0.2, None) == "fair"
    assert regime_signal_from_gm(-1.5, None) == "cheap"
    assert regime_signal_from_gm(-2.5, None) == "extreme_cheap"


def test_regime_signal_quartile_fallback():
    assert regime_signal_from_gm(None, "Q1") == "rich"
    assert regime_signal_from_gm(None, "Q4") == "cheap"
    assert regime_signal_from_gm(None, "Q2") == "fair"
    assert regime_signal_from_gm(None, None) is None


def test_project_litmus_row_includes_regime_and_multiplier():
    row = project_litmus_row(
        {
            "company": "Microsoft",
            "segment": "Intelligent Cloud",
            "current_gm_pct": 69.8,
            "avg_gm_3yr": 68.2,
            "gm_z_3yr": 1.4,
            "quartile": "Q1",
            "status": "live",
        }
    )
    assert set(row) == set(MIDWEST_CORPORATE_COLUMNS)
    assert row["cloud_multiplier"] == 1.0
    assert row["regime_signal"] == "rich"


def test_build_midwest_litmus_tables_dual_trade():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        doc = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    tables = build_midwest_litmus_tables(doc)
    assert validate_midwest_litmus_tables(tables) == []
    trade_ids = {table["trade_id"] for table in tables}
    assert trade_ids == {"midwest_basis", "midwest_calendar"}
    assert all(len(table["rows"]) == 5 for table in tables)
    msft_calendar = next(
        row for row in tables[0]["rows"] if row["company"] == "Microsoft"
    )
    assert msft_calendar["current_gm_pct"] == 69.8
    assert msft_calendar["regime_signal"] == "rich"
    smci = next(row for row in tables[1]["rows"] if row["company"] == "Super Micro")
    assert smci["regime_signal"] == "extreme_cheap"


def test_build_midwest_secondary_litmus_tables_nice_to_have():
    doc = build_corporate_gm_stub()
    tables = build_midwest_secondary_litmus_tables(doc)
    assert validate_midwest_secondary_litmus_tables(tables) == []
    assert len(tables) == 2
    assert all(table["tier"] == "secondary" for table in tables)
    assert all(table["collapsed"] is True for table in tables)
    calendar = next(t for t in tables if t["trade_id"] == "midwest_calendar")
    assert len(calendar["rows"]) == len(NICE_TO_HAVE_TICKERS)
    companies = {row["company"] for row in calendar["rows"]}
    assert companies == {"Meta", "Vistra", "Constellation Energy", "Nvidia"}


def test_litmus_rows_from_nice_to_have_live_fixture():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        merged = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    rows = litmus_rows_from_nice_to_have(merged)
    assert len(rows) == 4
    nvda = next(row for row in rows if row["company"] == "Nvidia")
    assert nvda["current_gm_pct"] == 75.3
    assert nvda["regime_signal"] == "extreme_rich"


def test_build_litmus_block_includes_midwest_basis():
    litmus = build_litmus_block(ROOT)
    trade_ids = {table["trade_id"] for table in litmus["tables"] if "midwest" in table["trade_id"]}
    assert "midwest_basis" in trade_ids
    assert "midwest_calendar" in trade_ids
    basis_entry = litmus["by_trade"].get("midwest_basis")
    assert basis_entry is not None
    assert "midwest_basis_primary" in basis_entry["table_ids"]
    assert "midwest_basis_secondary" in basis_entry["table_ids"]
    assert len(litmus.get("midwest_secondary", [])) == 2
    secondary_ids = {table["id"] for table in litmus["midwest_secondary"]}
    assert secondary_ids == {"midwest_calendar_secondary", "midwest_basis_secondary"}


def test_corporate_stub_has_two_table_templates():
    doc = build_corporate_gm_stub()
    assert len(doc["tables"]) == 2
    assert {t["trade_id"] for t in doc["tables"]} == {"midwest_basis", "midwest_calendar"}


def test_litmus_rows_projection_live_fixture():
    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "WTM-Midwest-Corporate-GM.csv"
        csv_path.write_text(FIXTURE_CSV, encoding="utf-8")
        merged = merge_csv_into_stub(build_corporate_gm_stub(), csv_path)
    rows = litmus_rows_from_corporate_gm(merged)
    assert len(rows) == 5
    assert rows[0]["company"] == "Microsoft"
    assert rows[0]["regime_signal"] == "rich"


def main() -> int:
    assert BUILD_VERSION.endswith("chunk25")
    tests = [
        test_regime_signal_from_z_score,
        test_regime_signal_quartile_fallback,
        test_project_litmus_row_includes_regime_and_multiplier,
        test_build_midwest_litmus_tables_dual_trade,
        test_build_midwest_secondary_litmus_tables_nice_to_have,
        test_litmus_rows_from_nice_to_have_live_fixture,
        test_build_litmus_block_includes_midwest_basis,
        test_corporate_stub_has_two_table_templates,
        test_litmus_rows_projection_live_fixture,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_litmus_midwest.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())