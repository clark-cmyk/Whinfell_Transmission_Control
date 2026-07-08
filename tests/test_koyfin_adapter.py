#!/usr/bin/env python3
"""Chunk 4 tests — Koyfin Watchlist/Chart validation + adapter guards."""

from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.adapters.koyfin import (
    BLOCKED_SHARE_URL_IDS,
    KoyfinAdapter,
    KoyfinUrlRequired,
    is_exportable_koyfin_url,
    is_forbidden_koyfin_url,
    is_koyfin_chart_url,
    is_koyfin_watchlist_url,
    is_shareable_koyfin_url,
    is_wtm_view_name,
    koyfin_export_route,
    validate_koyfin_target,
)
from whinfell_pipeline.auto_download.manifest import ExportTarget, load_core_exports
from whinfell_pipeline.auto_download.validators import validate_koyfin_csv


SAMPLE = Path.home() / "Downloads" / "koyfin_MYD_WHINFELL CREDIT SCORE_ 58 _ AMBER_2026.06.26_01.15.01.145.csv"


def test_wtm_view_name_rule() -> None:
    assert is_wtm_view_name("WTM-Rates-Credit")
    assert is_wtm_view_name("WTM-Import-Core")
    assert not is_wtm_view_name("Koyfin daily time-series (Date column)")


def test_watchlist_and_chart_url_rules() -> None:
    watchlist = "https://app.koyfin.com/myw/70789aa7-8084-4e4c-85d3-09f9b78dcd3a"
    chart = "https://app.koyfin.com/charts/abc123-def456"
    assert is_koyfin_watchlist_url(watchlist)
    assert is_koyfin_chart_url(chart)
    assert koyfin_export_route(watchlist) == "watchlist"
    assert koyfin_export_route(chart) == "chart"
    assert is_exportable_koyfin_url(watchlist)
    assert is_exportable_koyfin_url(chart)
    assert is_shareable_koyfin_url(watchlist)
    assert not is_exportable_koyfin_url("https://app.koyfin.com/")
    assert not is_exportable_koyfin_url("https://app.koyfin.com/macro/DGS10")
    assert not is_exportable_koyfin_url("https://app.koyfin.com/etf/SPY.US")
    assert not is_exportable_koyfin_url("https://app.koyfin.com/crypto/BTCUSD")
    assert not is_exportable_koyfin_url("${KOYFIN_VIEW_RATES_URL}")


def test_forbidden_myg_myd_paths() -> None:
    myd = "https://app.koyfin.com/myd/88200bcb-2a0a-49d4-81e1-dc7b477ccbf0"
    myg = "https://app.koyfin.com/myg/abc123"
    assert is_forbidden_koyfin_url(myd)
    assert is_forbidden_koyfin_url(myg)
    assert not is_exportable_koyfin_url(myd)
    assert not is_exportable_koyfin_url(myg)
    assert koyfin_export_route(myd) is None


def test_validate_koyfin_sample() -> None:
    assert SAMPLE.is_file(), f"missing sample CSV: {SAMPLE}"
    ok, reason = validate_koyfin_csv(SAMPLE)
    assert ok and reason == "ok"


def test_fetch_rejects_blocked_without_share_url() -> None:
    adapter = KoyfinAdapter()
    for export_id in sorted(BLOCKED_SHARE_URL_IDS):
        target = ExportTarget(
            id=export_id,
            source="koyfin",
            saved_view="WTM-Rates-Credit" if export_id == "koyfin_rates" else (
                "WTM-China-Policy" if export_id == "koyfin_china" else "WTM-Equities-Breadth"
            ),
            url="https://app.koyfin.com/",
            priority=1,
            canonical_name="rates_{YYYYMMDD}_{HHMM}.csv",
            replace_me=True,
        )
        try:
            adapter.fetch(target, REPO / "data" / "staged")
            raise AssertionError(f"expected KoyfinUrlRequired for {export_id}")
        except KoyfinUrlRequired as exc:
            assert "watchlist_or_chart_url_required" in str(exc)


