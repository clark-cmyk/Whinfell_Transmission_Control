#!/usr/bin/env python3
"""Chunk 18 — SEC EDGAR filing watcher tests."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.sec_filing_watcher import (  # noqa: E402
    ADAPTER_VERSION,
    CLOUD_TICKERS,
    DEFAULT_OUT,
    EXPORT_ID,
    FILING_FORMS,
    MINER_TICKERS,
    SCHEMA_VERSION,
    build_filings_manifest_stub,
    ingest_filings_manifest,
    mark_filing_processed,
    parse_edgar_atom,
    red_indicator_active,
    scan_edgar_filings,
    validate_filings_manifest,
    write_filings_manifest_stub,
)

SAMPLE_ATOM_MSFT_10Q = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>10-Q - Quarterly report [Sections 13 or 15(d)]</title>
    <link href="https://www.sec.gov/Archives/edgar/data/789019/000078901926000045/msft-10q_20260425.htm"/>
    <updated>2026-04-25T16:30:00-04:00</updated>
    <summary>Accession Number: 0000789019-26-000045 Act: 34</summary>
  </entry>
</feed>
"""

SAMPLE_ATOM_MARA_8K = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>8-K - Current report</title>
    <link href="https://www.sec.gov/Archives/edgar/data/1507605/000150760526000012/mara-8k.htm"/>
    <updated>2026-05-10T08:00:00-04:00</updated>
    <summary>Accession Number: 0001507605-26-000012 Act: 34</summary>
  </entry>
