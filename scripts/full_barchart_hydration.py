#!/usr/bin/env python3
"""Barchart intraday download helper — resilient to flaky Comet browser output.

Opens download pages with retry/backoff, validates saved CSVs before staging,
and writes a run manifest with freshness metadata for latest.json consumers.
"""
from __future__ import annotations

import json
import sys
import time
import webbrowser
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "barchart"
MANIFEST_PATH = DATA_DIR / "v1" / "barchart_run_manifest.json"

TICKERS = {
    "futures": ["ES", "NQ", "YM", "RTY", "CL", "GC", "SI", "PL", "HG", "ZB", "ZN", "ZF"],
    "options": ["ES", "NQ", "CL", "GC", "SI"],
    "greeks": ["ES", "NQ", "CL", "GC"],
}

MIN_CSV_BYTES = 120
RETRY_DELAY_SEC = 2.0
MAX_OPEN_RETRIES = 2


@dataclass
class DownloadTask:
    dataset: str
    ticker: str
    url: str
    expected_path: Path
    status: str = "pending"
    bytes: int = 0
    retries: int = 0
    error: str = ""


def barchart_url(dataset: str, ticker: str) -> str:
    base = "https://www.barchart.com"
    if dataset == "futures":
        return f"{base}/futures/quotes/{ticker}*0/profile/historical-download"
    if dataset == "options":
        return f"{base}/options/quotes/{ticker}*0/historical-download"
    return f"{base}/options/greeks/{ticker}"


def validate_csv(path: Path) -> tuple[bool, str]:
    if not path.is_file():
        return False, "missing"
    size = path.stat().st_size
    if size < MIN_CSV_BYTES:
        return False, f"too_small:{size}"
    head = path.read_text(encoding="utf-8", errors="replace")[:400].lower()
    if "date" not in head and "time" not in head:
        return False, "no_date_column"
    if "<html" in head or "<!doctype" in head:
        return False, "html_not_csv"
    return True, "ok"


def open_with_retry(url: str, retries: int = MAX_OPEN_RETRIES) -> bool:
    for attempt in range(retries + 1):
        try:
            webbrowser.open(url)
            return True
        except Exception as exc:  # noqa: BLE001 — browser launch is environment-specific
            if attempt >= retries:
                return False
            time.sleep(RETRY_DELAY_SEC * (attempt + 1))
            print(f"  retry open ({attempt + 1}/{retries}): {exc}", file=sys.stderr)
    return False


def scan_existing_downloads() -> dict[str, dict]:
    supplements: dict[str, dict] = {}
    for csv in DATA_DIR.rglob("*.csv"):
        ok, reason = validate_csv(csv)
        supplements[csv.stem] = {
            "path": str(csv.relative_to(ROOT)),
            "fetch_mode": "file_only" if ok else "invalid",
            "validation": reason,
            "bytes": csv.stat().st_size if csv.is_file() else 0,
            "as_of": datetime.fromtimestamp(csv.stat().st_mtime, tz=timezone.utc).isoformat(),
        }
    return supplements


def write_manifest(tasks: list[DownloadTask], supplements: dict[str, dict]) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    ok_count = sum(1 for s in supplements.values() if s.get("validation") == "ok")
    failed = sum(1 for s in supplements.values() if s.get("validation") != "ok")
    manifest = {
        "version": "1.1.0",
        "as_of": datetime.now(timezone.utc).isoformat(),
        "freshness_status": "fresh" if ok_count else "stale",
        "symbol_count_ok": ok_count,
        "symbol_count_failed": failed,
        "symbol_count_approved": ok_count,
        "tasks": [asdict(t) for t in tasks],
        "local_supplements": supplements,
        "composite_score_source": "file_scan",
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"==> manifest → {MANIFEST_PATH}")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print("=== Full Barchart Hydration (resilient) ===")
    tasks: list[DownloadTask] = []

    for dataset, tickers in TICKERS.items():
        for ticker in tickers:
            url = barchart_url(dataset, ticker)
            expected = DATA_DIR / f"{dataset}_{ticker}.csv"
            task = DownloadTask(dataset, ticker, url, expected)
            print(f"Opening {dataset}/{ticker}…")
            if open_with_retry(url):
                task.status = "opened"
            else:
                task.status = "open_failed"
                task.error = "browser_open_failed"
            ok, reason = validate_csv(expected)
            if ok:
                task.status = "cached_ok"
                task.bytes = expected.stat().st_size
            elif expected.is_file():
                task.status = "invalid_cached"
                task.error = reason
            tasks.append(task)
            print(f"  → save CSV to {expected} (validate={reason})")

    supplements = scan_existing_downloads()
    write_manifest(tasks, supplements)
    print("\nDownload all CSVs to data/barchart/, then run build script.")
    print(f"local_ok={sum(1 for s in supplements.values() if s['validation']=='ok')} "
          f"local_invalid={sum(1 for s in supplements.values() if s['validation']!='ok')}")


if __name__ == "__main__":
    main()