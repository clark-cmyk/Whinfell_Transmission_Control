"""Pre-chain quarantine for legacy Barchart greeks/options collect noise.

Authority: Cousins ``data_dictionary.yaml`` (read-only) — ``file_naming_conventions``
staged_contract + normalize_rules for datasets ``greeks`` / ``options``.
"""

from __future__ import annotations

import fnmatch
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

COLLECT_NOISE_DATASETS: tuple[str, ...] = ("greeks", "options")
QUARANTINE_REL = Path("quarantine") / "collect_noise"
STAGED_ROOT_NAME = "staged_raw"
SOURCE_BARCHART = "barchart"

# Cousins staged_csv.FILENAME_RE — canonical observation_row contract only.
STAGED_CANONICAL_RE = re.compile(
    r"^(?P<dataset>greeks|options)_(?P<date>\d{8})_(?P<time>\d{4})\.csv$",
    re.IGNORECASE,
)


@dataclass
class NoiseFile:
    path: Path
    dataset: str
    reason: str  # malformed_filename | no_adapter


@dataclass
class QuarantineResult:
    moved: int = 0
    malformed: int = 0
    no_adapter: int = 0
    skipped: int = 0
    actions: list[str] = field(default_factory=list)
    quarantine_dir: str = ""

    def summary_lines(self) -> list[str]:
        lines = [
            "staged_noise_quarantine_ok",
            f"moved={self.moved} malformed={self.malformed} no_adapter={self.no_adapter} skipped={self.skipped}",
        ]
        if self.quarantine_dir:
            lines.append(f"quarantine_dir={self.quarantine_dir}")
        lines.extend(self.actions)
        return lines


def _load_dictionary(pipeline_root: Path) -> dict[str, Any]:
    path = pipeline_root / "whinfell_pipeline" / "data_dictionary.yaml"
    if not path.is_file():
        return {}
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def dictionary_noise_globs(data: dict[str, Any]) -> dict[str, list[str]]:
    """Vendor detect globs for greeks/options from normalize_rules."""
    rules = (data.get("file_naming_conventions") or {}).get("normalize_rules") or []
    out: dict[str, list[str]] = {ds: [] for ds in COLLECT_NOISE_DATASETS}
    for rule in rules:
        ds = str(rule.get("dataset", ""))
        glob_pat = rule.get("detect_glob")
        if ds in out and glob_pat:
            g = str(glob_pat)
            if g not in out[ds]:
                out[ds].append(g)
    return out


def staged_dataset_dir(staged_root: Path, dataset: str) -> Path:
    return staged_root / f"source={SOURCE_BARCHART}" / f"dataset={dataset}"


def classify_collect_noise(
    filename: str,
    *,
    dataset: str,
    vendor_globs: dict[str, list[str]] | None = None,
) -> str | None:
    """Return noise reason or None if file should stay pending."""
    if not filename.lower().endswith(".csv") or filename.startswith("."):
        return None
    if dataset not in COLLECT_NOISE_DATASETS:
        return None

    if STAGED_CANONICAL_RE.match(filename):
        # Well-formed greeks_/options_ staged names have no daily-chain ingest adapter.
        return "no_adapter"

    globs = (vendor_globs or {}).get(dataset, [])
    if any(fnmatch.fnmatch(filename, pat) for pat in globs):
        return "malformed_filename"

    # Finder duplicate suffix (`` 2.csv``), parens, or other non-contract names.
    return "malformed_filename"


BARCHART_RESIDUAL_DATASETS: tuple[str, ...] = ("futures_intraday", "futures_daily")


_PROBE_SCRIPT = """\
import sys
from pathlib import Path
from whinfell_pipeline.staged_csv import (
    StagedFile,
    csv_to_adapter_payload,
    read_csv_payload,
    validate_filename,
    validate_staged_file,
)
from whinfell_pipeline.adapters.registry import parse_with_best_adapter

path = Path(sys.argv[1])
source, dataset, name = sys.argv[2], sys.argv[3], sys.argv[4]
staged = StagedFile(path=path, source=source, dataset=dataset, filename=name)
fn_val = validate_filename(name)
if not fn_val.ok:
    print("malformed_filename")
    raise SystemExit(0)
val = validate_staged_file(staged)
if not val.ok:
    print("header_fail")
    raise SystemExit(0)
try:
    rows, _ = read_csv_payload(path)
    payload = csv_to_adapter_payload(staged, rows)
    adapter, parsed = parse_with_best_adapter(payload)
    if adapter is None or not parsed.ok:
        print("no_adapter")
        raise SystemExit(0)
except Exception:
    print("no_adapter")
    raise SystemExit(0)
print("ok")
"""


