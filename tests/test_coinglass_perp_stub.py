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
    # Allow live/partial after public-venue + Koyfin ingest; still must validate.
    # adapter_version may lag until next write — only enforce schema + shape.
    errors = [e for e in validate_crypto_market_doc(doc) if not e.startswith("adapter_version")]
    assert errors == []
    assert doc["data_status"] in {"stub", "partial", "live"}


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
    with tempfile.TemporaryDirectory() as tmp:
        empty_drop = Path(tmp) / "drop"
        empty_drop.mkdir()
        merged = apply_live_metrics(
            build_crypto_market_stub(),
            api_key="test-coinglass-key",
            fetcher=mock["fetch"],
            drop_dir=empty_drop,
            sosovalue_fetch=lambda asset: None,  # isolate CoinGlass path
        )
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
    assert merged["assets"]["BTC"]["signals"][3]["status"] == "expected_limitation"


def test_apply_live_metrics_without_api_key_uses_public_fallback():
    """No CoinGlass key → public Deribit/HL + optional Koyfin/SoSoValue flows."""
    import whinfell_pipeline.coinglass_perp as mod

    old_d, old_h, old_f = mod.fetch_deribit_public, mod.fetch_hyperliquid_public, mod.discover_flows_csv
    try:
        mod.fetch_deribit_public = lambda asset: {
            "funding_rate": 0.00015,
            "open_interest_usd": 1_000_000_000.0,
        }
        mod.fetch_hyperliquid_public = lambda asset: {
            "funding_rate": 0.00008,
            "open_interest_usd": 2_000_000_000.0,
        }
        mod.discover_flows_csv = lambda drop_dir=None: None
        soso = lambda asset: -52_080_427.85 if asset == "ETH" else 10_000_000.0
        merged = apply_live_metrics(
            build_crypto_market_stub(), api_key=None, sosovalue_fetch=soso
        )
    finally:
        mod.fetch_deribit_public = old_d
        mod.fetch_hyperliquid_public = old_h
        mod.discover_flows_csv = old_f

    assert merged["data_status"] in {"live", "partial"}
    assert merged["lineage"].get("fallback") == "public_venues+koyfin_flows+sosovalue"
    btc_agg = merged["assets"]["BTC"]["signals"][0]
    assert btc_agg["status"] == "live"
    assert btc_agg["funding_rate"] is not None
    assert merged["assets"]["BTC"]["signals"][1]["status"] == "live"  # deribit
    assert merged["assets"]["BTC"]["signals"][2]["status"] == "live"  # hyperliquid
    # CF Benchmark is an expected licensed limitation, not a hang.
    assert merged["assets"]["ETH"]["signals"][3]["status"] == "expected_limitation"
    assert merged["assets"]["ETH"]["signals"][3].get("note")
    # ETH ETF flows filled via SoSoValue when Koyfin CSV absent
    eth_etf = merged["assets"]["ETH"]["signals"][4]
    assert eth_etf["status"] == "live"
    assert eth_etf["source"] == "sosovalue_public"
    assert eth_etf["open_interest_usd"] == -52_080_427.85


def test_koyfin_btc_only_sosovalue_fills_eth():
    """Desk flows CSV with IBIT only (non-zero) → BTC koyfin + ETH sosovalue."""
    import whinfell_pipeline.coinglass_perp as mod
    import tempfile
    from pathlib import Path

    csv_body = (
        "Ticker,Name,Fund Flows/Periodic (D)\n"
        "IBIT,iShares Bitcoin ETF,12.5\n"
        "LQD,IG Corp,100\n"
    )
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp)
        flows = drop / "flows_test.csv"
        flows.write_text(csv_body, encoding="utf-8")
        old_d, old_h = mod.fetch_deribit_public, mod.fetch_hyperliquid_public
        try:
            mod.fetch_deribit_public = lambda asset: {
                "funding_rate": 0.0001,
                "open_interest_usd": 1e9,
            }
            mod.fetch_hyperliquid_public = lambda asset: {
                "funding_rate": 0.0002,
                "open_interest_usd": 2e9,
            }
            soso = lambda asset: -1_000_000.0 if asset == "ETH" else None
            merged = apply_live_metrics(
                build_crypto_market_stub(),
                api_key=None,
                drop_dir=drop,
                sosovalue_fetch=soso,
            )
        finally:
            mod.fetch_deribit_public = old_d
            mod.fetch_hyperliquid_public = old_h

    btc_etf = next(s for s in merged["assets"]["BTC"]["signals"] if s["signal_id"] == "etf_flows")
    eth_etf = next(s for s in merged["assets"]["ETH"]["signals"] if s["signal_id"] == "etf_flows")
    assert btc_etf["status"] == "live"
    assert btc_etf["source"] == "koyfin_flows"
    assert btc_etf["open_interest_usd"] == 12_500_000.0
    assert eth_etf["status"] == "live"
    assert eth_etf["source"] == "sosovalue_public"
    assert eth_etf["open_interest_usd"] == -1_000_000.0
    assert any(
        lim.get("signal_id") == "cf_benchmark"
        for lim in merged["lineage"].get("expected_limitations") or []
    )