</feed>
"""


def _mock_fetcher(responses: dict[tuple[str, str], str]):
    def _fetch(url: str, headers: dict[str, str]) -> str | None:
        assert "User-Agent" in headers
        for entry in CLOUD_TICKERS + MINER_TICKERS:
            for form in FILING_FORMS:
                key = (entry["cik"], form)
                if entry["cik"] in url and f"type={form}" in url:
                    return responses.get(key)
        return None

    return _fetch


def test_build_stub_contract():
    doc = build_filings_manifest_stub(as_of="2026-07-07T12:00:00+00:00")
    assert doc["schema_version"] == SCHEMA_VERSION
    assert doc["adapter_version"] == ADAPTER_VERSION
    assert doc["data_status"] == "stub"
    assert doc["source"] == "sec_edgar"
    assert doc["export_id"] == EXPORT_ID
    assert doc["filing_forms"] == list(FILING_FORMS)
    assert doc["watchlists"]["cloud"] == [e["ticker"] for e in CLOUD_TICKERS]
    assert doc["watchlists"]["miner"] == [e["ticker"] for e in MINER_TICKERS]
    assert doc["unprocessed_filings"] == []
    assert doc["unprocessed_filing_count"] == 0
    assert doc["red_indicator"]["active"] is False


def test_validate_stub_doc_passes():
    doc = build_filings_manifest_stub()
    assert validate_filings_manifest(doc) == []


def test_committed_manifest_file_matches_contract():
    assert DEFAULT_OUT.is_file(), f"missing committed manifest {DEFAULT_OUT}"
    doc = json.loads(DEFAULT_OUT.read_text(encoding="utf-8"))
    assert validate_filings_manifest(doc) == []
    assert doc["data_status"] == "stub"


def test_parse_edgar_atom_cloud_and_miner_trade_ids():
    msft = parse_edgar_atom(
        SAMPLE_ATOM_MSFT_10Q,
        ticker="MSFT",
        company="Microsoft Corp",
        cik="0000789019",
        category="cloud",
        expected_form="10-Q",
    )
    assert len(msft) == 1
    assert msft[0]["form_type"] == "10-Q"
    assert msft[0]["ticker"] == "MSFT"
    assert msft[0]["category"] == "cloud"
    assert msft[0]["trade_ids"] == ["midwest_basis", "midwest_calendar"]
    assert msft[0]["accession_number"] == "0000789019-26-000045"

    mara = parse_edgar_atom(
        SAMPLE_ATOM_MARA_8K,
        ticker="MARA",
        company="Marathon Digital Holdings Inc",
        cik="0001507605",
        category="miner",
        expected_form="8-K",
    )
    assert mara[0]["form_type"] == "8-K"
    assert mara[0]["trade_ids"] == ["btc_basis", "btc_calendar"]


def test_scan_detects_new_filings_with_mock_fetcher():
    responses = {
        ("0000789019", "10-Q"): SAMPLE_ATOM_MSFT_10Q,
        ("0001507605", "8-K"): SAMPLE_ATOM_MARA_8K,
    }
    doc = scan_edgar_filings(build_filings_manifest_stub(), fetcher=_mock_fetcher(responses), live=True)
    assert doc["data_status"] == "live"
    assert doc["unprocessed_filing_count"] == 2
    assert len(doc["unprocessed_filings"]) == 2
    tickers = {f["ticker"] for f in doc["unprocessed_filings"]}
    assert tickers == {"MSFT", "MARA"}
    assert red_indicator_active(doc) is True
    assert doc["red_indicator"]["active"] is True


def test_scan_ignores_processed_filings():
    responses = {
        ("0000789019", "10-Q"): SAMPLE_ATOM_MSFT_10Q,
    }
    base = build_filings_manifest_stub()
    parsed = parse_edgar_atom(
        SAMPLE_ATOM_MSFT_10Q,
        ticker="MSFT",
        company="Microsoft Corp",
        cik="0000789019",
        category="cloud",
        expected_form="10-Q",
    )
    base["processed_filings"] = [parsed[0]["filing_id"]]
    doc = scan_edgar_filings(base, fetcher=_mock_fetcher(responses), live=True)
    assert doc["unprocessed_filing_count"] == 0
    assert doc["unprocessed_filings"] == []
    assert doc["red_indicator"]["active"] is False


def test_mark_processed_clears_unprocessed_and_red_indicator():
    responses = {("0000789019", "10-Q"): SAMPLE_ATOM_MSFT_10Q}
    doc = scan_edgar_filings(build_filings_manifest_stub(), fetcher=_mock_fetcher(responses), live=True)
    filing_id = doc["unprocessed_filings"][0]["filing_id"]
    updated = mark_filing_processed(doc, filing_id)
    assert updated["unprocessed_filing_count"] == 0
    assert updated["red_indicator"]["active"] is False
    assert any(
        (p == filing_id) or (isinstance(p, dict) and p.get("filing_id") == filing_id)
        for p in updated["processed_filings"]
    )


def test_ingest_stub_only_writes_manifest():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "filings_manifest.json"
        doc = ingest_filings_manifest(out_path=out, force_stub=True, live=False)
        assert out.is_file()
        assert doc["data_status"] == "stub"
        assert validate_filings_manifest(json.loads(out.read_text(encoding="utf-8"))) == []


def test_ingest_live_with_mock_fetcher_persists_unprocessed():
    responses = {("0001507605", "8-K"): SAMPLE_ATOM_MARA_8K}
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "filings_manifest.json"

        def fetcher(url: str, headers: dict[str, str]) -> str | None:
            if "0001507605" in url and "type=8-K" in url:
                return SAMPLE_ATOM_MARA_8K
            return None

        doc = ingest_filings_manifest(out_path=out, live=True, fetcher=fetcher)
        saved = json.loads(out.read_text(encoding="utf-8"))
        assert doc["unprocessed_filing_count"] >= 1
        assert saved["unprocessed_filings"][0]["ticker"] == "MARA"


def test_write_filings_manifest_stub_roundtrip():
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "filings_manifest.json"
        path = write_filings_manifest_stub(out, as_of="2026-07-07T00:00:00+00:00")
        doc = json.loads(path.read_text(encoding="utf-8"))
        assert doc["as_of"] == "2026-07-07T00:00:00+00:00"
        assert validate_filings_manifest(doc) == []


def main() -> int:
    tests = [
        test_build_stub_contract,
        test_validate_stub_doc_passes,
        test_committed_manifest_file_matches_contract,
        test_parse_edgar_atom_cloud_and_miner_trade_ids,
        test_scan_detects_new_filings_with_mock_fetcher,
        test_scan_ignores_processed_filings,
        test_mark_processed_clears_unprocessed_and_red_indicator,
        test_ingest_stub_only_writes_manifest,
        test_ingest_live_with_mock_fetcher_persists_unprocessed,
        test_write_filings_manifest_stub_roundtrip,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_sec_filing_watcher.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())