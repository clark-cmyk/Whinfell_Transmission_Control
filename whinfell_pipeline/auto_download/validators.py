"""CSV drop validation — shared by status checks and future adapters."""

from __future__ import annotations

import fnmatch
from pathlib import Path

MIN_CSV_BYTES = 48
MIN_BARCHART_CSV_BYTES = 120


def validate_csv(path: Path, *, min_bytes: int = MIN_CSV_BYTES) -> tuple[bool, str]:
    if not path.is_file():
        return False, "missing"
    size = path.stat().st_size
    if size < min_bytes:
        return False, f"too_small:{size}"
    head = path.read_text(encoding="utf-8", errors="replace")[:400].lower()
    if "<html" in head or "<!doctype" in head:
        return False, "html_not_csv"
    return True, "ok"


def validate_koyfin_csv(path: Path) -> tuple[bool, str]:
    """Require Ticker/Symbol or Date column in the exported CSV header row."""
    ok, reason = validate_csv(path, min_bytes=MIN_CSV_BYTES)
    if not ok:
        return ok, reason
    head = path.read_text(encoding="utf-8", errors="replace")[:1200].lower()
    if "<html" in head or "<!doctype" in head:
        return False, "html_not_csv"
    first_line = head.splitlines()[0] if head else ""
    if "ticker" in first_line or "symbol" in first_line:
        return True, "ok"
    if "date" in first_line:
        return True, "ok"
    if "ticker" in head or "symbol" in head:
        return True, "ok"
    if "date" in head and ("," in head or "\t" in head):
        return True, "ok"
    return False, "missing_ticker_symbol_or_date"


def validate_barchart_csv(path: Path) -> tuple[bool, str]:
    ok, reason = validate_csv(path, min_bytes=MIN_BARCHART_CSV_BYTES)
    if not ok:
        return ok, reason
    head = path.read_text(encoding="utf-8", errors="replace")[:800].lower()
    if "symbol" not in head:
        return False, "missing_symbol_header"
    if "date" not in head and "time" not in head and "latest" not in head:
        return False, "missing_time_column"
    return True, "ok"


def pattern_matches(pattern: str, filename: str) -> bool:
    lower = filename.lower()
    glob_pat = pattern.replace("{YYYYMMDD}", "*").replace("{HHMM}", "*").lower()
    return fnmatch.fnmatch(lower, glob_pat) or fnmatch.fnmatch(lower, pattern.lower())


def koyfin_watchlist_export_patterns(saved_view: str) -> list[str]:
    """Koyfin Watchlist (/myw/) direct-download filenames."""
    view = (saved_view or "").strip()
    if not view.startswith("WTM-"):
        return []
    return [
        f"koyfin_{view}_*",
        f"koyfin_{view.lower()}_*",
        f"{view}.csv",
        f"{view}*.csv",
    ]


def build_export_raw_patterns(
    *,
    source: str,
    saved_view: str,
    canonical_name: str,
    explicit_patterns: list[str] | None = None,
) -> list[str]:
    patterns: list[str] = []
    canon = (canonical_name or "").strip()
    if canon:
        patterns.append(canon.replace("{YYYYMMDD}", "*").replace("{HHMM}", "*"))
    if explicit_patterns:
        patterns.extend(p for p in explicit_patterns if p)
    if source == "koyfin":
        patterns.extend(koyfin_watchlist_export_patterns(saved_view))
    return list(dict.fromkeys(p for p in patterns if p))


def validate_export_csv(path: Path, *, source: str) -> tuple[bool, str]:
    if source == "koyfin":
        return validate_koyfin_csv(path)
    if source == "barchart":
        return validate_barchart_csv(path)
    return validate_csv(path)


def find_matching_files(drop: Path, patterns: list[str]) -> list[Path]:
    if not drop.is_dir():
        return []
    found: list[Path] = []
    for path in sorted(drop.glob("*.csv")):
        if any(pattern_matches(pat, path.name) for pat in patterns):
            found.append(path)
    return found