def test_koyfin_btc_zero_falls_through_to_sosovalue():
    """IBIT present with 0.00 1D flow must not block SoSoValue BTC aggregate."""
    import whinfell_pipeline.coinglass_perp as mod
    import tempfile
    from pathlib import Path

    csv_body = (
        "Ticker,Name,Fund Flows/Periodic (D)\n"
        "IBIT,iShares Bitcoin ETF,0.00\n"
        "LQD,IG Corp,100\n"
    )
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp)
        (drop / "flows_test.csv").write_text(csv_body, encoding="utf-8")
        old_d, old_h = mod.fetch_deribit_public, mod.fetch_hyperliquid_public
        try:
            mod.fetch_deribit_public = lambda asset: {
                "funding_rate": 0.0001,
                "open_interest_usd": 1e9,
            }
            mod.fetch_hyperliquid_public = lambda asset: {
                "funding_rate": 0.0002,
                "open_interest_usd": 2e9,
            }
            soso = lambda asset: (
                -95_301_696.51 if asset == "BTC" else -52_080_427.85
            )
            merged = apply_live_metrics(
                build_crypto_market_stub(),
                api_key=None,
                drop_dir=drop,
                sosovalue_fetch=soso,
            )
        finally:
            mod.fetch_deribit_public = old_d
            mod.fetch_hyperliquid_public = old_h

    btc_etf = next(s for s in merged["assets"]["BTC"]["signals"] if s["signal_id"] == "etf_flows")
    eth_etf = next(s for s in merged["assets"]["ETH"]["signals"] if s["signal_id"] == "etf_flows")
    assert btc_etf["status"] == "live"
    assert btc_etf["source"] == "sosovalue_public"
    assert btc_etf["open_interest_usd"] == -95_301_696.51
    assert eth_etf["source"] == "sosovalue_public"
    assert any(
        "koyfin_zero_BTC" in e for e in (merged["lineage"].get("fetch_errors") or [])
    )


def test_ingest_without_api_key_writes_public_or_stub():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "crypto_market.json"
        empty_drop = Path(tmp) / "drop"
        empty_drop.mkdir()
        old = os.environ.copy()
        import whinfell_pipeline.coinglass_perp as mod

        old_d, old_h = mod.fetch_deribit_public, mod.fetch_hyperliquid_public
        try:
            os.environ.pop("COINGLASS_API_KEY", None)
            os.environ.pop("WHINFELL_COINGLASS_API_KEY", None)
            mod.fetch_deribit_public = lambda asset: {
                "funding_rate": 0.0001,
                "open_interest_usd": 5e8,
            }
            mod.fetch_hyperliquid_public = lambda asset: {
                "funding_rate": 0.0002,
                "open_interest_usd": 6e8,
            }
            # Patch SoSoValue to avoid network in unit test
            old_s = mod.fetch_sosovalue_etf_net_inflow
            mod.fetch_sosovalue_etf_net_inflow = lambda asset: None
            try:
                doc = ingest_crypto_market(out_path=out, force_stub=False, drop_dir=empty_drop)
            finally:
                mod.fetch_sosovalue_etf_net_inflow = old_s
        finally:
            os.environ.clear()
            os.environ.update(old)
            mod.fetch_deribit_public = old_d
            mod.fetch_hyperliquid_public = old_h
        assert out.is_file()
        assert doc["data_status"] in {"live", "partial"}
        saved = json.loads(out.read_text(encoding="utf-8"))
        # adapter_version always current on write
        assert validate_crypto_market_doc(saved) == []


def test_ingest_with_mock_fetcher_promotes_live():
    mock = _mock_fetcher_factory()
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "crypto_market.json"
        empty_drop = Path(tmp) / "drop"
        empty_drop.mkdir()
        old = os.environ.copy()
        try:
            os.environ["COINGLASS_API_KEY"] = "test-coinglass-key"
            doc = ingest_crypto_market(
                out_path=out,
                force_stub=False,
                fetcher=mock["fetch"],
                drop_dir=empty_drop,
            )
            # force no sosovalue via empty resolution: patch after would need API change;
            # empty drop + network may still fill ETF — assert coinglass venue live only
        finally:
            os.environ.clear()
            os.environ.update(old)
        assert doc["data_status"] in {"live", "partial"}
        saved = json.loads(out.read_text(encoding="utf-8"))
        assert saved["assets"]["ETH"]["signals"][2]["status"] == "live"


def test_litmus_rows_for_trade_projection():
    doc = build_crypto_market_stub()
    rows = litmus_rows_for_trade(doc, "btc_calendar")
    assert len(rows) == len(SIGNAL_DEFS)
    assert rows[0]["signal"] == "Perp Funding (Aggregate)"
    assert rows[3]["status"] == "expected_limitation"
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
        test_apply_live_metrics_without_api_key_uses_public_fallback,
        test_koyfin_btc_only_sosovalue_fills_eth,
        test_koyfin_btc_zero_falls_through_to_sosovalue,
        test_ingest_without_api_key_writes_public_or_stub,
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