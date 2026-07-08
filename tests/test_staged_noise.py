#!/usr/bin/env python3
"""Tests — pre-chain greeks/options collect noise quarantine."""

from __future__ import annotations

import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
COUSINS = Path.home() / "Desktop" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE"
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.staged_noise import (
    classify_collect_noise,
    dictionary_noise_globs,
    quarantine_collect_noise,
    scan_collect_noise,
    staged_dataset_dir,
)


def _write(path: Path, content: str = "Symbol,Time,Latest\nES,09:30,1\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_dictionary_loads_greeks_options_globs() -> None:
    if not COUSINS.is_dir():
        return
    from whinfell_pipeline.auto_download.staged_noise import _load_dictionary

    globs = dictionary_noise_globs(_load_dictionary(COUSINS))
    assert "greeks" in globs and "options" in globs
    assert any("volatility-greeks" in g for g in globs["greeks"])
    assert any("options" in g for g in globs["options"])


def test_classify_malformed_and_no_adapter() -> None:
    assert classify_collect_noise("greeks_20260701_0532 2.csv", dataset="greeks") == "malformed_filename"
    assert classify_collect_noise("options_20260629_0959 3.csv", dataset="options") == "malformed_filename"
    assert classify_collect_noise("greeks_20260701_0532.csv", dataset="greeks") == "no_adapter"
    assert classify_collect_noise("options_20260701_0539.csv", dataset="options") == "no_adapter"
    assert classify_collect_noise("futures_intraday_20260703_1021.csv", dataset="futures_intraday") is None


def test_quarantine_moves_noise_preserves_clean(tmp_path: Path) -> None:
    staged = tmp_path / "staged_raw"
    greeks_dir = staged_dataset_dir(staged, "greeks")
    options_dir = staged_dataset_dir(staged, "options")
    intraday = staged / "source=barchart" / "dataset=futures_intraday"

    bad_dup = greeks_dir / "greeks_20260701_0532 2.csv"
    bad_canon = options_dir / "options_20260701_0539.csv"
    keep = intraday / "futures_intraday_20260703_1021.csv"
    _write(bad_dup)
    _write(bad_canon)
    _write(keep)

    result = quarantine_collect_noise(staged, when=datetime(2026, 7, 3, 12, 0, 0))
    assert result.moved == 2
    assert result.malformed == 1
    assert result.no_adapter == 1
    assert not bad_dup.exists()
    assert not bad_canon.exists()
    assert keep.exists()
    qdir = staged / "quarantine" / "collect_noise" / "20260703"
    assert (qdir / "greeks_20260701_0532 2.csv").exists()
    assert (qdir / "options_20260701_0539.csv").exists()


def test_dry_run_and_disable_env(tmp_path: Path) -> None:
    staged = tmp_path / "staged_raw"
    path = staged_dataset_dir(staged, "greeks") / "greeks_20260701_0532.csv"
    _write(path)

    dry = quarantine_collect_noise(staged, dry_run=True)
    assert dry.moved == 1
    assert path.exists()

    os.environ["WHINFELL_STAGED_NOISE"] = "0"
    try:
        off = quarantine_collect_noise(staged)
        assert off.moved == 0
        assert path.exists()
    finally:
        os.environ.pop("WHINFELL_STAGED_NOISE", None)


def test_scan_collect_noise(tmp_path: Path) -> None:
    staged = tmp_path / "staged_raw"
    _write(staged_dataset_dir(staged, "options") / "options_20260701_0556.csv")
    found = scan_collect_noise(staged)
    assert len(found) == 1
    assert found[0].reason == "no_adapter"


def main() -> int:
    tests = [
        test_dictionary_loads_greeks_options_globs,
        test_classify_malformed_and_no_adapter,
        test_quarantine_moves_noise_preserves_clean,
        test_dry_run_and_disable_env,
        test_scan_collect_noise,
    ]
    for fn in tests:
        if fn.__name__ == "test_dictionary_loads_greeks_options_globs":
            fn()
            print(f"PASS {fn.__name__}")
            continue
        with tempfile.TemporaryDirectory() as td:
            if "tmp_path" in fn.__code__.co_varnames:
                fn(Path(td))
            else:
                fn()
            print(f"PASS {fn.__name__}")
    print(f"OK {len(tests)} tests")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())