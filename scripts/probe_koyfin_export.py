#!/usr/bin/env python3
"""Probe Koyfin export controls — dictionary-aligned Watchlist + Chart terminology."""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.session import SessionManager

OUT = Path.home() / "Downloads" / "whinfell_drop" / "quarantine" / "screenshots"


def _dismiss_overlays(page) -> None:
    for label in ("Accept All", "Reject"):
        btn = page.get_by_role("button", name=label, exact=True)
        if btn.count() and btn.first.is_visible():
            btn.first.click()
            page.wait_for_timeout(800)
            break


def _login(page) -> None:
    from whinfell_pipeline.auto_download.adapters.koyfin import (
        EMAIL_SELECTORS,
        LOGIN_URL,
        PASSWORD_SELECTORS,
        SUBMIT_SELECTORS,
    )

    email = os.environ.get("KOYFIN_LOGIN_EMAIL", "").strip()
    password = os.environ.get("KOYFIN_LOGIN_PASSWORD", "").strip()
    if not email or not password:
        return

    page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=90_000)
    page.wait_for_timeout(2000)
    _dismiss_overlays(page)
    for sel in EMAIL_SELECTORS:
        loc = page.locator(sel)
        if loc.count() and loc.first.is_visible():
            loc.first.fill(email)
            break
    for sel in PASSWORD_SELECTORS:
        loc = page.locator(sel)
        if loc.count() and loc.first.is_visible():
            loc.first.fill(password)
            break
    for sel in SUBMIT_SELECTORS:
        loc = page.locator(sel)
        if loc.count() and loc.first.is_visible():
            loc.first.click()
            break
    page.wait_for_timeout(6000)


def _all_visible_buttons(page) -> list[str]:
    out: list[str] = []
    loc = page.get_by_role("button")
    for i in range(min(loc.count(), 80)):
        el = loc.nth(i)
        try:
            if el.is_visible():
                text = (el.inner_text() or "").strip().replace("\n", " | ")
                if text:
                    out.append(text)
        except Exception:
            pass
    return out


def _shot(page, name: str) -> None:
    path = OUT / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    print(f"screenshot={path}")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    session = SessionManager()
    # Watchlist (/myw/) — direct Download CSV
    flows_url = "https://app.koyfin.com/myw/afb1f314-4de4-47b6-b02f-0de2601b62b9"
    # Chart (/charts/) — SHOW TABLE → Download Available Data (paste wired URL from My Templates)
    chart_url = os.environ.get(
        "KOYFIN_PROBE_CHART_URL",
        "https://app.koyfin.com/charts/REPLACE_ME",
    )

    with session.browser_context(headless=False) as context:
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(flows_url, wait_until="domcontentloaded", timeout=90_000)
        page.wait_for_timeout(3000)
        _dismiss_overlays(page)
        if "log in" in (page.inner_text("body") or "").lower():
            _login(page)

        page.goto(flows_url, wait_until="networkidle", timeout=90_000)
        page.wait_for_timeout(5000)
        print("=== watchlist_download (/myw/) ===")
        dl = page.get_by_role("button", name="Download", exact=True)
        print("Download count", dl.count())
        try:
            with page.expect_download(timeout=15_000) as info:
                dl.first.click()
            path = OUT / "probe_flows_direct.csv"
            info.value.save_as(path)
            print("watchlist_download_ok", path, path.stat().st_size)
            print(path.read_text(encoding="utf-8", errors="replace")[:200])
        except Exception as exc:
            print("watchlist_download_fail", exc)
            _shot(page, "probe_watchlist_after_download_click")
            print("buttons:", _all_visible_buttons(page))

        if "REPLACE_ME" in chart_url:
            print("\n=== chart_show_table (/charts/) === SKIP — set KOYFIN_PROBE_CHART_URL")
            return 0

        page.goto(chart_url, wait_until="networkidle", timeout=90_000)
        page.wait_for_timeout(5000)
        print("\n=== chart_show_table (/charts/) === url", page.url)
        print("buttons:", _all_visible_buttons(page))
        _shot(page, "probe_chart_loaded")

        for label in ("SHOW TABLE", "Show Table", "Show table"):
            show = page.get_by_text(label, exact=True)
            if show.count() and show.first.is_visible():
                print("found", label)
                show.first.click()
                page.wait_for_timeout(2500)
                print("after SHOW TABLE:", _all_visible_buttons(page))
                _shot(page, "probe_chart_after_show_table")
                break
        else:
            body = page.inner_text("body") or ""
            for token in ("SHOW TABLE", "Show Table", "Download Available Data", "TABLE"):
                print(f"body contains {token!r}:", token in body)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())