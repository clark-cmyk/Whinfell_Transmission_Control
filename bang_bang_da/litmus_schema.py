"""BBDM v2 Chunk 23 — Litmus table schema + column registry (spec §5).

Shared contract for report.litmus.tables[] used by Python builders and
js/bbdm_litmus_table.js. Column keys are snake_case; labels are desk-facing.
"""

from __future__ import annotations

from typing import Any

SCHEMA_VERSION = "2.0.0-chunk23"

# ── Column registry ──────────────────────────────────────────────────────────

ColumnMeta = dict[str, Any]

LITMUS_COLUMN_REGISTRY: dict[str, ColumnMeta] = {
    # Midwest corporate (§5 primary + nice-to-have)
    "company": {"label": "Company", "format": "text", "group": "midwest"},
    "segment": {"label": "Segment", "format": "text", "group": "midwest"},
    "current_gm_pct": {"label": "Current GM%", "format": "pct", "group": "midwest"},
    "avg_gm_3yr": {"label": "3yr Avg", "format": "pct", "group": "midwest"},
    "gm_z_3yr": {"label": "3yr Z-Score", "format": "z", "group": "midwest"},
    "quartile": {"label": "Quartile", "format": "text", "group": "midwest"},
    "cloud_multiplier": {
        "label": "Cloud Multiplier",
        "format": "number",
        "editable": True,
        "group": "midwest",
    },
    "regime_signal": {"label": "Regime Signal", "format": "text", "group": "midwest"},
    "status": {"label": "Status", "format": "status", "group": "shared"},
    # Crypto market signals (BTC/ETH basis + calendar)
    "signal": {"label": "Signal", "format": "text", "group": "crypto_market"},
    "venue": {"label": "Venue", "format": "text", "group": "crypto_market"},
    "funding_rate": {"label": "Funding Rate", "format": "rate", "group": "crypto_market"},
    "open_interest_usd": {"label": "Open Interest ($)", "format": "usd", "group": "crypto_market"},
    # BTC miner signals (Chunk 26)
    "metric": {"label": "Metric", "format": "text", "group": "miner"},
    "value": {"label": "Value", "format": "number", "group": "miner"},
    "unit": {"label": "Unit", "format": "text", "group": "miner"},
    "trend": {"label": "Trend", "format": "text", "group": "miner"},
    # ETH institutional (Chunk 27)
    "indicator": {"label": "Indicator", "format": "text", "group": "eth_institutional"},
    "reading": {"label": "Reading", "format": "text", "group": "eth_institutional"},
    "source": {"label": "Source", "format": "text", "group": "eth_institutional"},
    # Rates — SOFR vs Fed Funds (Chunk 28)
    "spread_bps": {"label": "Spread (bps)", "format": "bps", "group": "sofr"},
    "bank_nim": {"label": "Bank NIM", "format": "pct", "group": "sofr"},
    "rrp_usage": {"label": "RRP Usage", "format": "text", "group": "sofr"},
    "reserves_trend": {"label": "Reserves Trend", "format": "text", "group": "sofr"},
    # Rates — 2s10s curve (Chunk 29)
    "financials_gm": {"label": "Financials GM", "format": "pct", "group": "curve"},
    "industrials_gm": {"label": "Industrials GM", "format": "pct", "group": "curve"},
    "cyclical_defensive_gap": {
        "label": "Cyclical vs Defensive Margin Gap",
        "format": "pct",
        "group": "curve",
    },
}

MIDWEST_CORPORATE_COLUMNS: tuple[str, ...] = (
    "company",
    "segment",
    "current_gm_pct",
    "avg_gm_3yr",
    "gm_z_3yr",
    "quartile",
    "cloud_multiplier",
    "regime_signal",
    "status",
)

MARKET_SIGNAL_COLUMNS: tuple[str, ...] = (
    "signal",
    "venue",
    "funding_rate",
    "open_interest_usd",
    "status",
)

MINER_SIGNAL_COLUMNS: tuple[str, ...] = (
    "metric",
    "value",
    "unit",
    "trend",
    "status",
)

ETH_INSTITUTIONAL_COLUMNS: tuple[str, ...] = (
    "indicator",
    "reading",
    "source",
    "status",
)

SOFR_FED_FUNDS_COLUMNS: tuple[str, ...] = (
    "signal",
    "spread_bps",
    "bank_nim",
    "rrp_usage",
    "reserves_trend",
    "status",
)

CURVE_2S10S_COLUMNS: tuple[str, ...] = (
    "signal",
    "spread_bps",
    "financials_gm",
    "industrials_gm",
    "bank_nim",
    "cyclical_defensive_gap",
    "status",
)

