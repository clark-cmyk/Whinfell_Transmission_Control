#!/usr/bin/env python3
"""Chunk 3 tests — Barchart intraday validation + adapter guards."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.adapters.barchart import (
    BarchartAdapter,
    BarchartLoginRequired,
)
from whinfell_pipeline.auto_download.manifest import ExportTarget
from whinfell_pipeline.auto_download.orchestrator import ExportOrchestrator
from whinfell_pipeline.auto_download.validators import validate_barchart_csv


SAMPLE = Path.home() / "Downloads" / "watchlist-dailymonitor0610-intraday-06-24-2026.csv"


def test_validate_barchart_sample() -> None:
    assert SAMPLE.is_file(), f"missing sample CSV: {SAMPLE}"
    ok, reason = validate_barchart_csv(SAMPLE)
    assert ok and reason == "ok"


def test_fetch_rejects_non_intraday() -> None:
    adapter = BarchartAdapter()
    target = ExportTarget(
        id="barchart_futures_daily",
        source="barchart",
        saved_view="WTM-Futures-Daily",
        url="https://example.com",
        priority=1,
        canonical_name="daily.csv",
    )
    try:
        adapter.fetch(target, REPO / "data" / "staged")
        raise AssertionError("expected NotImplementedError")
    except NotImplementedError as exc:
        assert "Chunk 3" in str(exc)


def test_orchestrator_has_session() -> None:
    orch = ExportOrchestrator(drop_dir=REPO / "data" / "staged")
    assert orch.session is not None
    assert orch.session.profile_dir.name == "comet_profile"


def test_status_accepts_watchlist_pattern(tmp_path: Path | None = None) -> None:
    drop = REPO / "data" / "staged" / "_barchart_status_probe"
    drop.mkdir(parents=True, exist_ok=True)
    dest = drop / "watchlist-dailymonitor0610-intraday-07-03-2026.csv"
    if SAMPLE.is_file():
        shutil.copy(SAMPLE, dest)
    orch = ExportOrchestrator(drop_dir=drop)
    row = next(e for e in orch.status()["exports"] if e["id"] == "barchart_futures_intraday")
    if SAMPLE.is_file():
        assert row["ready"] is True
        assert row["validation"] == "ok"


def main() -> int:
    tests = [
        test_validate_barchart_sample,
        test_fetch_rejects_non_intraday,
        test_orchestrator_has_session,
        test_status_accepts_watchlist_pattern,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_barchart_adapter.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())