"""BBDM v2 Chunk 18 — SEC EDGAR filing watcher for Litmus red indicators.

Scans 10-Q / 10-K / 8-K for spec §5 cloud + miner tickers, diffs against
last-processed manifest, emits unprocessed_filings[] for Chunk 31 red badge.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

ADAPTER_VERSION = "2.0.0-chunk18"
SCHEMA_VERSION = "2.0.0"
EXPORT_ID = "sec_edgar_filings"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "bang_bang_da" / "litmus" / "filings_manifest.json"
EDGAR_ATOM_URL = "https://www.sec.gov/cgi-bin/browse-edgar"
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}
FILING_FORMS = ("10-Q", "10-K", "8-K")

FetchFn = Callable[[str, dict[str, str]], Optional[str]]

CLOUD_TICKERS: tuple[dict[str, str], ...] = (
    {"ticker": "MSFT", "company": "Microsoft Corp", "cik": "0000789019"},
    {"ticker": "GOOGL", "company": "Alphabet Inc", "cik": "0001652044"},
    {"ticker": "AMZN", "company": "Amazon.com Inc", "cik": "0001018724"},
    {"ticker": "ORCL", "company": "Oracle Corp", "cik": "0001341439"},
    {"ticker": "SMCI", "company": "Super Micro Computer Inc", "cik": "0001375365"},
    {"ticker": "META", "company": "Meta Platforms Inc", "cik": "0001326801"},
    {"ticker": "VST", "company": "Vistra Corp", "cik": "0001692812"},
    {"ticker": "CEG", "company": "Constellation Energy Corp", "cik": "0001868275"},
    {"ticker": "NVDA", "company": "Nvidia Corp", "cik": "0001045810"},
)

MINER_TICKERS: tuple[dict[str, str], ...] = (
    {"ticker": "MARA", "company": "Marathon Digital Holdings Inc", "cik": "0001507605"},
    {"ticker": "RIOT", "company": "Riot Platforms Inc", "cik": "0001167419"},
    {"ticker": "CLSK", "company": "CleanSpark Inc", "cik": "0001829940"},
    {"ticker": "HUT", "company": "Hut 8 Corp", "cik": "0001964789"},
    {"ticker": "CIFR", "company": "Cipher Mining Inc", "cik": "0001819989"},
    {"ticker": "IREN", "company": "Iris Energy Ltd", "cik": "0001878848"},
    {"ticker": "BITF", "company": "Bitfarms Ltd", "cik": "0001812477"},
)

TRADE_IDS_BY_CATEGORY = {
    "cloud": ("midwest_basis", "midwest_calendar"),
    "miner": ("btc_basis", "btc_calendar"),
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def edgar_user_agent() -> str:
    return os.environ.get("WHINFELL_EDGAR_USER_AGENT", "Whinfell Transmission Control filings@whinfell.local")


def build_filings_manifest_stub(*, as_of: Optional[str] = None) -> dict[str, Any]:
    stamp = as_of or _utc_now()
    return {
        "schema_version": SCHEMA_VERSION,
        "adapter_version": ADAPTER_VERSION,
        "data_status": "stub",
        "source": "sec_edgar",
        "as_of": stamp,
        "export_id": EXPORT_ID,
        "filing_forms": list(FILING_FORMS),
        "watchlists": {
            "cloud": [entry["ticker"] for entry in CLOUD_TICKERS],
            "miner": [entry["ticker"] for entry in MINER_TICKERS],
        },
        "unprocessed_filing_count": 0,
        "unprocessed_filings": [],
        "processed_filings": [],
        "red_indicator": {
            "active": False,
            "trade_ids": list(TRADE_IDS_BY_CATEGORY["cloud"] + TRADE_IDS_BY_CATEGORY["miner"]),
            "reason": None,
        },
        "lineage": {
            "scan_mode": "stub",
            "last_scan_at": None,
            "fetch_errors": [],
            "notes": "Run sec_filing_watcher scan to poll EDGAR Atom feeds",
        },
    }


def write_filings_manifest_stub(out_path: Optional[Path] = None, *, as_of: Optional[str] = None) -> Path:
    path = Path(out_path or DEFAULT_OUT)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = build_filings_manifest_stub(as_of=as_of)
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    return path


def _normalize_accession(raw: str) -> str:
    text = re.sub(r"[^0-9A-Za-z-]", "", (raw or "").strip())
    return text


def _form_from_title(title: str) -> Optional[str]:
    upper = (title or "").upper()
    for form in FILING_FORMS:
        if upper.startswith(form) or f"{form} -" in upper or f"{form} –" in upper:
            return form
    return None


def _filing_id(ticker: str, form_type: str, accession: str) -> str:
    acc = _normalize_accession(accession).replace("-", "")
    return f"{ticker.lower()}-{form_type.lower()}-{acc or 'unknown'}"


def _entry_accession(entry: ET.Element, link_href: str) -> str:
    summary = entry.findtext("atom:summary", default="", namespaces=ATOM_NS)
    match = re.search(r"Accession Number:\s*([0-9-]+)", summary or "", re.I)
    if match:
        return match.group(1)
    match = re.search(r"/Archives/edgar/data/\d+/([0-9-]+)/", link_href or "", re.I)
    if match:
        return match.group(1)
    updated = entry.findtext("atom:updated", default="", namespaces=ATOM_NS)
    return updated.replace(":", "").replace("-", "").replace("T", "").replace("Z", "")[:18]


def parse_edgar_atom(
    xml_text: str,
    *,
    ticker: str,
    company: str,
    cik: str,
    category: str,
    expected_form: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Parse SEC EDGAR Atom feed entries into normalized filing records."""
    root = ET.fromstring(xml_text)
    trade_ids = list(TRADE_IDS_BY_CATEGORY.get(category, ()))
    filings: list[dict[str, Any]] = []

    for entry in root.findall("atom:entry", ATOM_NS):
        title = entry.findtext("atom:title", default="", namespaces=ATOM_NS).strip()
        form_type = _form_from_title(title)
        if form_type is None:
            continue
        if expected_form and form_type != expected_form:
            continue
        if form_type not in FILING_FORMS:
            continue

        link = entry.find("atom:link", ATOM_NS)
        href = link.attrib.get("href", "") if link is not None else ""
        filed_at = entry.findtext("atom:updated", default="", namespaces=ATOM_NS)
        filed_date = filed_at[:10] if filed_at else None
        accession = _entry_accession(entry, href)

        filings.append(
            {
                "filing_id": _filing_id(ticker, form_type, accession),
                "ticker": ticker,
                "company": company,
                "cik": cik,
                "category": category,
                "form_type": form_type,
                "filed_at": filed_date,
                "accession_number": accession,
                "edgar_url": href or _edgar_atom_url(cik, form_type),
                "title": title,
                "processed": False,
                "trade_ids": trade_ids,
            }
        )
    return filings