def test_fetch_rejects_generic_assist_url() -> None:
    adapter = KoyfinAdapter()
    target = ExportTarget(
        id="koyfin_rates",
        source="koyfin",
        saved_view="WTM-Rates-Credit",
        url="https://app.koyfin.com/macro/DGS10",
        priority=1,
        canonical_name="rates_{YYYYMMDD}_{HHMM}.csv",
        replace_me=False,
    )
    try:
        adapter.fetch(target, REPO / "data" / "staged")
        raise AssertionError("expected KoyfinUrlRequired")
    except KoyfinUrlRequired as exc:
        assert "watchlist_or_chart_url_required" in str(exc)


def test_fetch_rejects_forbidden_myd_url() -> None:
    adapter = KoyfinAdapter()
    target = ExportTarget(
        id="koyfin_rates",
        source="koyfin",
        saved_view="WTM-Rates-Credit",
        url="https://app.koyfin.com/myd/88200bcb-2a0a-49d4-81e1-dc7b477ccbf0",
        priority=1,
        canonical_name="rates_{YYYYMMDD}_{HHMM}.csv",
        replace_me=False,
    )
    try:
        adapter.fetch(target, REPO / "data" / "staged")
        raise AssertionError("expected KoyfinUrlRequired")
    except KoyfinUrlRequired as exc:
        assert "forbidden_path_myg_or_myd" in str(exc)


def test_fetch_rejects_non_wtm_saved_view() -> None:
    adapter = KoyfinAdapter()
    target = ExportTarget(
        id="koyfin_import_core",
        source="koyfin",
        saved_view="Import Core",
        url="https://app.koyfin.com/myw/70789aa7-8084-4e4c-85d3-09f9b78dcd3a",
        priority=3,
        canonical_name="credit_{YYYYMMDD}_{HHMM}.csv",
    )
    try:
        adapter.fetch(target, REPO / "data" / "staged")
        raise AssertionError("expected KoyfinUrlRequired")
    except KoyfinUrlRequired as exc:
        assert "saved_view_must_start_with_WTM" in str(exc)


def test_wired_targets_pass_validation() -> None:
    targets, _ = load_core_exports()
    wired = {t.id: t for t in targets if t.id in ("koyfin_import_core", "koyfin_flows_global")}
    assert set(wired) == {"koyfin_import_core", "koyfin_flows_global"}
    for target in wired.values():
        ok, reason = validate_koyfin_target(target)
        assert ok and reason == "ok", f"{target.id}: {reason} url={target.url}"
        assert koyfin_export_route(target.url) == "watchlist"
        assert "/myw/" in target.url


def test_blocked_manifest_targets_fail_validation() -> None:
    targets, _ = load_core_exports()
    blocked = [t for t in targets if t.id in BLOCKED_SHARE_URL_IDS]
    assert len(blocked) == len(BLOCKED_SHARE_URL_IDS)
    for target in blocked:
        ok, reason = validate_koyfin_target(target)
        assert not ok
        assert reason == "watchlist_or_chart_url_required"


def test_fetch_rejects_unknown_export() -> None:
    adapter = KoyfinAdapter()
    target = ExportTarget(
        id="koyfin_crypto_price",
        source="crypto",
        saved_view="WTM-Crypto-Price",
        url="https://app.koyfin.com/charts/abc123",
        priority=9,
        canonical_name="btc_price_chart_{YYYYMMDD}_{HHMM}.csv",
    )
    try:
        adapter.fetch(target, REPO / "data" / "staged")
        raise AssertionError("expected NotImplementedError")
    except NotImplementedError as exc:
        assert "Chunk 4" in str(exc)


def main() -> int:
    tests = [
        test_wtm_view_name_rule,
        test_watchlist_and_chart_url_rules,
        test_forbidden_myg_myd_paths,
        test_validate_koyfin_sample,
        test_fetch_rejects_blocked_without_share_url,
        test_fetch_rejects_generic_assist_url,
        test_fetch_rejects_forbidden_myd_url,
        test_fetch_rejects_non_wtm_saved_view,
        test_wired_targets_pass_validation,
        test_blocked_manifest_targets_fail_validation,
        test_fetch_rejects_unknown_export,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_koyfin_adapter.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())