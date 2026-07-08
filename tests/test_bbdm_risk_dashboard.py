#!/usr/bin/env python3
"""Chunk 05 — BBDM v2 risk dashboard contract lock tests."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bang_bang_da.bbdm_report_schema import (  # noqa: E402
    RISK_DASHBOARD_SCORES,
    RISK_ZONES,
    validate_risk_dashboard as validate_risk_dashboard_schema,
)
from whinfell_pipeline.bbdm_risk_dashboard import (  # noqa: E402
    FALLBACK_SOURCE_LABEL,
    RISK_DASHBOARD_VERSION,
    SOURCE_LABELS,
    build_risk_dashboard,
    extract_combined,
    extract_sq3,
    extract_whinfell_ex_china,
    fallback_global_only_score,
    score_zone,
    validate_risk_dashboard_contract,
)

META = ROOT / "data_dictionary_meta.json"
HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
FIXTURE = ROOT / "tests" / "fixtures" / "bbdm_report_v2_min.json"


def test_risk_dashboard_contract_validates():
    errors = validate_risk_dashboard_contract()
    assert errors == [], f"contract errors: {errors}"


@pytest.mark.parametrize(
    "score,expected",
    [
        (None, None),
        (38.0, "red"),
        (49.99, "red"),
        (50.0, "amber"),
        (52.0, "amber"),
        (64.99, "amber"),
        (65.0, "green"),
        (80.0, "green"),
    ],
)
def test_score_zone_bands(score, expected):
    assert score_zone(score) == expected


def test_extract_combined_primary_and_fallback():
    primary, src = extract_combined({"global": {"whinfell_score": 38}})
    assert primary == 38.0
    assert src == "global.whinfell_score"

    fallback, src2 = extract_combined({"margin_rules": {"whinfell_score": 55}})
    assert fallback == 55.0
    assert src2 == "margin_rules.whinfell_score"


def test_extract_sq3_prefers_china():
    score, src = extract_sq3({"china": {"sq3_score": 61}, "global": {"sq3_score": 40}})
    assert score == 61.0
    assert src == "china.sq3_score"


def test_extract_whinfell_ex_china_from_task_force():
    bundle = {
        "task_force": {
            "specialists": {
                "global_transmission": {"global_only_score": 52},
            }
        }
    }
    score, src = extract_whinfell_ex_china(bundle)
    assert score == 52.0
    assert src == "task_force.specialists.global_transmission.global_only_score"


def test_extract_whinfell_ex_china_task_force_panels_path():
    bundle = {
        "task_force_panels": {
            "specialists": {
                "global_transmission": {"global_only_score": 58},
            }
        }
    }
    score, _ = extract_whinfell_ex_china(bundle)
    assert score == 58.0


def test_fallback_global_only_score_three_nodes():
    bundle = {
        "node_cockpits": {
            "liquidity": {"composite_score": 100},
            "credit": {"composite_score": 12},
            "basis": {"composite_score": 100},
        }
    }
    assert fallback_global_only_score(bundle) == 70.67


def test_build_risk_dashboard_shape_and_sources():
    bundle = {
        "global": {"whinfell_score": 38},
        "china": {"sq3_score": 61},
        "task_force": {
            "specialists": {
                "global_transmission": {"global_only_score": 52},
            }
        },
    }
    dash = build_risk_dashboard(bundle)
    assert set(dash.keys()) == {"whinfell_ex_china", "sq3", "combined", "zones", "sources"}
    assert dash["whinfell_ex_china"] == 52.0
    assert dash["sq3"] == 61.0
    assert dash["combined"] == 38.0
    assert dash["sources"] == {
        "whinfell_ex_china": SOURCE_LABELS["whinfell_ex_china"],
        "sq3": SOURCE_LABELS["sq3"],
        "combined": SOURCE_LABELS["combined"],
    }


def test_build_risk_dashboard_zones():
    dash = build_risk_dashboard(
        {
            "global": {"whinfell_score": 38},
            "china": {"sq3_score": 61},
            "task_force": {
                "specialists": {"global_transmission": {"global_only_score": 52}}
            },
        }
    )
    assert dash["zones"]["combined"] == "red"
    assert dash["zones"]["whinfell_ex_china"] == "amber"
    assert dash["zones"]["sq3"] == "amber"
    for zone in dash["zones"].values():
        assert zone in RISK_ZONES


def test_build_risk_dashboard_fallback_source_label():
    dash = build_risk_dashboard(
        {
            "global": {"whinfell_score": 38},
            "china": {"sq3_score": 55},
            "node_cockpits": {
                "liquidity": {"composite_score": 90},
                "credit": {"composite_score": 90},
                "basis": {"composite_score": 90},
            },
        }
    )
    assert dash["whinfell_ex_china"] == 90.0
    assert dash["sources"]["whinfell_ex_china"] == FALLBACK_SOURCE_LABEL


def test_null_scores_allowed():
    dash = build_risk_dashboard({})
    for key in RISK_DASHBOARD_SCORES:
        assert dash[key] is None
        assert dash["zones"][key] is None


def test_built_dashboard_passes_schema_validator():
    bundle = {
        "global": {"whinfell_score": 38},
        "china": {"sq3_score": 61},
        "task_force": {
            "specialists": {"global_transmission": {"global_only_score": 52}}
        },
    }
    dash = build_risk_dashboard(bundle)
    errors: list[str] = []
    validate_risk_dashboard_schema(dash, errors)
    assert errors == [], f"schema errors: {errors}"


def test_live_hydration_bundle_if_present():
    if not HYDRATION.is_file():
        pytest.skip("hydration bundle absent")
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    dash = build_risk_dashboard(bundle)
    assert dash["combined"] is not None
    errors: list[str] = []
    validate_risk_dashboard_schema(dash, errors)
    assert errors == [], f"live hydration dashboard errors: {errors}"


def test_dictionary_meta_risk_dashboard_stub():
    meta = json.loads(META.read_text(encoding="utf-8"))
    stub = meta.get("bbdm_report", {})
    assert stub.get("locked_chunk") == "08"
    assert stub.get("risk_dashboard_module") == "whinfell_pipeline/bbdm_risk_dashboard.py"
    assert stub.get("risk_dashboard_version") == RISK_DASHBOARD_VERSION


if __name__ == "__main__":
    import pytest as _pytest

    raise SystemExit(_pytest.main([__file__, "-q"]))