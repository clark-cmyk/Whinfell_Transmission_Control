"""Barchart adapter — intraday watchlist CSV export (viewName=197689).

Auto-fetch (Chunk 3): WTM-Futures-Intraday watchlist only — Download CSV from viewName=197689.

Desk manual path for per-ticker CSVs (easiest path — do not invent alternate flows):
1. Start at the main Watchlist (viewName=197689).
2. Find the specific ticker.
3. Choose the right CSV:
   - Options: (i) Volatility & Greeks  (ii) Options Prices
   - Futures: (i) Historical Data (system default date range)  (ii) Futures Spreads

Per-ticker exports land in whinfell_drop via desk/Comet; normalize → staged_raw.
Authority: Cousins collection_manifest.yaml · desk_urls.yaml (barchart_ticker_navigation).
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from pathlib import Path

from whinfell_pipeline.auto_download.adapters.base import BaseAdapter
from whinfell_pipeline.auto_download.manifest import ExportTarget
from whinfell_pipeline.auto_download.session import SessionManager
from whinfell_pipeline.auto_download.validators import validate_barchart_csv

INTRADAY_EXPORT_ID = "barchart_futures_intraday"
VIEW_NAME = "197689"
LOGIN_URL = "https://www.barchart.com/login"
MAX_ATTEMPTS = 1
RETRY_BACKOFF_SEC = 3.0

TABLE_SELECTORS = (
    "table.bc-data-table tbody tr",
    "table tbody tr",
    "[class*='data-table'] tbody tr",
    ".bc-table-wrapper tbody tr",
)

DOWNLOAD_SELECTORS = (
    "a:has-text('Download CSV')",
    "button:has-text('Download CSV')",
    "[aria-label='Download CSV']",
    "a.bc-table-download",
    ".bc-page-toolbar a:has-text('Download')",
    "a:has-text('Download'):visible",
    "button:has-text('Download'):visible",
)

LOGIN_MARKERS = (
    "create your watchlist",
    "try barchart for free",
    "log in to view",
)

EMAIL_SELECTORS = (
    "input[type='email']",
    "input[name='email']",
    "input#email",
    "input[placeholder*='Email' i]",
)

PASSWORD_SELECTORS = (
    "input[type='password']",
    "input[name='password']",
)

SUBMIT_SELECTORS = (
    "button[type='submit']",
    "button:has-text('Log In')",
    "button:has-text('Sign In')",
    "input[type='submit']",
)


class BarchartLoginRequired(RuntimeError):
    """Raised when the persistent browser session is not authenticated."""


class BarchartExportError(RuntimeError):
    """Raised when the watchlist export control or download fails."""


class BarchartAdapter(BaseAdapter):
    source = "barchart"

    def __init__(self, session: SessionManager | None = None) -> None:
        self.session = session or SessionManager()

    def fetch(self, target: ExportTarget, drop_dir: Path) -> Path:
        if target.id != INTRADAY_EXPORT_ID:
            raise NotImplementedError(
                f"Barchart auto-fetch only supports {INTRADAY_EXPORT_ID} in Chunk 3. "
                f"Use: run_auto_download.py open --id {target.id}"
            )
        drop_dir.mkdir(parents=True, exist_ok=True)
        try:
            return self._fetch_intraday(target, drop_dir)
        except (BarchartLoginRequired, BarchartExportError) as exc:
            screenshot = self._capture_failure_screenshot(target, drop_dir)
            detail = str(exc)
            if screenshot:
                detail = f"{detail} (screenshot={screenshot})"
            raise BarchartExportError(detail) from exc

    def _fetch_intraday(self, target: ExportTarget, drop_dir: Path) -> Path:
        url = target.url or f"https://www.barchart.com/my/watchlist?viewName={VIEW_NAME}"
        with self.session.new_page(headless=False) as page:
            page.goto(url, wait_until="domcontentloaded", timeout=90_000)
            if self._needs_login(page):
                self._login(page)
                page.goto(url, wait_until="domcontentloaded", timeout=90_000)

            self._wait_for_watchlist(page)
            if self._needs_login(page):
                raise BarchartLoginRequired(
                    "Barchart login failed. Set BARCHART_LOGIN_EMAIL and BARCHART_LOGIN_PASSWORD "
                    "or run: python3 run_auto_download.py login"
                )

            download_btn = self._find_download_control(page)
            if download_btn is None:
                raise BarchartExportError("export_menu_not_found: Download CSV control missing")

            with page.expect_download(timeout=60_000) as download_info:
                download_btn.click()
            download = download_info.value
            # Canonical names for status/refresh_barchart_curve_from_watchlist + Cousins discover.
            stamp = self._stamp()  # YYYYMMDD_HHMM
            canonical = drop_dir / f"futures_intraday_{stamp}.csv"
            download.save_as(canonical)
            # Mirror discoverable watchlist name (Cousins barchart_hydration patterns).
            try:
                ymd = stamp[:8]
                mirror = drop_dir / (
                    f"watchlist-wtm-canonical-universe-intraday-"
                    f"{ymd[4:6]}-{ymd[6:8]}-{ymd[0:4]}.csv"
                )
                if not mirror.exists() or mirror.stat().st_mtime < canonical.stat().st_mtime:
                    mirror.write_bytes(canonical.read_bytes())
            except OSError:
                pass
            dest = canonical

        ok, reason = validate_barchart_csv(dest)
        if not ok:
            quarantine = drop_dir / "quarantine" / dest.name
            quarantine.parent.mkdir(parents=True, exist_ok=True)
            dest.replace(quarantine)
            raise BarchartExportError(f"validation_failed:{reason}")
        return dest

    def _login(self, page) -> None:
        email, password = self._credentials()
        if not email or not password:
            raise BarchartLoginRequired(
                "Barchart not logged in. Export BARCHART_LOGIN_EMAIL / BARCHART_LOGIN_PASSWORD "
                "or run: python3 run_auto_download.py login"
            )

        page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=90_000)
        email_input = self._first_visible(page, EMAIL_SELECTORS)
        password_input = self._first_visible(page, PASSWORD_SELECTORS)
        if email_input is None or password_input is None:
            raise BarchartExportError("login_form_not_found")

        email_input.fill(email)
        password_input.fill(password)
        submit = self._first_visible(page, SUBMIT_SELECTORS)
        if submit is None:
            raise BarchartExportError("login_submit_not_found")
        submit.click()
        page.wait_for_timeout(4000)

    @staticmethod
    def _credentials() -> tuple[str, str]:
        email = (
            os.environ.get("BARCHART_LOGIN_EMAIL", "").strip()
            or os.environ.get("WHINFELL_BARCHART_EMAIL", "").strip()
        )
        password = (
            os.environ.get("BARCHART_LOGIN_PASSWORD", "").strip()
            or os.environ.get("WHINFELL_BARCHART_PASSWORD", "").strip()
        )
        return email, password

    def _wait_for_watchlist(self, page) -> None:
        deadline = time.time() + 60
        while time.time() < deadline:
            if self._table_ready(page) or page.locator("text=Download CSV").count():
                return
            if self._needs_login(page):
                return
            page.wait_for_timeout(1000)
        raise BarchartExportError("watchlist_timeout: table or toolbar did not render")

    def _table_ready(self, page) -> bool:
        for selector in TABLE_SELECTORS:
            rows = page.locator(selector)
            if rows.count() >= 2:
                return True
        body = (page.inner_text("body") or "").lower()
        return "symbol" in body and "latest" in body

    def _needs_login(self, page) -> bool:
        url = (page.url or "").lower()
        if "/login" in url:
            return True
        body = (page.inner_text("body") or "").lower()
        if any(marker in body for marker in LOGIN_MARKERS):
            return True
        if "symbol" not in body and "download csv" not in body:
            if "log in" in body or "login" in body:
                return True
        return False

    def _first_visible(self, page, selectors: tuple[str, ...]):
        for selector in selectors:
            locator = page.locator(selector)
            try:
                if not locator.count():
                    continue
                control = locator.first
                if control.is_visible():
                    return control
            except Exception:
                continue
        return None

    def _find_download_control(self, page):
        return self._first_visible(page, DOWNLOAD_SELECTORS)

    def _capture_failure_screenshot(self, target: ExportTarget, drop_dir: Path) -> Path | None:
        stamp = self._stamp()
        out_dir = drop_dir.parent / "quarantine" / "screenshots"
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / f"barchart_{target.id}_{stamp}.png"
        try:
            with self.session.new_page(headless=False) as page:
                page.goto(target.url, wait_until="domcontentloaded", timeout=60_000)
                page.wait_for_timeout(2000)
                page.screenshot(path=str(path), full_page=True)
            return path
        except Exception:
            return None

    @staticmethod
    def _stamp() -> str:
        return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")