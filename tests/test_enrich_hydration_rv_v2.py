#!/usr/bin/env python3
"""Chunk 15 — enrich_hydration_rv v2: all 8 series + lineage stamps + morning chain hook."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import BBDM_TRADES  # noqa: E402
from whinfell_pipeline.enrich_hydration import (  # noqa: E402
    ENRICH_VERSION,
    build_bbdm_rv_enrich_block,
    build_series_lineage,
    enrich_bundle,
    enrich_lineage_hash,
    primary_series_status,
)
from whinfell_pipeline.rv_history import (  # noqa: E402
    BBDM_V2_PRIMARY_SERIES,
    RV_HISTORY_VERSION,
    build_rv_history_block,
    enrich_bundle as enrich_bundle_reexport,
)

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"
SYNC_SCRIPT = ROOT / "scripts" / "sync_live_desk_data.sh"


def test_enrich_version_and_primary_series_locked():
    assert ENRICH_VERSION == "2.0.0-chunk15"
    assert len(BBDM_V2_PRIMARY_SERIES) == 8
    assert tuple(t.series_id for t in BBDM_TRADES) == BBDM_V2_PRIMARY_SERIES


def test_enrich_bundle_injects_all_eight_series():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw, ROOT)
    rv = enriched.get("rv_history") or {}
    series = rv.get("series") or {}

    for series_id in BBDM_V2_PRIMARY_SERIES:
        assert series_id in series, f"missing primary series: {series_id}"
        assert len(series[series_id].get("points") or []) >= 5, f"short history: {series_id}"
        trade = next(t for t in BBDM_TRADES if t.series_id == series_id)
        assert series[series_id].get("bbdm_trade_id") == trade.id


def test_lineage_stamps_cover_all_trades():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(raw, ROOT)
    stamp = enriched.get("bbdm_rv_enrich") or {}
    lineage = stamp.get("series_lineage") or []

    assert stamp.get("version") == ENRICH_VERSION
    assert stamp.get("rv_history_version") == RV_HISTORY_VERSION
    assert len(lineage) == 8
    assert stamp.get("live_count", 0) + stamp.get("fallback_count", 0) == 8
    assert stamp.get("input_lineage_hash") == raw.get("lineage_hash")
    assert str(stamp.get("enrich_lineage_hash", "")).startswith("sha256:")
    assert stamp.get("enrich_lineage_hash") == enrich_lineage_hash(
        {k: v for k, v in stamp.items() if k != "enrich_lineage_hash"}
    )

    trade_ids = {row["bbdm_trade_id"] for row in lineage}
    assert trade_ids == {t.id for t in BBDM_TRADES}
    for row in lineage:
        assert row.get("adapter_module")
        assert row.get("adapter_version")
        assert row.get("source")
        assert row.get("points_count", 0) >= 5


def test_build_series_lineage_from_minimal_bundle():
    bundle = {
        "lineage_hash": "sha256:test",
        "node_cockpits": {
            "liquidity": {
                "rv_basis": {
                    "series": {
                        "sofr_ois_spread": {
                            "horizons": {
                                "3m": {
                                    "current_value": 320.0,
                                    "lookback_start": "2026-04-28",
                                    "lookback_end": "2026-06-29",
                                    "n_observations": 63,
                                    "percentile": 57.1,
                                }
                            }
                        },
                        "usgg2y10y": {
                            "horizons": {
                                "3m": {
                                    "current_value": 1.225,
                                    "lookback_start": "2026-04-28",
                                    "lookback_end": "2026-06-29",
                                    "n_observations": 63,
                                    "percentile": 44.4,
                                }
                            }
                        },
                    }
                }
            }
        },
    }
    rv_block = build_rv_history_block(bundle)
    lineage = build_series_lineage(bundle, rv_block)
    assert len(lineage) == 8
    rates_rows = [r for r in lineage if r["bbdm_trade_id"] in ("sofr_fed_funds", "curve_2s10s")]
    assert len(rates_rows) == 2
    assert all(r["points_count"] >= 5 for r in rates_rows)

    stamp = build_bbdm_rv_enrich_block(bundle, rv_block, cockpit_injects=[])
    assert stamp["primary_series"] == list(BBDM_V2_PRIMARY_SERIES)


def test_primary_series_status_helper():
    rv_block = {
        "series": {
            "btc_basis_spot_1m": {"data_status": "live"},
            "usgg2y10y": {"source": "rv_basis_reconstructed"},
        }
    }
    status = primary_series_status(rv_block)
    assert status["btc_basis_spot_1m"] == "live"
    assert status["usgg2y10y"] == "fallback"
    assert status["eth_basis_spot_1m"] == "missing"


def test_rv_history_reexport_matches_enrich_module():
    if not HYDRATION.is_file():
        return
    raw = json.loads(HYDRATION.read_text(encoding="utf-8"))
    a = enrich_bundle(raw, ROOT)
    b = enrich_bundle_reexport(raw)
    assert a["rv_history"]["version"] == b["rv_history"]["version"]
    assert a["bbdm_rv_enrich"]["version"] == b["bbdm_rv_enrich"]["version"]


def test_enrich_hydration_rv_dry_run_reports_v2_summary():
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
    assert f"enrich={ENRICH_VERSION}" in proc.stdout
    assert "primary=8" in proc.stdout
    assert "Lineage:" in proc.stdout
    for series_id in BBDM_V2_PRIMARY_SERIES:
        assert f"{series_id}=" in proc.stdout


def test_morning_chain_hooks_enrich_after_hydration_copy():
    assert SYNC_SCRIPT.is_file()
    text = SYNC_SCRIPT.read_text(encoding="utf-8")
    assert "copy_hydration_bundle.sh" in text
    assert "enrich_hydration_rv.py" in text
    assert "rv_enrich_ok" in text


if __name__ == "__main__":
    test_enrich_version_and_primary_series_locked()
    test_enrich_bundle_injects_all_eight_series()
    test_lineage_stamps_cover_all_trades()
    test_build_series_lineage_from_minimal_bundle()
    test_rv_history_reexport_matches_enrich_module()
    test_enrich_hydration_rv_dry_run_reports_v2_summary()
    test_morning_chain_hooks_enrich_after_hydration_copy()
    print("enrich_hydration_rv_v2 tests OK")