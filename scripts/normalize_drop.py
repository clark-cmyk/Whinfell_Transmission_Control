#!/usr/bin/env python3
"""Normalize whinfell_drop filenames — TC-local staging with relaxed quarantine rules.

Accepts common Comet/Barchart/Koyfin export patterns that prior strict matchers
misclassified. Unknown files go to quarantine/ with reason codes; good files
land in staged/ with canonical names.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

CANONICAL_PATTERNS = [
    (re.compile(r"credit", re.I), "credit_snapshot.csv"),
    (re.compile(r"liquidity|rates|2s10s|curve", re.I), "liquidity_snapshot.csv"),
    (re.compile(r"breadth|iwm|spy|participation", re.I), "breadth_snapshot.csv"),
    (re.compile(r"high\s*beta|ibit|qqq|btc", re.I), "highbeta_snapshot.csv"),
    (re.compile(r"basis|spread|calendar", re.I), "basis_snapshot.csv"),
    (re.compile(r"WTM-?Flows|flows", re.I), "flows_snapshot.csv"),
    (re.compile(r"koyfin", re.I), "koyfin_export.csv"),
    (re.compile(r"barchart|historical", re.I), "barchart_export.csv"),
]

SKIP_NAMES = {".ds_store", "thumbs.db", ".gitkeep"}
MIN_BYTES = 48


@dataclass
class FileResult:
    src: Path
    action: str
    dest: Path | None = None
    reason: str = ""


def file_fingerprint(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def classify(name: str) -> str | None:
    for pat, canonical in CANONICAL_PATTERNS:
        if pat.search(name):
            return canonical
    if name.lower().endswith(".csv"):
        return "misc_export.csv"
    if name.lower().endswith(".json"):
        return "sidecar.json"
    return None


def normalize_drop(drop_dir: Path, staged_dir: Path, quarantine_dir: Path, dry_run: bool = False) -> dict:
    accepted: list[FileResult] = []
    quarantined: list[FileResult] = []
    skipped: list[FileResult] = []

    if not drop_dir.is_dir():
        raise SystemExit(f"drop_dir missing: {drop_dir}")

    staged_dir.mkdir(parents=True, exist_ok=True)
    quarantine_dir.mkdir(parents=True, exist_ok=True)

    seen_hashes: set[str] = set()

    for src in sorted(drop_dir.iterdir()):
        if not src.is_file():
            continue
        if src.name.startswith(".") or src.name.lower() in SKIP_NAMES:
            skipped.append(FileResult(src, "skip", reason="hidden_or_system"))
            continue
        if src.stat().st_size < MIN_BYTES:
            quarantined.append(FileResult(src, "quarantine", reason="too_small"))
            dest = quarantine_dir / src.name
            if not dry_run:
                shutil.copy2(src, dest)
            continue

        fp = file_fingerprint(src)
        if fp in seen_hashes:
            skipped.append(FileResult(src, "skip", reason="duplicate_hash"))
            continue
        seen_hashes.add(fp)

        canonical = classify(src.name)
        if not canonical:
            quarantined.append(FileResult(src, "quarantine", reason="unrecognized_pattern"))
            dest = quarantine_dir / src.name
            if not dry_run:
                shutil.copy2(src, dest)
            continue

        stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
        dest_name = f"{stamp}_{canonical}" if canonical.endswith(".csv") else canonical
        dest = staged_dir / dest_name
        if dest.exists():
            dest = staged_dir / f"{stamp}_{src.stem}_{canonical}"

        accepted.append(FileResult(src, "accept", dest, reason=canonical))
        if not dry_run:
            shutil.copy2(src, dest)

    return {
        "drop_dir": str(drop_dir),
        "staged_dir": str(staged_dir),
        "quarantine_dir": str(quarantine_dir),
        "accepted": len(accepted),
        "quarantined": len(quarantined),
        "skipped": len(skipped),
        "accepted_files": [r.dest.name if r.dest else "" for r in accepted],
        "quarantine_reasons": [f"{r.src.name}:{r.reason}" for r in quarantined],
        "dry_run": dry_run,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize whinfell_drop → staged/ + quarantine/")
    parser.add_argument("drop_dir", nargs="?", default=str(Path.home() / "Downloads" / "whinfell_drop"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--staged", default="")
    parser.add_argument("--quarantine", default="")
    args = parser.parse_args()

    drop = Path(args.drop_dir).expanduser()
    root = Path(__file__).resolve().parent.parent
    staged = Path(args.staged) if args.staged else root / "data" / "staged"
    quarantine = Path(args.quarantine) if args.quarantine else root / "data" / "quarantine"

    summary = normalize_drop(drop, staged, quarantine, dry_run=args.dry_run)
    print(f"accepted={summary['accepted']} quarantined={summary['quarantined']} skipped={summary['skipped']}")
    for name in summary["accepted_files"]:
        print(f"  → staged/{name}")
    for reason in summary["quarantine_reasons"]:
        print(f"  ⚠ quarantine {reason}")


if __name__ == "__main__":
    main()