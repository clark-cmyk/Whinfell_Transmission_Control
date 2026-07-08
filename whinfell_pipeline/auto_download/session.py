"""Persistent Playwright browser session — Comet (Perplexity) on desk Mac."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

COMET_EXECUTABLE = Path("/Applications/Comet.app/Contents/MacOS/Comet")
DEFAULT_PROFILE_DIR = Path.home() / ".whinfell" / "comet_profile"

LOGIN_URLS = (
    "https://www.barchart.com/my/watchlist?viewName=197689",
    "https://app.koyfin.com/login",
)


class SessionManager:
    """Reuse a persistent Comet profile for Barchart/Koyfin exports."""

    def __init__(
        self,
        *,
        profile_dir: Path | None = None,
        headless: bool | None = None,
        executable_path: Path | None = None,
    ) -> None:
        self.profile_dir = (profile_dir or DEFAULT_PROFILE_DIR).expanduser()
        if headless is None:
            headless = os.environ.get("WHINFELL_BROWSER_HEADLESS", "0") == "1"
        self.headless = headless
        env_bin = os.environ.get("WHINFELL_BROWSER_EXECUTABLE", "").strip()
        if executable_path:
            self.executable_path = executable_path
        elif env_bin:
            self.executable_path = Path(env_bin)
        elif COMET_EXECUTABLE.is_file():
            self.executable_path = COMET_EXECUTABLE
        else:
            self.executable_path = None

    def ensure_profile(self) -> Path:
        self.profile_dir.mkdir(parents=True, exist_ok=True)
        return self.profile_dir

    @contextmanager
    def browser_context(self, *, headless: bool | None = None) -> Iterator:
        from playwright.sync_api import sync_playwright

        use_headless = self.headless if headless is None else headless
        self.ensure_profile()

        with sync_playwright() as playwright:
            launch_kwargs: dict = {
                "user_data_dir": str(self.profile_dir),
                "headless": use_headless,
                "accept_downloads": True,
                "viewport": {"width": 1440, "height": 900},
                "args": ["--disable-blink-features=AutomationControlled"],
            }
            if self.executable_path and self.executable_path.is_file():
                launch_kwargs["executable_path"] = str(self.executable_path)

            context = None
            try:
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
                yield context
            finally:
                if context is not None:
                    context.close()

    def login_interactive(self, urls: tuple[str, ...] = LOGIN_URLS) -> None:
        """Open Comet; operator logs in, then confirms in the terminal."""
        with self.browser_context(headless=False) as context:
            page = context.pages[0] if context.pages else context.new_page()
            for index, url in enumerate(urls):
                if index == 0:
                    page.goto(url, wait_until="domcontentloaded", timeout=90_000)
                else:
                    new_page = context.new_page()
                    new_page.goto(url, wait_until="domcontentloaded", timeout=90_000)

            browser = "Comet" if self.executable_path == COMET_EXECUTABLE else "browser"
            print(f"{browser} open — sign into Barchart (viewName=197689) and Koyfin if prompted.")
            print(f"Session profile: {self.profile_dir}")
            input(
                "Press Enter after Barchart Download CSV and Koyfin ⋮→Export→CSV are reachable… "
            )

    def new_page(self, *, headless: bool | None = None):
        """Context manager yielding a single page inside one browser context."""
        @contextmanager
        def _page_ctx() -> Iterator:
            with self.browser_context(headless=headless) as context:
                page = context.pages[0] if context.pages else context.new_page()
                yield page

        return _page_ctx()