#!/usr/bin/env python3
"""Scaffold tests for auto_download v1."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.manifest import (
    load_core_exports,
    locked_manifest_path,
    resolve_manifest_root,
    resolve_pipeline_root,
    resolve_tc_root,
)
from whinfell_pipeline.auto_download.orchestrator import ExportOrchestrator
from whinfell_pipeline.auto_download.targets import CORE_EXPORT_IDS, REQUIRED_FOR_CHAIN
from whinfell_pipeline.auto_download.validators import (
    build_export_raw_patterns,
    find_matching_files,
    koyfin_watchlist_export_patterns,
    pattern_matches,
    validate_csv,
    validate_export_csv,
)


def test_pipeline_root_detected() -> None:
    root = resolve_pipeline_root()
    assert root is not None, "Cousins pipeline should be on Desktop"
    assert (root / "run_batch_collect.py").is_file()


def test_core_exports_loaded() -> None:
    targets, root = load_core_exports()
    assert root is not None
    assert root == resolve_tc_root().resolve()
    assert locked_manifest_path().is_file()
    assert "OLD_2238_ARCHIVE" not in str(resolve_manifest_root())
    assert len(targets) == len(CORE_EXPORT_IDS)
    ids = {t.id for t in targets}
    assert ids == set(CORE_EXPORT_IDS)
    intraday = next(t for t in targets if t.id == "barchart_futures_intraday")
    assert "197689" in intraday.url
    assert intraday.raw_patterns, "intraday should have filename patterns"


def test_orchestrator_plan_and_status() -> None:
    orch = ExportOrchestrator(drop_dir=REPO / "data" / "staged")
    assert len(orch.plan()) == len(CORE_EXPORT_IDS)
    payload = orch.status()
    assert payload["export_count"] == len(CORE_EXPORT_IDS)
    assert "missing_required" in payload
    assert set(REQUIRED_FOR_CHAIN).issubset({t.id for t in orch.targets})


def test_fetch_unknown_id_raises() -> None:
    orch = ExportOrchestrator()
    try:
        orch.fetch_one("not_a_real_export")
        raise AssertionError("expected ValueError")
    except ValueError as exc:
        assert "unknown export id" in str(exc)


def test_cli_plan() -> None:
    proc = subprocess.run(
        [sys.executable, str(REPO / "run_auto_download.py"), "plan"],
        cwd=str(REPO),
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr
    assert "barchart_futures_intraday" in proc.stdout
    assert "koyfin_import_core" in proc.stdout


def test_koyfin_watchlist_filename_patterns() -> None:
    patterns = koyfin_watchlist_export_patterns("WTM-Rates-Credit")
    assert "koyfin_WTM-Rates-Credit_*" in patterns
    sample = "koyfin_WTM-Rates-Credit_2026.07.04_11.00.02.029.csv"
    assert any(pattern_matches(pat, sample) for pat in patterns)

    built = build_export_raw_patterns(
        source="koyfin",
        saved_view="WTM-China-Policy",
        canonical_name="china_policy_{YYYYMMDD}_{HHMM}.csv",
        explicit_patterns=["WTM-China-Policy.csv"],
    )
    china = "koyfin_WTM-China-Policy_2026.07.04_11.00.08.268.csv"
    assert any(pattern_matches(pat, china) for pat in built)


def test_status_recognizes_koyfin_wtm_exports() -> None:
    drop = Path.home() / "Downloads" / "whinfell_drop"
    if not drop.is_dir():
        return
    targets, _ = load_core_exports()
    rates = next(t for t in targets if t.id == "koyfin_rates")
    matches = find_matching_files(drop, rates.raw_patterns)
    if not any(name.startswith("koyfin_WTM-Rates-Credit_") for name in (p.name for p in matches)):
        return
    ok = [p for p in matches if validate_export_csv(p, source="koyfin")[0]]
    assert ok, "koyfin rates export should validate when present in drop"

    orch = ExportOrchestrator(drop_dir=drop)
    payload = orch.status()
    rates_row = next(row for row in payload["exports"] if row["id"] == "koyfin_rates")
    assert rates_row["ready"], rates_row
    assert payload["required_ready"], payload


def test_validators() -> None:
    assert pattern_matches("watchlist-*-intraday-*.csv", "watchlist-wtm-intraday-07-03-2026.csv")
    sample = REPO / "tests" / "_tmp_sample.csv"
    sample.write_text(
        "date,close,volume\n" + "\n".join(f"2026-07-{d:02d},{100 + d},{500 + d}" for d in range(1, 8)) + "\n",
        encoding="utf-8",
    )
    try:
        ok, reason = validate_csv(sample)
        assert ok and reason == "ok"
    finally:
        sample.unlink(missing_ok=True)


def main() -> int:
    tests = [
        test_pipeline_root_detected,
        test_core_exports_loaded,
        test_orchestrator_plan_and_status,
        test_fetch_unknown_id_raises,
        test_cli_plan,
        test_koyfin_watchlist_filename_patterns,
        test_status_recognizes_koyfin_wtm_exports,
        test_validators,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_auto_download_scaffold.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())