#!/usr/bin/env python3
"""Chunk 17 — CoinGlass perp funding/OI Litmus stub adapter tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.coinglass_perp import (  # noqa: E402
    ADAPTER_VERSION,
    API_PATHS,
    DEFAULT_OUT,
    EXPORT_ID,
    MARKET_SIGNAL_COLUMNS,
    SCHEMA_VERSION,
    SIGNAL_DEFS,
    TRADE_IDS,
    apply_live_metrics,
    build_crypto_market_stub,
    ingest_crypto_market,
    litmus_rows_for_trade,
    validate_crypto_market_doc,
    write_crypto_market_stub,
)


def _mock_fetcher_factory() -> dict[str, dict]:
    store: dict[str, dict] = {
        API_PATHS["funding_oi_weight"]: {
            "code": "0",
            "data": [{"time": 1, "open": "0.01", "high": "0.02", "low": "0.00", "close": "0.0095"}],
        },
        API_PATHS["oi_aggregated"]: {
            "code": "0",
            "data": [{"time": 1, "open": "1e9", "high": "1.1e9", "low": "9e8", "close": "10500000000"}],
        },
        API_PATHS["funding_exchange_list"]: {
            "code": "0",
            "data": [
                {"exchange": "Deribit", "fundingRate": 0.00012},
                {"exchange": "Hyperliquid", "fundingRate": 0.00008},
            ],
        },
        API_PATHS["oi_exchange_list"]: {
            "code": "0",
            "data": [
                {"exchange": "Deribit", "openInterest": 2500000000},
                {"exchange": "Hyperliquid", "openInterest": 1800000000},
            ],
        },
    }

    def _fetch(url: str, api_key: str) -> dict | None:
        assert api_key == "test-coinglass-key"
        path = urlparse(url).path
        return store.get(path)

    return {"fetch": _fetch, "store": store}


def test_build_stub_contract():
    doc = build_crypto_market_stub(as_of="2026-07-07T12:00:00+00:00")
    assert doc["schema_version"] == SCHEMA_VERSION
    assert doc["adapter_version"] == ADAPTER_VERSION
    assert doc["data_status"] == "stub"
    assert doc["source"] == "coinglass"
    assert doc["export_id"] == EXPORT_ID
    assert doc["trade_ids"] == list(TRADE_IDS)
    assert set(doc["assets"]) == {"BTC", "ETH"}
    for asset in ("BTC", "ETH"):
        assert len(doc["assets"][asset]["signals"]) == len(SIGNAL_DEFS)
        for signal in doc["assets"][asset]["signals"]:
            assert signal["funding_rate"] is None
            assert signal["open_interest_usd"] is None
    assert len(doc["tables"]) == 4
    assert doc["tables"][0]["columns"] == list(MARKET_SIGNAL_COLUMNS)


def test_validate_stub_doc_passes():
    doc = build_crypto_market_stub()
    assert validate_crypto_market_doc(doc) == []


def test_committed_stub_file_matches_contract():
    assert DEFAULT_OUT.is_file(), f"missing committed stub {DEFAULT_OUT}"
    doc = json.loads(DEFAULT_OUT.read_text(encoding="utf-8"))
    assert validate_crypto_market_doc(doc) == []
    assert doc["data_status"] == "stub"


def test_build_litmus_tables_cover_basis_and_calendar():
    doc = build_crypto_market_stub()
    table_ids = {table["id"] for table in doc["tables"]}
    assert table_ids == {
        "btc_basis_market",
        "btc_calendar_market",
        "eth_basis_market",
        "eth_calendar_market",
    }


def test_apply_live_metrics_with_mock_fetcher():
    mock = _mock_fetcher_factory()
    merged = apply_live_metrics(build_crypto_market_stub(), api_key="test-coinglass-key", fetcher=mock["fetch"])
    assert merged["data_status"] == "live"
    btc_agg = merged["assets"]["BTC"]["signals"][0]
    assert btc_agg["signal_id"] == "perp_funding_aggregate"
    assert btc_agg["funding_rate"] == 0.0095
    assert btc_agg["open_interest_usd"] == 10500000000.0
    assert btc_agg["status"] == "live"
    deribit = merged["assets"]["BTC"]["signals"][1]
    assert deribit["funding_rate"] == 0.00012
    assert deribit["open_interest_usd"] == 2500000000.0
    assert merged["lineage"]["live_signal_count"] == 6


def test_apply_live_metrics_without_api_key_keeps_stub():
    merged = apply_live_metrics(build_crypto_market_stub(), api_key=None, fetcher=_mock_fetcher_factory()["fetch"])
    assert merged["data_status"] == "stub"
    assert merged["assets"]["BTC"]["signals"][0]["status"] == "pending_coinglass"


def test_ingest_without_api_key_writes_stub():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "crypto_market.json"
        old = os.environ.copy()
        try:
            os.environ.pop("COINGLASS_API_KEY", None)
            os.environ.pop("WHINFELL_COINGLASS_API_KEY", None)
            doc = ingest_crypto_market(out_path=out, force_stub=False)
        finally:
            os.environ.clear()
            os.environ.update(old)
        assert out.is_file()
        assert doc["data_status"] == "stub"
        assert validate_crypto_market_doc(json.loads(out.read_text(encoding="utf-8"))) == []


def test_ingest_with_mock_fetcher_promotes_live():
    mock = _mock_fetcher_factory()
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "crypto_market.json"
        old = os.environ.copy()
        try:
            os.environ["COINGLASS_API_KEY"] = "test-coinglass-key"
            doc = ingest_crypto_market(out_path=out, force_stub=False, fetcher=mock["fetch"])
        finally:
            os.environ.clear()
            os.environ.update(old)
        assert doc["data_status"] == "live"
        saved = json.loads(out.read_text(encoding="utf-8"))
        assert saved["assets"]["ETH"]["signals"][2]["status"] == "live"


def test_litmus_rows_for_trade_projection():
    doc = build_crypto_market_stub()
    rows = litmus_rows_for_trade(doc, "btc_calendar")
    assert len(rows) == len(SIGNAL_DEFS)
    assert rows[0]["signal"] == "Perp Funding (Aggregate)"
    assert rows[3]["status"] == "pending_external"
    assert rows[4]["status"] == "pending_koyfin"


def test_write_crypto_market_stub_roundtrip():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "crypto_market.json"
        path = write_crypto_market_stub(out, as_of="2026-07-07T00:00:00+00:00")
        doc = json.loads(path.read_text(encoding="utf-8"))
        assert doc["as_of"] == "2026-07-07T00:00:00+00:00"
        assert validate_crypto_market_doc(doc) == []


def test_api_paths_used_in_mock_fetch_urls():
    mock = _mock_fetcher_factory()
    captured: list[str] = []

    def _fetch(url: str, api_key: str) -> dict | None:
        captured.append(urlparse(url).path)
        return mock["fetch"](url, api_key)

    apply_live_metrics(build_crypto_market_stub(), api_key="test-coinglass-key", fetcher=_fetch)
    for path in API_PATHS.values():
        assert captured.count(path) >= 2


def main() -> int:
    tests = [
        test_build_stub_contract,
        test_validate_stub_doc_passes,
        test_committed_stub_file_matches_contract,
        test_build_litmus_tables_cover_basis_and_calendar,
        test_apply_live_metrics_with_mock_fetcher,
        test_apply_live_metrics_without_api_key_keeps_stub,
        test_ingest_without_api_key_writes_stub,
        test_ingest_with_mock_fetcher_promotes_live,
        test_litmus_rows_for_trade_projection,
        test_write_crypto_market_stub_roundtrip,
        test_api_paths_used_in_mock_fetch_urls,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_coinglass_perp_stub.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())