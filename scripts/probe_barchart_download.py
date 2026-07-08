#!/usr/bin/env python3
"""One-off probe — inspect Barchart watchlist download controls."""
from playwright.sync_api import sync_playwright

URL = "https://www.barchart.com/my/watchlist?viewName=197689"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    print("title:", page.title())
    print("url:", page.url)
    for sel in [
        "text=Download",
        "text=Download CSV",
        "a:has-text('Download')",
        "[class*='download']",
        "button:has-text('Download')",
    ]:
        loc = page.locator(sel)
        print(f"{sel!r} count={loc.count()}")
    browser.close()