def probe_collect_failure(
    path: Path,
    *,
    source: str,
    dataset: str,
    pipeline_root: Path,
) -> str | None:
    """Return failure reason via Cousins subprocess (avoids TC module shadowing)."""
    proc = subprocess.run(
        [sys.executable, "-c", _PROBE_SCRIPT, str(path), source, dataset, path.name],
        cwd=str(pipeline_root),
        capture_output=True,
        text=True,
    )
    reason = (proc.stdout or "").strip()
    if reason == "ok" or not reason:
        return None
    return reason


def scan_barchart_residual_noise(
    staged_root: Path,
    *,
    pipeline_root: Path,
    skip_datasets: tuple[str, ...] = COLLECT_NOISE_DATASETS,
) -> list[NoiseFile]:
    """Probe remaining barchart pending CSVs outside greeks/options."""
    noise: list[NoiseFile] = []
    for dataset in BARCHART_RESIDUAL_DATASETS:
        if dataset in skip_datasets:
            continue
        pending_dir = staged_dataset_dir(staged_root, dataset)
        if not pending_dir.is_dir():
            continue
        for path in sorted(pending_dir.iterdir()):
            if not path.is_file() or path.suffix.lower() != ".csv":
                continue
            reason = probe_collect_failure(
                path, source=SOURCE_BARCHART, dataset=dataset, pipeline_root=pipeline_root
            )
            if reason:
                noise.append(NoiseFile(path=path, dataset=dataset, reason=reason))
    return noise


def scan_collect_noise(
    staged_root: Path,
    *,
    pipeline_root: Path | None = None,
) -> list[NoiseFile]:
    data = _load_dictionary(pipeline_root) if pipeline_root else {}
    vendor_globs = dictionary_noise_globs(data)
    noise: list[NoiseFile] = []

    for dataset in COLLECT_NOISE_DATASETS:
        pending = staged_dataset_dir(staged_root, dataset)
        if not pending.is_dir():
            continue
        for path in sorted(pending.iterdir()):
            if not path.is_file():
                continue
            reason = classify_collect_noise(path.name, dataset=dataset, vendor_globs=vendor_globs)
            if reason:
                noise.append(NoiseFile(path=path, dataset=dataset, reason=reason))
    return noise


def quarantine_collect_noise(
    staged_root: Path,
    *,
    pipeline_root: Path | None = None,
    when: datetime | None = None,
    dry_run: bool = False,
) -> QuarantineResult:
    """Move greeks/options collect noise to staged_raw/quarantine/collect_noise/YYYYMMDD/."""
    if os.environ.get("WHINFELL_STAGED_NOISE", "1").strip().lower() in ("0", "false", "no"):
        return QuarantineResult()

    staged_root = staged_root.expanduser().resolve()
    if not staged_root.is_dir():
        return QuarantineResult()

    when = when or datetime.now()
    bucket = when.strftime("%Y%m%d")
    dest_dir = staged_root / QUARANTINE_REL / bucket
    result = QuarantineResult(quarantine_dir=str(dest_dir))

    candidates: list[NoiseFile] = list(scan_collect_noise(staged_root, pipeline_root=pipeline_root))
    if pipeline_root:
        candidates.extend(
            scan_barchart_residual_noise(staged_root, pipeline_root=pipeline_root)
        )

    seen: set[Path] = set()
    for item in candidates:
        if item.path in seen:
            continue
        seen.add(item.path)
        dest = _unique_dest(dest_dir / item.path.name)
        rel_src = item.path.relative_to(staged_root)
        action = f"quarantine {rel_src} reason={item.reason} -> {dest.relative_to(staged_root)}"
        result.actions.append(action)
        if item.reason == "malformed_filename":
            result.malformed += 1
        elif item.reason == "no_adapter":
            result.no_adapter += 1
        if dry_run:
            result.moved += 1
            continue
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(item.path), str(dest))
        result.moved += 1

    return result


def _unique_dest(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    for i in range(2, 1000):
        candidate = dest.with_name(f"{stem}__{i}{suffix}")
        if not candidate.exists():
            return candidate
    return dest.with_name(f"{stem}__dup{suffix}")