def _edgar_atom_url(cik: str, form_type: str) -> str:
    params = {
        "action": "getcompany",
        "CIK": cik,
        "type": form_type,
        "dateb": "",
        "owner": "include",
        "count": "10",
        "output": "atom",
    }
    return f"{EDGAR_ATOM_URL}?{urllib.parse.urlencode(params)}"


def default_fetcher(url: str, headers: dict[str, str], *, timeout: float = 30.0) -> Optional[str]:
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None


def fetch_edgar_atom(
    cik: str,
    form_type: str,
    *,
    fetcher: Optional[FetchFn] = None,
) -> Optional[str]:
    url = _edgar_atom_url(cik, form_type)
    headers = {
        "User-Agent": edgar_user_agent(),
        "Accept": "application/atom+xml, application/xml, text/xml, */*",
    }
    fetch = fetcher or default_fetcher
    return fetch(url, headers)


def _processed_ids(manifest: dict[str, Any]) -> set[str]:
    processed = manifest.get("processed_filings", [])
    if not isinstance(processed, list):
        return set()
    ids: set[str] = set()
    for item in processed:
        if isinstance(item, str):
            ids.add(item)
        elif isinstance(item, dict) and item.get("filing_id"):
            ids.add(str(item["filing_id"]))
    return ids


