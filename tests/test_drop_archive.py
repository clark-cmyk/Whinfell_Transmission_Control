#!/usr/bin/env python3
"""Tests — whinfell_drop CSV auto-archive."""

from __future__ import annotations

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.drop_archive import archive_stale_drop_csvs


def _touch(path: Path, when: datetime) -> None:
    path.write_text("Ticker,Last Price\nAAA,1\n", encoding="utf-8")
    ts = when.timestamp()
    os.utime(path, (ts, ts))


def test_archives_old_csv_keeps_recent(tmp_path: Path) -> None:
    drop = tmp_path / "drop"
    repo = tmp_path / "repo"
    drop.mkdir()
    repo.mkdir()

    old = drop / "rates_20260601_1200.csv"
    recent = drop / "credit_20260703_1149.csv"
    _touch(old, datetime.now() - timedelta(days=5))
    _touch(recent, datetime.now())

    result = archive_stale_drop_csvs(drop, repo_root=repo, keep_days=2)
    assert result.moved == 1
    assert result.kept == 1
    assert not old.exists()
    assert recent.exists()
    archived = list((repo / "data" / "archive" / "drop").rglob("rates_20260601_1200.csv"))
    assert len(archived) == 1


def test_skips_quarantine_and_non_csv(tmp_path: Path) -> None:
    drop = tmp_path / "drop"
    repo = tmp_path / "repo"
    drop.mkdir()
    repo.mkdir()
    (drop / "quarantine").mkdir()
    _touch(drop / "quarantine" / "bad.csv", datetime.now() - timedelta(days=10))
    (drop / "notes.md").write_text("x", encoding="utf-8")

    result = archive_stale_drop_csvs(drop, repo_root=repo, keep_days=2)
    assert result.moved == 0
    assert (drop / "quarantine" / "bad.csv").exists()


def test_dry_run_does_not_move(tmp_path: Path) -> None:
    drop = tmp_path / "drop"
    repo = tmp_path / "repo"
    drop.mkdir()
    repo.mkdir()
    old = drop / "flows_20260601_1200.csv"
    _touch(old, datetime.now() - timedelta(days=4))

    result = archive_stale_drop_csvs(drop, repo_root=repo, keep_days=2, dry_run=True)
    assert result.moved == 1
    assert old.exists()


def main() -> int:
    tests = [
        test_archives_old_csv_keeps_recent,
        test_skips_quarantine_and_non_csv,
        test_dry_run_does_not_move,
    ]
    for fn in tests:
        with tempfile.TemporaryDirectory() as td:
            fn(Path(td))
        print(f"PASS {fn.__name__}")
    print("PASS test_drop_archive.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())