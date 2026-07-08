"""Archive stale CSVs from whinfell_drop before auto-download runs."""

from __future__ import annotations

import os
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path


DEFAULT_KEEP_DAYS = 2
ARCHIVE_SUBDIR = Path("data") / "archive" / "drop"


@dataclass
class ArchiveResult:
    moved: int = 0
    kept: int = 0
    skipped: int = 0
    actions: list[str] = field(default_factory=list)


def archive_stale_drop_csvs(
    drop_dir: Path,
    *,
    repo_root: Path | None = None,
    keep_days: int = DEFAULT_KEEP_DAYS,
    dry_run: bool = False,
) -> ArchiveResult:
    """Move drop-root CSVs older than the keep window into data/archive/drop/YYYYMMDD/."""
    if os.environ.get("WHINFELL_DROP_ARCHIVE", "1").strip().lower() in ("0", "false", "no"):
        return ArchiveResult()

    drop = drop_dir.expanduser()
    if not drop.is_dir():
        return ArchiveResult()

    root = (repo_root or Path.cwd()).expanduser()
    archive_base = root / ARCHIVE_SUBDIR
    cutoff = _cutoff_datetime(keep_days)
    result = ArchiveResult()

    for path in sorted(drop.iterdir()):
        if not path.is_file() or path.suffix.lower() != ".csv":
            result.skipped += 1
            continue

        mtime = datetime.fromtimestamp(path.stat().st_mtime)
        if mtime >= cutoff:
            result.kept += 1
            continue

        bucket = mtime.strftime("%Y%m%d")
        dest_dir = archive_base / bucket
        dest = _unique_dest(dest_dir / path.name)
        action = f"archive {path.name} -> {dest.relative_to(root)}"
        result.actions.append(action)
        if dry_run:
            result.moved += 1
            continue

        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(path), str(dest))
        result.moved += 1

    return result


def _cutoff_datetime(keep_days: int) -> datetime:
    """Local midnight at the start of the oldest day to retain."""
    if keep_days < 1:
        keep_days = 1
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return today - timedelta(days=keep_days - 1)


def _unique_dest(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    n = 1
    while True:
        candidate = dest.with_name(f"{stem}__dup{n}{suffix}")
        if not candidate.exists():
            return candidate
        n += 1