def _dedupe_filings(filings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for filing in filings:
        fid = filing.get("filing_id")
        if not fid or fid in seen:
            continue
        seen.add(fid)
        out.append(filing)
    return out


def scan_edgar_filings(
    manifest: Optional[dict[str, Any]] = None,
    *,
    fetcher: Optional[FetchFn] = None,
    live: bool = False,
) -> dict[str, Any]:
    """Poll EDGAR Atom feeds and diff against processed_filings in manifest."""
    base = manifest or build_filings_manifest_stub()
    merged = json.loads(json.dumps(base))
    processed_ids = _processed_ids(merged)
    discovered: list[dict[str, Any]] = []
    errors: list[str] = []

    watch_groups = (
        ("cloud", CLOUD_TICKERS),
        ("miner", MINER_TICKERS),
    )

    if not live:
        merged["data_status"] = "stub"
        merged["unprocessed_filings"] = []
        merged["unprocessed_filing_count"] = 0
        merged["red_indicator"]["active"] = False
        merged["red_indicator"]["reason"] = None
        merged["lineage"]["scan_mode"] = "stub"
        merged["lineage"]["last_scan_at"] = _utc_now()
        merged["as_of"] = _utc_now()
        return merged

    for category, entries in watch_groups:
        for entry in entries:
            ticker = entry["ticker"]
            for form_type in FILING_FORMS:
                xml_text = fetch_edgar_atom(entry["cik"], form_type, fetcher=fetcher)
                if xml_text is None:
                    errors.append(f"{ticker}:{form_type}:fetch_failed")
                    continue
                try:
                    parsed = parse_edgar_atom(
                        xml_text,
                        ticker=ticker,
                        company=entry["company"],
                        cik=entry["cik"],
                        category=category,
                        expected_form=form_type,
                    )
                except ET.ParseError:
                    errors.append(f"{ticker}:{form_type}:parse_failed")
                    continue
                discovered.extend(parsed)

    discovered = _dedupe_filings(discovered)
    unprocessed = [f for f in discovered if f.get("filing_id") not in processed_ids]

    merged["unprocessed_filings"] = unprocessed
    merged["unprocessed_filing_count"] = len(unprocessed)
    merged["red_indicator"]["active"] = len(unprocessed) > 0
    merged["red_indicator"]["reason"] = (
        f"{len(unprocessed)} unprocessed filing(s) awaiting operator review" if unprocessed else None
    )
    merged["data_status"] = "live" if discovered else ("partial" if errors else "stub")
    merged["as_of"] = _utc_now()
    merged["lineage"]["scan_mode"] = "edgar_atom"
    merged["lineage"]["last_scan_at"] = _utc_now()
    merged["lineage"]["fetch_errors"] = errors
    merged["lineage"]["notes"] = None
    return merged


def red_indicator_active(manifest: dict[str, Any]) -> bool:
    indicator = manifest.get("red_indicator", {})
    if isinstance(indicator, dict) and indicator.get("active"):
        return True
    count = manifest.get("unprocessed_filing_count", 0)
    return isinstance(count, int) and count > 0


def mark_filing_processed(manifest: dict[str, Any], filing_id: str) -> dict[str, Any]:
    """Operator action — move filing from unprocessed to processed (Chunk 31 hook)."""
    merged = json.loads(json.dumps(manifest))
    processed_ids = _processed_ids(merged)
    processed_ids.add(filing_id)

    remaining: list[dict[str, Any]] = []
    marked: Optional[dict[str, Any]] = None
    for filing in merged.get("unprocessed_filings", []):
        if filing.get("filing_id") == filing_id:
            marked = {**filing, "processed": True, "processed_at": _utc_now()}
            continue
        remaining.append(filing)

    processed_list = list(merged.get("processed_filings", []))
    if marked is not None:
        processed_list.append(marked)
    elif filing_id not in {p if isinstance(p, str) else p.get("filing_id") for p in processed_list}:
        processed_list.append({"filing_id": filing_id, "processed_at": _utc_now()})

    merged["processed_filings"] = processed_list
    merged["unprocessed_filings"] = remaining
    merged["unprocessed_filing_count"] = len(remaining)
    merged["red_indicator"]["active"] = len(remaining) > 0
    merged["red_indicator"]["reason"] = (
        f"{len(remaining)} unprocessed filing(s) awaiting operator review" if remaining else None
    )
    merged["as_of"] = _utc_now()
    return merged


def validate_filings_manifest(doc: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(doc, dict):
        return ["root: expected object"]

    for key in (
        "schema_version",
        "adapter_version",
        "data_status",
        "source",
        "export_id",
        "unprocessed_filings",
        "unprocessed_filing_count",
        "processed_filings",
        "red_indicator",
    ):
        if key not in doc:
            errors.append(f"{key}: required")

    if doc.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version: expected {SCHEMA_VERSION!r}")
    if doc.get("adapter_version") != ADAPTER_VERSION:
        errors.append(f"adapter_version: expected {ADAPTER_VERSION!r}")
    if doc.get("data_status") not in {"stub", "partial", "live"}:
        errors.append(f"data_status: invalid {doc.get('data_status')!r}")

    count = doc.get("unprocessed_filing_count")
    filings = doc.get("unprocessed_filings")
    if not isinstance(count, int) or count < 0:
        errors.append("unprocessed_filing_count: expected non-negative integer")
    elif isinstance(filings, list) and count != len(filings):
        errors.append("unprocessed_filing_count: mismatch with unprocessed_filings length")

    indicator = doc.get("red_indicator")
    if not isinstance(indicator, dict):
        errors.append("red_indicator: expected object")
    elif indicator.get("active") and count == 0:
        errors.append("red_indicator.active: true but unprocessed_filing_count is 0")

    if isinstance(filings, list):
        for idx, filing in enumerate(filings):
            if not isinstance(filing, dict):
                errors.append(f"unprocessed_filings[{idx}]: expected object")
                continue
            for field in ("filing_id", "ticker", "form_type", "category", "processed"):
                if field not in filing:
                    errors.append(f"unprocessed_filings[{idx}].{field}: required")
            if filing.get("processed") is not False:
                errors.append(f"unprocessed_filings[{idx}].processed: expected false")

    return errors


def ingest_filings_manifest(
    *,
    out_path: Optional[Path] = None,
    force_stub: bool = False,
    fetcher: Optional[FetchFn] = None,
    live: bool = False,
) -> dict[str, Any]:
    target = Path(out_path or DEFAULT_OUT)
    existing: Optional[dict[str, Any]] = None
    if target.is_file():
        try:
            existing = json.loads(target.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = None

    base = existing or build_filings_manifest_stub()
    doc = scan_edgar_filings(base, fetcher=fetcher, live=live and not force_stub)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    return doc


def main(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Scan SEC EDGAR filings into Litmus filings_manifest.json.")
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="Output path for bang_bang_da/litmus/filings_manifest.json",
    )
    parser.add_argument(
        "--stub-only",
        action="store_true",
        help="Write typed stub without EDGAR network scan",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Poll EDGAR Atom feeds (requires network + SEC User-Agent)",
    )
    parser.add_argument(
        "--mark-processed",
        type=str,
        default=None,
        help="Mark a filing_id processed and update manifest",
    )
    args = parser.parse_args(argv)

    if args.mark_processed:
        if not args.out.is_file():
            write_filings_manifest_stub(args.out)
        manifest = json.loads(args.out.read_text(encoding="utf-8"))
        updated = mark_filing_processed(manifest, args.mark_processed)
        args.out.write_text(json.dumps(updated, indent=2) + "\n", encoding="utf-8")
        print(f"marked processed {args.mark_processed} remaining={updated['unprocessed_filing_count']}")
        return 0

    if args.stub_only:
        path = write_filings_manifest_stub(args.out)
        print(f"wrote stub {path}")
        return 0

    doc = ingest_filings_manifest(out_path=args.out, force_stub=False, live=args.live)
    print(
        f"wrote {args.out} data_status={doc.get('data_status')} "
        f"unprocessed={doc.get('unprocessed_filing_count')} red={doc.get('red_indicator', {}).get('active')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())