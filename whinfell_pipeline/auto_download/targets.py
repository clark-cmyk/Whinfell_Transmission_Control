"""Core export scope for v1 — Barchart intraday + key Koyfin Watchlists/Charts.

Barchart per-ticker manual navigation (desk / future collection plans):
  Main Watchlist → find ticker → Options: Volatility & Greeks | Options Prices;
  Futures: Historical Data (default range) | Futures Spreads.
  Koyfin: Watchlist /myw/ (snapshot) · Chart /charts/ (timeseries) — never /myg/ /myd/.
  Authority: Cousins collection_manifest.yaml · desk_urls.yaml.
"""

from __future__ import annotations

# Barchart intraday watchlist (viewName=197689) + 5 Koyfin WTM* exports (/myw/ or /charts/).
CORE_EXPORT_IDS: tuple[str, ...] = (
    "barchart_futures_intraday",
    "koyfin_rates",
    "koyfin_import_core",
    "koyfin_flows_global",
    "koyfin_china",
    "koyfin_equities",
)

# Minimum before pipeline chain is attempted (aligns with daily desk minimum).
REQUIRED_FOR_CHAIN: tuple[str, ...] = (
    "barchart_futures_intraday",
    "koyfin_rates",
)

MODULE_VERSION = "0.4.3"