TABLE_PROFILES: dict[str, dict[str, Any]] = {
    "midwest_corporate": {
        "columns": MIDWEST_CORPORATE_COLUMNS,
        "trade_ids": ("midwest_basis", "midwest_calendar"),
    },
    "market_signals": {
        "columns": MARKET_SIGNAL_COLUMNS,
        "trade_ids": ("btc_basis", "btc_calendar", "eth_basis", "eth_calendar"),
    },
    "miner_signals": {
        "columns": MINER_SIGNAL_COLUMNS,
        "trade_ids": ("btc_basis", "btc_calendar"),
    },
    "eth_institutional": {
        "columns": ETH_INSTITUTIONAL_COLUMNS,
        "trade_ids": ("eth_basis", "eth_calendar"),
    },
    "sofr_fed_funds": {
        "columns": SOFR_FED_FUNDS_COLUMNS,
        "trade_ids": ("sofr_fed_funds",),
    },
    "curve_2s10s": {
        "columns": CURVE_2S10S_COLUMNS,
        "trade_ids": ("curve_2s10s",),
    },
}

REQUIRED_TABLE_KEYS = ("id", "trade_id", "title", "columns", "rows")


def column_label(key: str) -> str:
    meta = LITMUS_COLUMN_REGISTRY.get(key)
    return str(meta["label"]) if meta else key.replace("_", " ").title()


def is_editable_column(key: str) -> bool:
    meta = LITMUS_COLUMN_REGISTRY.get(key)
    return bool(meta and meta.get("editable"))


def profile_for_columns(columns: list[str]) -> str | None:
    cols = tuple(columns)
    for profile_id, profile in TABLE_PROFILES.items():
        if cols == profile["columns"]:
            return profile_id
    return None


def validate_litmus_table(table: Any, errors: list[str], *, path: str = "litmus.tables[]") -> None:
    """Validate a single litmus.tables[] entry against the Chunk 23 contract."""
    if not isinstance(table, dict):
        errors.append(f"{path}: expected object")
        return

    for key in REQUIRED_TABLE_KEYS:
        if key not in table:
            errors.append(f"{path}.{key}: required")

    table_id = table.get("id")
    if table_id is not None and (not isinstance(table_id, str) or not table_id.strip()):
        errors.append(f"{path}.id: expected non-empty string")

    trade_id = table.get("trade_id")
    if trade_id is not None and not isinstance(trade_id, str):
        errors.append(f"{path}.trade_id: expected string")

    title = table.get("title")
    if title is not None and (not isinstance(title, str) or not title.strip()):
        errors.append(f"{path}.title: expected non-empty string")

    columns = table.get("columns")
    if columns is not None:
        if not isinstance(columns, list) or not columns:
            errors.append(f"{path}.columns: expected non-empty array")
        else:
            for idx, col in enumerate(columns):
                if not isinstance(col, str) or not col.strip():
                    errors.append(f"{path}.columns[{idx}]: expected non-empty string")
                elif col not in LITMUS_COLUMN_REGISTRY:
                    errors.append(f"{path}.columns[{idx}]: unknown column {col!r}")

    rows = table.get("rows")
    if rows is not None:
        if not isinstance(rows, list):
            errors.append(f"{path}.rows: expected array")
        elif isinstance(columns, list):
            for row_idx, row in enumerate(rows):
                if not isinstance(row, dict):
                    errors.append(f"{path}.rows[{row_idx}]: expected object")
                    continue
                for col in columns:
                    if col not in row:
                        errors.append(f"{path}.rows[{row_idx}]: missing column {col!r}")

    if isinstance(columns, list) and columns:
        profile_id = profile_for_columns(columns)
        if profile_id is None:
            errors.append(f"{path}.columns: no matching TABLE_PROFILE")
        elif trade_id and trade_id not in TABLE_PROFILES[profile_id]["trade_ids"]:
            errors.append(
                f"{path}.trade_id: {trade_id!r} incompatible with profile {profile_id!r}"
            )

    collapsed = table.get("collapsed")
    if collapsed is not None and not isinstance(collapsed, bool):
        errors.append(f"{path}.collapsed: expected boolean")

    tier = table.get("tier")
    if tier is not None and tier not in ("primary", "secondary"):
        errors.append(f"{path}.tier: expected primary|secondary")


def validate_litmus_tables(tables: Any, errors: list[str], *, path: str = "litmus.tables") -> None:
    if not isinstance(tables, list):
        errors.append(f"{path}: expected array")
        return
    seen_ids: set[str] = set()
    for idx, table in enumerate(tables):
        table_path = f"{path}[{idx}]"
        validate_litmus_table(table, errors, path=table_path)
        if isinstance(table, dict):
            table_id = table.get("id")
            if isinstance(table_id, str):
                if table_id in seen_ids:
                    errors.append(f"{table_path}.id: duplicate {table_id!r}")
                seen_ids.add(table_id)