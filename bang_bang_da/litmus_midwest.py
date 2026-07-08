"""BBDM v2 Midwest Litmus tables (basis + calendar).

Chunk 24 — primary rows (MSFT, GOOGL, AMZN, ORCL, SMCI).
Chunk 25 — nice-to-have secondary rows (META, VST, CEG, NVDA), collapsed in UI.

Projects Chunk 16 corporate GM rows into litmus.tables[] for midwest_basis and
midwest_calendar trades. Regime signal vocabulary mirrors WMC dislocation labels.
"""

from __future__ import annotations

from typing import Any

from bang_bang_da.litmus_schema import MIDWEST_CORPORATE_COLUMNS

BUILD_VERSION = "2.0.0-chunk25"

MIDWEST_PRIMARY_TABLES: tuple[dict[str, str], ...] = (
    {
        "id": "midwest_calendar_primary",
        "trade_id": "midwest_calendar",
        "title": "Midwest Compute — Primary",
    },
    {
        "id": "midwest_basis_primary",
        "trade_id": "midwest_basis",
        "title": "Midwest Compute — Primary",
    },
)

MIDWEST_SECONDARY_TABLES: tuple[dict[str, Any], ...] = (
    {
        "id": "midwest_calendar_secondary",
        "trade_id": "midwest_calendar",
        "title": "Midwest Compute — Nice-to-Have",
        "tier": "secondary",
        "collapsed": True,
    },
    {
        "id": "midwest_basis_secondary",
        "trade_id": "midwest_basis",
        "title": "Midwest Compute — Nice-to-Have",
        "tier": "secondary",
        "collapsed": True,
    },
)

# Back-compat alias for Chunk 24 imports
MIDWEST_TRADE_TABLES = MIDWEST_PRIMARY_TABLES

NICE_TO_HAVE_TICKERS = ("META", "VST", "CEG", "NVDA")


def regime_signal_from_gm(gm_z_3yr: float | None, quartile: str | None) -> str | None:
    """Map 3yr GM z-score / quartile to WMC-style dislocation labels."""
    if gm_z_3yr is not None:
        if gm_z_3yr >= 2.0:
            return "extreme_rich"
        if gm_z_3yr >= 1.0:
            return "rich"
        if gm_z_3yr <= -2.0:
            return "extreme_cheap"
        if gm_z_3yr <= -1.0:
            return "cheap"
        return "fair"

    if quartile:
        q = str(quartile).strip().upper()
        if q == "Q1":
            return "rich"
        if q == "Q4":
            return "cheap"
        if q in {"Q2", "Q3"}:
            return "fair"
    return None


def project_litmus_row(row: dict[str, Any]) -> dict[str, Any]:
    """Project a corporate_gm row into a litmus table row with regime_signal."""
    projected = {col: row.get(col) for col in MIDWEST_CORPORATE_COLUMNS}
    if projected.get("cloud_multiplier") is None:
        projected["cloud_multiplier"] = 1.0
    if projected.get("regime_signal") is None:
        projected["regime_signal"] = regime_signal_from_gm(
            row.get("gm_z_3yr"),
            row.get("quartile"),
        )
    return projected


