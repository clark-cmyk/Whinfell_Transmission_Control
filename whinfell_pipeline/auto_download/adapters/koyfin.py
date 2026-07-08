"""Koyfin adapter — dictionary-aligned Watchlist + Chart CSV export.

Terminology lock (whinfell_pipeline/data_dictionary.yaml · Master_Data_Dictionary_v1.0):
- Watchlists: /myw/ paths · saved views starting with WTM* · direct Download CSV.
  Preferred for snapshot data (rates, credit, equities, china_policy, flows).
- Charts: /charts/ paths · My Templates (WTM-*) · SHOW TABLE → Download Available Data
  for multi-date timeseries.
- Never use: /myg/ (My Graphs), /myd/ dashboards, generic app root, assist URLs.
- Routing: /myw/ → direct Download · /charts/ → SHOW TABLE flow.
- Reuse ~/.whinfell/comet_profile via SessionManager.

Desk Barchart sibling (manual per-ticker — not Koyfin flows):
  Main Watchlist → find ticker → choose CSV:
  Options: Volatility & Greeks | Options Prices;
  Futures: Historical Data (system default date range) | Futures Spreads.
  See adapters/barchart.py · collection_manifest barchart_ticker_navigation.
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from whinfell_pipeline.auto_download.adapters.base import BaseAdapter
from whinfell_pipeline.auto_download.manifest import ExportTarget
from whinfell_pipeline.auto_download.session import SessionManager
from whinfell_pipeline.auto_download.validators import validate_koyfin_csv

LOGIN_URL = "https://app.koyfin.com/login"
MAX_ATTEMPTS = 2
RETRY_BACKOFF_SEC = 3.0

CHUNK4_EXPORT_IDS = frozenset(
    {
        "koyfin_rates",
        "koyfin_import_core",
        "koyfin_flows_global",
        "koyfin_china",
        "koyfin_equities",
    }
)

FLOW_PRESERVE_FILENAME = "WTM-Flows-Global.csv"

BLOCKED_SHARE_URL_IDS = frozenset(
    {
        "koyfin_rates",
        "koyfin_china",
        "koyfin_equities",
    }
)

GENERIC_KOYFIN_PATH_PREFIXES = (
    "/macro/",
    "/etf/",
    "/crypto/",
    "/index/",
    "/forex/",
    "/login",
)

FORBIDDEN_KOYFIN_PATH_MARKERS = (
    "/myg/",
    "/myd/",
)

WATCHLIST_PATH_MARKER = "/myw/"
CHART_PATH_MARKER = "/charts/"

WATCHLIST_DOWNLOAD_SELECTORS = (
    "button:has-text('Download CSV')",
    "a:has-text('Download CSV')",
    "text=Download CSV",
    "button:has-text('Export CSV')",
    "a:has-text('Export CSV')",
    "button:has-text('Download')",
    "a:has-text('Download')",
)

SHOW_TABLE_SELECTORS = (
    "text=SHOW TABLE",
    "button:has-text('SHOW TABLE')",
    "a:has-text('SHOW TABLE')",
    "text=Show Table",
    "button:has-text('Show Table')",
    "a:has-text('Show Table')",
)

DOWNLOAD_AVAILABLE_DATA_SELECTORS = (
    "text=Download Available Data",
    "button:has-text('Download Available Data')",
    "a:has-text('Download Available Data')",
)

LOGIN_MARKERS = (
    "sign in",
    "log in",
    "create account",
    "get started",
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
    "button:has-text('Sign In')",
    "button:has-text('Log In')",
    "button:has-text('Continue')",
)


class KoyfinLoginRequired(RuntimeError):
    """Raised when the persistent browser session is not authenticated."""


class KoyfinUrlRequired(RuntimeError):
    """Raised when a replace_me view lacks a Watchlist or Chart URL."""


class KoyfinExportError(RuntimeError):
    """Raised when Watchlist Download or Chart SHOW TABLE export fails."""


class KoyfinAdapter(BaseAdapter):
    source = "koyfin"

    def __init__(self, session: SessionManager | None = None) -> None:
        self.session = session or SessionManager()

    def fetch(self, target: ExportTarget, drop_dir: Path) -> Path:
        if target.id not in CHUNK4_EXPORT_IDS:
            raise NotImplementedError(
                f"Koyfin auto-fetch supports {', '.join(sorted(CHUNK4_EXPORT_IDS))} in Chunk 4. "
                f"Use: run_auto_download.py open --id {target.id}"
            )
        ready, reason = validate_koyfin_target(target)
        if not ready:
            hint = (
                f"Paste a Koyfin Watchlist (/myw/) or Chart (/charts/) URL for "
                f"{target.saved_view} into desk_urls.yaml wired_url "
                f"(authority: data_dictionary.yaml). "
                f"Never use /myg/, /myd/, https://app.koyfin.com/, or assist URLs "
                f"(/macro/, /etf/, /crypto/)."
            )
            label = "share URL required" if target.id in BLOCKED_SHARE_URL_IDS else "invalid export URL"
            raise KoyfinUrlRequired(f"{target.id}: {label} ({reason}). {hint}")

        drop_dir.mkdir(parents=True, exist_ok=True)
        last_exc: Exception | None = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                return self._fetch_once(target, drop_dir)
            except (KoyfinLoginRequired, KoyfinExportError) as exc:
                last_exc = exc
                if attempt < MAX_ATTEMPTS:
                    time.sleep(RETRY_BACKOFF_SEC)
                    continue
                screenshot = self._capture_failure_screenshot(target, drop_dir)
                detail = str(exc)
                if screenshot:
                    detail = f"{detail} (screenshot={screenshot})"
                raise KoyfinExportError(detail) from exc
        raise KoyfinExportError(str(last_exc or "koyfin_fetch_failed"))

    def _fetch_once(self, target: ExportTarget, drop_dir: Path) -> Path:
        url = target.url
        route = koyfin_export_route(url)
        if route is None:
            raise KoyfinExportError(
                "invalid_route: URL must be a Watchlist (/myw/) or Chart (/charts/) path"
            )

        with self.session.new_page(headless=False) as page:
            page.goto(url, wait_until="domcontentloaded", timeout=90_000)
            page.wait_for_timeout(1500)
            self._dismiss_overlays(page)
            if self._needs_login(page):
                self._login(page)
                page.goto(url, wait_until="domcontentloaded", timeout=90_000)
                page.wait_for_timeout(1500)
                self._dismiss_overlays(page)

            self._wait_for_panel(page, target, route)
            if self._needs_login(page):
                raise KoyfinLoginRequired(
                    "Koyfin login failed. Set KOYFIN_LOGIN_EMAIL and KOYFIN_LOGIN_PASSWORD "
                    "or run: python3 run_auto_download.py login"
                )

            dest = self._export_csv(page, target, drop_dir, route)

        ok, reason = validate_koyfin_csv(dest)
        if not ok:
            quarantine = drop_dir / "quarantine" / dest.name
            quarantine.parent.mkdir(parents=True, exist_ok=True)
            dest.replace(quarantine)
            raise KoyfinExportError(f"validation_failed:{reason}")
        return dest

    def _export_csv(self, page, target: ExportTarget, drop_dir: Path, route: str) -> Path:
        if route == "watchlist":
            return self._export_watchlist_csv(page, target, drop_dir)
        if route == "chart":
            return self._export_chart_csv(page, target, drop_dir)
        raise KoyfinExportError(f"invalid_route:{route}")

    def _export_watchlist_csv(self, page, target: ExportTarget, drop_dir: Path) -> Path:
        download = self._first_visible(page, WATCHLIST_DOWNLOAD_SELECTORS)
        if download is None:
            raise KoyfinExportError(
                "watchlist_download_not_found: direct Download control missing on Watchlist (/myw/)"
            )
        with page.expect_download(timeout=60_000) as download_info:
            download.click()
        return self._save_download(download_info.value, target, drop_dir)

    def _export_chart_csv(self, page, target: ExportTarget, drop_dir: Path) -> Path:
        show_table = self._first_visible(page, SHOW_TABLE_SELECTORS)
        if show_table is None:
            raise KoyfinExportError(
                "chart_show_table_not_found: SHOW TABLE control missing on Chart (/charts/)"
            )
        show_table.click()
        page.wait_for_timeout(1500)

        download_data = self._first_visible(page, DOWNLOAD_AVAILABLE_DATA_SELECTORS)
        if download_data is None:
            raise KoyfinExportError(
                "chart_download_available_data_not_found: Download Available Data missing after SHOW TABLE"
            )
        with page.expect_download(timeout=60_000) as download_info:
            download_data.click()
        return self._save_download(download_info.value, target, drop_dir)

    def _save_download(self, download, target: ExportTarget, drop_dir: Path) -> Path:
        suggested = download.suggested_filename or f"koyfin_{target.id}_{self._stamp()}.csv"
        if target.id == "koyfin_flows_global":
            dest = drop_dir / FLOW_PRESERVE_FILENAME
        else:
            dest = drop_dir / suggested
        download.save_as(dest)
        return dest

    def _login(self, page) -> None:
        email, password = self._credentials()
        if not email or not password:
            raise KoyfinLoginRequired(
                "Koyfin not logged in. Export KOYFIN_LOGIN_EMAIL / KOYFIN_LOGIN_PASSWORD "
                "or run: python3 run_auto_download.py login"
            )

        page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=90_000)
        email_input = self._first_visible(page, EMAIL_SELECTORS)
        password_input = self._first_visible(page, PASSWORD_SELECTORS)
        if email_input is None or password_input is None:
            raise KoyfinExportError("login_form_not_found")

        email_input.fill(email)
        password_input.fill(password)
        submit = self._first_visible(page, SUBMIT_SELECTORS)
        if submit is None:
            raise KoyfinExportError("login_submit_not_found")
        submit.click()
        page.wait_for_timeout(4000)

    @staticmethod
    def _credentials() -> tuple[str, str]:
        email = (
            os.environ.get("KOYFIN_LOGIN_EMAIL", "").strip()
            or os.environ.get("WHINFELL_KOYFIN_EMAIL", "").strip()
        )
        password = (
            os.environ.get("KOYFIN_LOGIN_PASSWORD", "").strip()
            or os.environ.get("WHINFELL_KOYFIN_PASSWORD", "").strip()
        )
        return email, password

    def _wait_for_panel(self, page, target: ExportTarget, route: str) -> None:
        deadline = time.time() + 60
        markers = _panel_markers(target)
        while time.time() < deadline:
            if self._panel_ready(page, markers, route):
                return
            if self._needs_login(page):
                return
            page.wait_for_timeout(1000)
        label = "Watchlist Download" if route == "watchlist" else "Chart SHOW TABLE"
        raise KoyfinExportError(f"panel_timeout: {label} controls did not render")

    def _panel_ready(self, page, markers: tuple[str, ...], route: str) -> bool:
        if route == "watchlist" and self._first_visible(page, WATCHLIST_DOWNLOAD_SELECTORS):
            return True
        if route == "chart" and self._first_visible(page, SHOW_TABLE_SELECTORS):
            return True
        body = (page.inner_text("body") or "").lower()
        if any(marker in body for marker in markers):
            return True
        if route == "watchlist" and "ticker" in body and ("price" in body or "close" in body):
            return True
        if route == "chart" and "date" in body:
            return True
        return False

    def _needs_login(self, page) -> bool:
        url = (page.url or "").lower()
        if "/login" in url:
            return True
        body = (page.inner_text("body") or "").lower()
        if any(marker in body for marker in LOGIN_MARKERS):
            return True
        return False

    @staticmethod
    def _dismiss_overlays(page) -> None:
        for label in ("Accept All", "Reject"):
            btn = page.get_by_role("button", name=label, exact=True)
            try:
                if btn.count() and btn.first.is_visible():
                    btn.first.click()
                    page.wait_for_timeout(800)
                    break
            except Exception:
                continue

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

    def _capture_failure_screenshot(self, target: ExportTarget, drop_dir: Path) -> Path | None:
        if not validate_koyfin_target(target)[0]:
            return None
        stamp = self._stamp()
        out_dir = drop_dir.parent / "quarantine" / "screenshots"
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / f"koyfin_{target.id}_{stamp}.png"
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


def is_wtm_view_name(saved_view: str) -> bool:
    return saved_view.strip().upper().startswith("WTM")


def is_forbidden_koyfin_url(url: str) -> bool:
    if not url:
        return False
    path = (urlparse(url).path or "").lower()
    return any(marker in path for marker in FORBIDDEN_KOYFIN_PATH_MARKERS)


def is_koyfin_watchlist_url(url: str) -> bool:
    if not url or is_forbidden_koyfin_url(url):
        return False
    return WATCHLIST_PATH_MARKER in (urlparse(url).path or "").lower()


def is_koyfin_chart_url(url: str) -> bool:
    if not url or is_forbidden_koyfin_url(url):
        return False
    return CHART_PATH_MARKER in (urlparse(url).path or "").lower()


def koyfin_export_route(url: str) -> str | None:
    if is_koyfin_watchlist_url(url):
        return "watchlist"
    if is_koyfin_chart_url(url):
        return "chart"
    return None


def is_exportable_koyfin_url(url: str) -> bool:
    if not url or url.startswith("${"):
        return False
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    if "koyfin.com" not in host:
        return False
    path = (parsed.path or "").lower()
    if path in ("", "/"):
        return False
    if any(path.startswith(prefix) for prefix in GENERIC_KOYFIN_PATH_PREFIXES):
        return False
    if is_forbidden_koyfin_url(url):
        return False
    return koyfin_export_route(url) is not None


def is_shareable_koyfin_url(url: str) -> bool:
    """Backward-compatible alias — use is_exportable_koyfin_url."""
    return is_exportable_koyfin_url(url)


def validate_koyfin_target(target: ExportTarget) -> tuple[bool, str]:
    if not is_wtm_view_name(target.saved_view):
        return False, "saved_view_must_start_with_WTM"
    if is_forbidden_koyfin_url(target.url):
        return False, "forbidden_path_myg_or_myd"
    if not is_exportable_koyfin_url(target.url):
        return False, "watchlist_or_chart_url_required"
    return True, "ok"


def _url_usable(url: str) -> bool:
    """Backward-compatible helper — exportable Watchlist or Chart URL only."""
    return is_exportable_koyfin_url(url)


def _panel_markers(target: ExportTarget) -> tuple[str, ...]:
    saved = target.saved_view.lower()
    if "flows" in saved:
        return ("flow", "aum", "wtm-flows")
    if "import" in saved:
        return ("btcusd", "hyg", "import-core", "wtm-import")
    if "rates" in saved:
        return ("oas", "dgs10", "t10y2y", "rates")
    if "china" in saved:
        return ("china", "policy", "kweb", "csi")
    if "equities" in saved:
        return ("iwm", "spy", "breadth", "equities")
    return ("ticker", "price", "close")