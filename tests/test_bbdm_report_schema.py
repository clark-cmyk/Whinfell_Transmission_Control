#!/usr/bin/env python3
"""Chunk 02 — BBDM v2.0 report schema lock tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import (  # noqa: E402
    ARTICULATOR_SOURCES,
    BBDM_VERSION,
    INSPECTION_CHECK_IDS,
    RISK_DASHBOARD_SCORES,
    SIZING_BUCKETS,
    SIZING_MULTIPLIERS,
    TRADE_IDS_V2,
    validate_report,
)

FIXTURE = ROOT / "tests" / "fixtures" / "bbdm_report_v2_min.json"
META = ROOT / "data_dictionary_meta.json"


def test_fixture_exists_and_validates_min_mode():
    assert FIXTURE.is_file(), f"missing fixture {FIXTURE}"
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    errors = validate_report(report, strict_trade_count=False)
    assert errors == [], f"fixture schema errors: {errors}"


def test_fixture_version_and_v2_blocks():
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    assert report["bang_bang_da_version"] == BBDM_VERSION
    for block in ("risk_dashboard", "litmus", "articulator", "inspection"):
        assert block in report, f"missing root block {block}"
    trade = report["trades"][0]
    assert trade["recommendation"]["sizing_bucket"] in SIZING_BUCKETS


def test_dictionary_meta_stub():
    assert META.is_file(), f"missing {META}"
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report")
    assert stub, "data_dictionary_meta.json missing bbdm_report stub"
    assert stub["version"] == BBDM_VERSION
    assert stub["fixture"] == "tests/fixtures/bbdm_report_v2_min.json"
    assert stub["sizing_buckets"] == list(SIZING_BUCKETS)
    assert stub["risk_dashboard_scores"] == list(RISK_DASHBOARD_SCORES)


def test_schema_constants_locked():
    assert len(TRADE_IDS_V2) == 8
    assert set(SIZING_MULTIPLIERS.keys()) == set(SIZING_BUCKETS)
    assert set(INSPECTION_CHECK_IDS) == {
        "data_live",
        "z_computed",
        "litmus_loaded",
        "articulator_fresh",
        "scores_present",
    }
    assert set(ARTICULATOR_SOURCES) == {"grok", "comet", "stub"}


def test_invalid_version_rejected():
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    report["bang_bang_da_version"] = "1.2.0"
    errors = validate_report(report, strict_trade_count=False)
    assert any("bang_bang_da_version" in err for err in errors)


def test_invalid_sizing_multiplier_rejected():
    report = json.loads(FIXTURE.read_text(encoding="utf-8"))
    report["trades"][0]["recommendation"]["sizing_multiplier"] = 99
    errors = validate_report(report, strict_trade_count=False)
    assert any("sizing_multiplier" in err for err in errors)


if __name__ == "__main__":
    test_fixture_exists_and_validates_min_mode()
    test_fixture_version_and_v2_blocks()
    test_dictionary_meta_stub()
    test_schema_constants_locked()
    test_invalid_version_rejected()
    test_invalid_sizing_multiplier_rejected()
    print("bbdm_report_schema tests OK")