def litmus_rows_from_corporate_gm(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Project primary corporate_gm rows into litmus table row objects."""
    return [project_litmus_row(row) for row in doc.get("rows", []) if isinstance(row, dict)]


def litmus_rows_from_nice_to_have(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Project nice-to-have corporate_gm rows into litmus table row objects."""
    return [
        project_litmus_row(row)
        for row in doc.get("nice_to_have", [])
        if isinstance(row, dict)
    ]


def midwest_table_templates(*, tier: str = "primary") -> list[dict[str, Any]]:
    """Table metadata shells for Midwest trades (rows attached at merge)."""
    columns = list(MIDWEST_CORPORATE_COLUMNS)
    specs = MIDWEST_PRIMARY_TABLES if tier == "primary" else MIDWEST_SECONDARY_TABLES
    tables: list[dict[str, Any]] = []
    for spec in specs:
        table = {
            "id": spec["id"],
            "trade_id": spec["trade_id"],
            "title": spec["title"],
            "columns": columns,
        }
        if tier == "secondary":
            table["tier"] = spec.get("tier", "secondary")
            table["collapsed"] = spec.get("collapsed", True)
        tables.append(table)
    return tables


def _build_midwest_tables_from_rows(
    specs: tuple[dict[str, Any], ...],
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    columns = list(MIDWEST_CORPORATE_COLUMNS)
    tables: list[dict[str, Any]] = []
    for spec in specs:
        table: dict[str, Any] = {
            "id": spec["id"],
            "trade_id": spec["trade_id"],
            "title": spec["title"],
            "columns": columns,
            "rows": rows,
        }
        if spec.get("tier"):
            table["tier"] = spec["tier"]
        if "collapsed" in spec:
            table["collapsed"] = spec["collapsed"]
        tables.append(table)
    return tables


def build_midwest_litmus_tables(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Build primary litmus.tables[] entries for midwest_basis and midwest_calendar."""
    return _build_midwest_tables_from_rows(
        MIDWEST_PRIMARY_TABLES,
        litmus_rows_from_corporate_gm(doc),
    )


def build_midwest_secondary_litmus_tables(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Build nice-to-have litmus tables (collapsed by default in UI)."""
    return _build_midwest_tables_from_rows(
        MIDWEST_SECONDARY_TABLES,
        litmus_rows_from_nice_to_have(doc),
    )


def build_all_midwest_litmus_tables(
    doc: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (primary_tables, secondary_tables) for Midwest Litmus."""
    return (
        build_midwest_litmus_tables(doc),
        build_midwest_secondary_litmus_tables(doc),
    )


def _validate_midwest_table_group(
    tables: list[dict[str, Any]],
    specs: tuple[dict[str, Any], ...],
    *,
    label: str,
    expected_row_count: int | None,
) -> list[str]:
    errors: list[str] = []
    if len(tables) != len(specs):
        errors.append(f"expected {len(specs)} {label} midwest tables, got {len(tables)}")
    seen_trade_ids: set[str] = set()
    for table in tables:
        trade_id = table.get("trade_id")
        if trade_id in seen_trade_ids:
            errors.append(f"duplicate {label} midwest trade_id {trade_id!r}")
        if trade_id:
            seen_trade_ids.add(trade_id)
        if list(table.get("columns", [])) != list(MIDWEST_CORPORATE_COLUMNS):
            errors.append(f"{table.get('id')}: column mismatch")
        rows = table.get("rows", [])
        if not rows:
            errors.append(f"{table.get('id')}: expected {label} rows")
        elif expected_row_count is not None and len(rows) != expected_row_count:
            errors.append(
                f"{table.get('id')}: expected {expected_row_count} {label} rows, got {len(rows)}"
            )
        for idx, row in enumerate(rows):
            if row.get("cloud_multiplier") is None:
                errors.append(f"{table.get('id')}.rows[{idx}].cloud_multiplier: required")
        if label == "secondary":
            if table.get("tier") != "secondary":
                errors.append(f"{table.get('id')}: tier must be secondary")
            if table.get("collapsed") is not True:
                errors.append(f"{table.get('id')}: collapsed must be true")
    expected_trades = {spec["trade_id"] for spec in specs}
    if seen_trade_ids != expected_trades:
        errors.append(
            f"{label} trade_ids: expected {sorted(expected_trades)}, got {sorted(seen_trade_ids)}"
        )
    return errors


def validate_midwest_litmus_tables(tables: list[dict[str, Any]]) -> list[str]:
    """Validate primary Midwest Litmus tables."""
    return _validate_midwest_table_group(
        tables,
        MIDWEST_PRIMARY_TABLES,
        label="primary",
        expected_row_count=5,
    )


def validate_midwest_secondary_litmus_tables(tables: list[dict[str, Any]]) -> list[str]:
    """Validate nice-to-have Midwest Litmus tables."""
    return _validate_midwest_table_group(
        tables,
        MIDWEST_SECONDARY_TABLES,
        label="secondary",
        expected_row_count=len(NICE_TO_HAVE_TICKERS),
    )