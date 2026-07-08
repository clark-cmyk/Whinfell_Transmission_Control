#!/usr/bin/env python3
"""Chunk 23 — Litmus table schema + column registry tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import validate_report  # noqa: E402
from bang_bang_da.litmus_schema import (  # noqa: E402
    CURVE_2S10S_COLUMNS,
    LITMUS_COLUMN_REGISTRY,
    MARKET_SIGNAL_COLUMNS,
    MIDWEST_CORPORATE_COLUMNS,
    TABLE_PROFILES,
    column_label,
    is_editable_column,
    profile_for_columns,
    validate_litmus_table,
)

FIXTURE = ROOT / "tests" / "fixtures" / "bbdm_report_v2_min.json"
REPORT = ROOT / "bang_bang_da" / "bang_bang_da_report.json"


def test_column_registry_covers_profiles():
    for profile in TABLE_PROFILES.values():
        for col in profile["columns"]:
            assert col in LITMUS_COLUMN_REGISTRY, f"missing registry entry for {col}"


def test_midwest_profile_matches_chunk16_columns():
    assert list(MIDWEST_CORPORATE_COLUMNS) == list(TABLE_PROFILES["midwest_corporate"]["columns"])
    assert profile_for_columns(list(MIDWEST_CORPORATE_COLUMNS)) == "midwest_corporate"


def test_market_signals_profile_matches_chunk17():
    assert list(MARKET_SIGNAL_COLUMNS) == list(TABLE_PROFILES["market_signals"]["columns"])
    assert profile_for_columns(list(MARKET_SIGNAL_COLUMNS)) == "market_signals"


def test_cloud_multiplier_editable():
    assert is_editable_column("cloud_multiplier") is True
    assert is_editable_column("company") is False
    assert column_label("cloud_multiplier") == "Cloud Multiplier"


def test_fixture_litmus_table_validates():
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    errors: list[str] = []
    for idx, table in enumerate(report["litmus"]["tables"]):
        validate_litmus_table(table, errors, path=f"litmus.tables[{idx}]")
    assert errors == [], errors


def test_full_report_litmus_tables_validate():
    if not REPORT.is_file():
        return
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    errors: list[str] = []
    for idx, table in enumerate(report.get("litmus", {}).get("tables", [])):
        validate_litmus_table(table, errors, path=f"litmus.tables[{idx}]")
    assert errors == [], errors


def test_unknown_column_rejected():
    errors: list[str] = []
    validate_litmus_table(
        {
            "id": "bad_table",
            "trade_id": "btc_basis",
            "title": "Bad",
            "columns": ["not_a_real_column"],
            "rows": [],
        },
        errors,
    )
    assert any("unknown column" in err for err in errors)


def test_trade_profile_mismatch_rejected():
    errors: list[str] = []
    validate_litmus_table(
        {
            "id": "bad_trade",
            "trade_id": "sofr_fed_funds",
            "title": "Mismatch",
            "columns": list(MARKET_SIGNAL_COLUMNS),
            "rows": [],
        },
        errors,
    )
    assert any("incompatible with profile" in err for err in errors)


def test_report_schema_uses_litmus_profiles():
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    errors = validate_report(report, strict_trade_count=False)
    assert errors == [], errors


def test_rates_profiles_locked_for_later_chunks():
    assert "spread_bps" in CURVE_2S10S_COLUMNS
    assert profile_for_columns(list(CURVE_2S10S_COLUMNS)) == "curve_2s10s"


if __name__ == "__main__":
    test_column_registry_covers_profiles()
    test_midwest_profile_matches_chunk16_columns()
    test_market_signals_profile_matches_chunk17()
    test_cloud_multiplier_editable()
    test_fixture_litmus_table_validates()
    test_full_report_litmus_tables_validate()
    test_unknown_column_rejected()
    test_trade_profile_mismatch_rejected()
    test_report_schema_uses_litmus_profiles()
    test_rates_profiles_locked_for_later_chunks()
    print("litmus_schema tests OK")