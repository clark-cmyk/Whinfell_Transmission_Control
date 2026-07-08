#!/usr/bin/env python3
"""Chunk 14 — registry-locked SOFR/FF and 2s10s rates singles (v1.2 cockpit flow unchanged)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.bbdm_registry import trade_by_id, trade_for_series  # noqa: E402
from whinfell_pipeline.rates_series import (  # noqa: E402
    ADAPTER_VERSION,
    RATES_SERIES_IDS,
    SOFR_OIS_SPREAD_ID,
    USGG2Y10Y_ID,
    build_rates_series,
    build_sofr_ois_spread_series,
    build_usgg2y10y_series,
    liquidity_cockpit_has_rates,
    registry_trade,
)
from whinfell_pipeline.rv_history import (  # noqa: E402
    RV_HISTORY_VERSION,
    _build_cockpit_series_entry,
    build_rv_history_block,
    enrich_bundle,
)

HYDRATION = ROOT / "docs" / "data" / "hydration" / "latest.json"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"


def _liquidity_horizon_bundle() -> dict:
    return {
        "as_of": "2026-06-29T12:00:00+00:00",
        "node_cockpits": {
            "liquidity": {
                "rv_basis": {
                    "active_series_id": USGG2Y10Y_ID,
                    "series": {
                        USGG2Y10Y_ID: {
                            "quartile_direction": "higher_is_richer",
                            "label": "US 2s10s spread",
                            "horizons": {
                                "3m": {
                                    "current_value": 1.225,
                                    "unit": "pct",
                                    "percentile": 44.4,
                                    "lookback_start": "2026-04-28",
                                    "lookback_end": "2026-06-29",
                                    "n_observations": 63,
                                }
                            },
                        },
                        SOFR_OIS_SPREAD_ID: {
                            "quartile_direction": "higher_is_cheaper",
                            "label": "SOFR front-end stress",
                            "horizons": {
                                "3m": {
                                    "current_value": 320.0,
                                    "unit": "bps",
                                    "percentile": 57.1,
                                    "lookback_start": "2026-04-28",
                                    "lookback_end": "2026-06-29",
                                    "n_observations": 63,
                                }
                            },
                        },
                    },
                }
            }
        },
    }


def test_rates_series_ids_locked():
    assert RATES_SERIES_IDS == frozenset({SOFR_OIS_SPREAD_ID, USGG2Y10Y_ID})


def test_registry_trade_links():
    sofr_trade = registry_trade(SOFR_OIS_SPREAD_ID)
    assert sofr_trade.id == "sofr_fed_funds"
    assert sofr_trade.series_id == SOFR_OIS_SPREAD_ID
    assert sofr_trade.structure_type == "single"
    assert sofr_trade.trade_type == "rates"
    assert sofr_trade.quartile_direction == "higher_is_cheaper"
    assert trade_for_series(SOFR_OIS_SPREAD_ID).id == "sofr_fed_funds"
    assert trade_by_id("sofr_fed_funds").series_id == SOFR_OIS_SPREAD_ID

    curve_trade = registry_trade(USGG2Y10Y_ID)
    assert curve_trade.id == "curve_2s10s"
    assert curve_trade.series_id == USGG2Y10Y_ID
    assert curve_trade.structure_type == "single"
    assert curve_trade.trade_type == "rates"
    assert curve_trade.quartile_direction == "higher_is_richer"
    assert trade_for_series(USGG2Y10Y_ID).id == "curve_2s10s"
    assert trade_by_id("curve_2s10s").series_id == USGG2Y10Y_ID


def test_build_preserves_v12_cockpit_logic():
    bundle = _liquidity_horizon_bundle()
    for series_id in RATES_SERIES_IDS:
        legacy = _build_cockpit_series_entry(bundle, series_id)
        locked = build_rates_series(bundle, series_id)
        assert legacy is not None
        assert locked is not None
        assert locked["points"] == legacy["points"]
        assert locked["source"] == legacy["source"]
        assert locked["resolved_series_id"] == legacy["resolved_series_id"]
        assert locked["quartile_direction"] == legacy["quartile_direction"]
        assert len(locked["points"]) >= 5


def test_build_stamps_registry_metadata():
    bundle = _liquidity_horizon_bundle()
    sofr = build_sofr_ois_spread_series(bundle)
    curve = build_usgg2y10y_series(bundle)
    assert sofr is not None
    assert curve is not None

    assert sofr["series_id"] == SOFR_OIS_SPREAD_ID
    assert sofr["bbdm_trade_id"] == "sofr_fed_funds"
    assert sofr["adapter_version"] == ADAPTER_VERSION
    assert sofr["data_status"] == "live"
    assert sofr["label"] == "SOFR vs Fed Funds"
    assert sofr["unit"] == "bps"
    assert sofr["points"][-1]["value"] == 320.0

    assert curve["series_id"] == USGG2Y10Y_ID
    assert curve["bbdm_trade_id"] == "curve_2s10s"
    assert curve["adapter_version"] == ADAPTER_VERSION
    assert curve["data_status"] == "live"
    assert curve["label"] == "2s10s Curve"
    assert curve["unit"] == "pct"
    assert curve["points"][-1]["value"] == 1.225


def test_liquidity_cockpit_probe():
    bundle = _liquidity_horizon_bundle()
    assert liquidity_cockpit_has_rates(bundle) is True
    assert liquidity_cockpit_has_rates({"node_cockpits": {}}) is False


def test_rv_history_block_wires_rates():
    bundle = _liquidity_horizon_bundle()
    block = build_rv_history_block(bundle)
    assert block["version"] == RV_HISTORY_VERSION

    sofr = block["series"][SOFR_OIS_SPREAD_ID]
    curve = block["series"][USGG2Y10Y_ID]
    assert sofr["bbdm_trade_id"] == "sofr_fed_funds"
    assert curve["bbdm_trade_id"] == "curve_2s10s"
    assert sofr["adapter_version"] == ADAPTER_VERSION
    assert curve["adapter_version"] == ADAPTER_VERSION
    assert sofr["data_status"] == "live"
    assert curve["data_status"] == "live"
    assert len(sofr["points"]) >= 5
    assert len(curve["points"]) >= 5


def test_enrich_bundle_wires_rates_from_hydration():
    if not HYDRATION.is_file():
        return
    bundle = json.loads(HYDRATION.read_text(encoding="utf-8"))
    enriched = enrich_bundle(bundle)
    assert liquidity_cockpit_has_rates(enriched) is True

    sofr = enriched["rv_history"]["series"][SOFR_OIS_SPREAD_ID]
    curve = enriched["rv_history"]["series"][USGG2Y10Y_ID]
    assert sofr["bbdm_trade_id"] == "sofr_fed_funds"
    assert curve["bbdm_trade_id"] == "curve_2s10s"
    assert sofr["data_status"] == "live"
    assert curve["data_status"] == "live"
    assert sofr["source"] == "rv_basis_reconstructed"
    assert curve["source"] == "rv_basis_reconstructed"


def test_enrich_hydration_rv_dry_run_reports_rates():
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
    assert "sofr_ois_spread=" in proc.stdout
    assert "usgg2y10y=" in proc.stdout
    assert "primary=8" in proc.stdout
    assert "Lineage:" in proc.stdout


if __name__ == "__main__":
    test_rates_series_ids_locked()
    test_registry_trade_links()
    test_build_preserves_v12_cockpit_logic()
    test_build_stamps_registry_metadata()
    test_liquidity_cockpit_probe()
    test_rv_history_block_wires_rates()
    test_enrich_bundle_wires_rates_from_hydration()
    test_enrich_hydration_rv_dry_run_reports_rates()
    print("rates_series_lock tests OK")