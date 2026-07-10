"""BBDM v2 Chunk 16 — Koyfin ingest scaffold for Midwest Litmus corporate GM%.

Spec §5 primary tickers: MSFT, GOOGL, AMZN, ORCL, SMCI.
Outputs typed stub at bang_bang_da/litmus/corporate_gm.json; merges live rows
when WTM-Midwest-Corporate-GM watchlist CSV is in whinfell_drop.
"""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from bang_bang_da.litmus_midwest import midwest_table_templates, regime_signal_from_gm

ADAPTER_VERSION = "2.0.0-chunk24"
SCHEMA_VERSION = "2.0.0"
EXPORT_ID = "koyfin_midwest_corporate_gm"
SAVED_VIEW = "WTM-Midwest-Corporate-GM"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "bang_bang_da" / "litmus" / "corporate_gm.json"

LITMUS_COLUMNS = (
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

PRIMARY_TICKERS: tuple[dict[str, str], ...] = (
    {"ticker": "MSFT", "company": "Microsoft", "segment": "Intelligent Cloud"},
    {"ticker": "GOOGL", "company": "Alphabet", "segment": "Google Cloud"},
    {"ticker": "AMZN", "company": "Amazon", "segment": "AWS"},
    {"ticker": "ORCL", "company": "Oracle", "segment": "OCI"},
    {"ticker": "SMCI", "company": "Super Micro", "segment": "SMCI"},
)

NICE_TO_HAVE_TICKERS: tuple[dict[str, str], ...] = (
    {"ticker": "META", "company": "Meta", "segment": "Reality Labs adj."},
    {"ticker": "VST", "company": "Vistra", "segment": "Merchant Power"},
    {"ticker": "CEG", "company": "Constellation Energy", "segment": "Merchant Power"},
    {"ticker": "NVDA", "company": "Nvidia", "segment": "Data Center"},
)

TRADE_IDS = ("midwest_basis", "midwest_calendar")

CSV_GLOB_PATTERNS = (
    # Vendor export names (pre-normalize)
    "koyfin_WTM-Midwest-Corporate-GM_*",
    "WTM-Midwest-Corporate-GM.csv",
    "koyfin_wtm-midwest-corporate-gm_*",
    # Canonical name after normalize_drop_dir / data_dictionary normalize_rules
    "midwest_corporate_gm_*.csv",
    "midwest_corporate_gm_*",
)

TICKER_ALIASES = {
    "GOOG": "GOOGL",
}

GM_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "current_gm_pct": (
        # Ideal desk columns (fixture / custom export)
        "gross margin %",
        "gross margin",
        "gm %",
        "current gm%",
        "current gm %",
        "gross margin (ttm)",
        # Live Koyfin WTM-Midwest-Corporate-GM watchlist export headers
        "gross profit margin % (ltm)",
        "gross profit margin % (fq)",
        "gross profit margin % (fy)",
        "gross profit margin %",
        "gm % - est avg (fy1e)",
    ),
    "avg_gm_3yr": (
        "3yr avg",
        "3y avg",
        "3yr avg gm%",
        "3y avg gm %",
        "gross margin % 3y avg",
        "avg gm 3yr",
        # Approximate multi-year / forward average columns from Koyfin
        "gm % - est avg (fy2e)",
        "gm % - est avg (fy3e)",
        "gross profit margin % (fy)",
    ),
    "gm_z_3yr": (
        "3yr z-score",
        "3y z-score",
        "gm z-score",
        "z-score (3yr)",
        "gm z 3yr",
    ),
    "quartile": ("quartile", "gm quartile"),
}


WATCHLIST_URL = "https://app.koyfin.com/myw/790f7aab-ba98-43df-9807-78b01c779a29"


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _pipeline_root() -> Path:
    return Path(__file__).resolve().parent


def load_watchlist_url(root: Path | None = None) -> str:
    """Resolve WTM-Midwest-Corporate-GM wired_url from desk_urls.yaml."""
    desk_path = (root or _pipeline_root()) / "desk_urls.yaml"
    if desk_path.is_file():
        try:
            desk = yaml.safe_load(desk_path.read_text(encoding="utf-8")) or {}
            spec = (desk.get("koyfin") or {}).get(SAVED_VIEW) or {}
            wired = spec.get("wired_url")
            if wired and str(wired).startswith("https://"):
                return str(wired)
        except (OSError, yaml.YAMLError):
            pass
    return WATCHLIST_URL


def _normalize_header(label: str) -> str:
    return re.sub(r"\s+", " ", (label or "").strip().lower())


def _safe_float(raw: Any) -> float | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text or text.lower() in {"—", "-", "n/a", "na", "null", "none"}:
        return None
    text = text.replace("%", "").replace(",", "")
    try:
        return round(float(text), 4)
    except ValueError:
        return None


def _safe_gm_pct(raw: Any) -> float | None:
    """Parse GM% fields; Koyfin often exports fractions (0.68) — desk uses percent points (68)."""
    value = _safe_float(raw)
    if value is None:
        return None
    # Values in (0, 1.5] are almost always fractions; fixture uses 15–75 percent points.
    if 0 < abs(value) <= 1.5:
        return round(value * 100.0, 4)
    return value


def _normalize_ticker(raw: str) -> str | None:
    text = (raw or "").strip().upper()
    if not text:
        return None
    text = text.split(".")[0]
    return TICKER_ALIASES.get(text, text)


def _stub_row(meta: dict[str, str], *, tier: str) -> dict[str, Any]:
    return {
        "ticker": meta["ticker"],
        "company": meta["company"],
        "segment": meta["segment"],
        "current_gm_pct": None,
        "avg_gm_3yr": None,
        "gm_z_3yr": None,
        "quartile": None,
        "cloud_multiplier": 1.0,
        "regime_signal": None,
        "status": "pending_koyfin",
        "tier": tier,
    }


def build_corporate_gm_stub(*, as_of: str | None = None) -> dict[str, Any]:
    """Typed Midwest Litmus corporate GM scaffold with null metric slots."""
    stamp = as_of or _utc_now()
    return {
        "schema_version": SCHEMA_VERSION,
        "adapter_version": ADAPTER_VERSION,
        "data_status": "stub",
        "source": "koyfin",
        "as_of": stamp,
        "export_id": EXPORT_ID,
        "saved_view": SAVED_VIEW,
        "trade_ids": list(TRADE_IDS),
        "tables": midwest_table_templates(),
        "rows": [_stub_row(meta, tier="primary") for meta in PRIMARY_TICKERS],
        "nice_to_have": [_stub_row(meta, tier="nice_to_have") for meta in NICE_TO_HAVE_TICKERS],
        "lineage": {
            "watchlist_url": load_watchlist_url(),
            "drop_file": None,
            "ingested_at": None,
            "notes": "Export WTM-Midwest-Corporate-GM watchlist CSV to whinfell_drop for live GM rows",
        },
    }


def write_corporate_gm_stub(out_path: Path | None = None, *, as_of: str | None = None) -> Path:
    path = Path(out_path or DEFAULT_OUT)
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = build_corporate_gm_stub(as_of=as_of)
    path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    return path


def _match_column(header_map: dict[str, str], aliases: tuple[str, ...]) -> str | None:
    for alias in aliases:
        if alias in header_map:
            return header_map[alias]
    return None


def _header_map(fieldnames: list[str] | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for name in fieldnames or []:
        norm = _normalize_header(name)
        if norm:
            out[norm] = name
    return out


def parse_koyfin_watchlist_csv(csv_path: Path) -> dict[str, dict[str, Any]]:
    """Parse Koyfin watchlist export rows keyed by ticker."""
    rows_by_ticker: dict[str, dict[str, Any]] = {}
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        headers = _header_map(reader.fieldnames)
        ticker_col = _match_column(headers, ("ticker", "symbol"))
        if ticker_col is None:
            raise ValueError("missing_ticker_column")

        col_map = {
            field: _match_column(headers, aliases)
            for field, aliases in GM_COLUMN_ALIASES.items()
        }

        for raw_row in reader:
            ticker = _normalize_ticker(raw_row.get(ticker_col, ""))
            if ticker is None:
                continue
            parsed: dict[str, Any] = {"ticker": ticker}
            for field, column in col_map.items():
                if column is None:
                    parsed[field] = None
                    continue
                if field == "quartile":
                    value = (raw_row.get(column) or "").strip() or None
                    parsed[field] = value
                elif field in {"current_gm_pct", "avg_gm_3yr"}:
                    parsed[field] = _safe_gm_pct(raw_row.get(column))
                else:
                    parsed[field] = _safe_float(raw_row.get(column))
            rows_by_ticker[ticker] = parsed
    return rows_by_ticker


def discover_koyfin_csv(drop_dir: Path) -> Path | None:
    """Find the newest Midwest corporate GM watchlist export in whinfell_drop."""
    if not drop_dir.is_dir():
        return None
    candidates: list[Path] = []
    for pattern in CSV_GLOB_PATTERNS:
        candidates.extend(drop_dir.glob(pattern))
    candidates = [p for p in candidates if p.is_file() and p.suffix.lower() == ".csv"]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def enrich_cross_section_gm_stats(rows: list[dict[str, Any]]) -> None:
    """Fill missing gm_z_3yr / quartile / regime_signal from current_gm_pct peers.

    Live Koyfin WTM-Midwest-Corporate-GM exports carry GM levels but often omit
    pre-computed z-score and quartile. Litmus right-half columns need those
    derived in-peer so the table is fully hydrated.
    """
    peers = [
        (idx, float(row["current_gm_pct"]))
        for idx, row in enumerate(rows)
        if isinstance(row, dict) and row.get("current_gm_pct") is not None
    ]
    if len(peers) < 2:
        # Still stamp defaults for single live rows so cells are not null blanks.
        for row in rows:
            if not isinstance(row, dict):
                continue
            if row.get("cloud_multiplier") is None:
                row["cloud_multiplier"] = 1.0
            if row.get("current_gm_pct") is not None and row.get("regime_signal") is None:
                row["regime_signal"] = regime_signal_from_gm(row.get("gm_z_3yr"), row.get("quartile"))
        return

    values = [gm for _, gm in peers]
    mean = sum(values) / len(values)
    var = sum((gm - mean) ** 2 for gm in values) / len(values)
    std = var**0.5
    ordered = sorted(values)
    n = len(ordered)

    for idx, gm in peers:
        row = rows[idx]
        if row.get("gm_z_3yr") is None:
            row["gm_z_3yr"] = round((gm - mean) / std, 4) if std > 1e-9 else 0.0
        if row.get("quartile") is None:
            # High GM → Q1 (rich); low GM → Q4 (cheap) — matches regime_signal_from_gm.
            rank = sum(1 for v in ordered if v <= gm) / n
            if rank >= 0.75:
                row["quartile"] = "Q1"
            elif rank >= 0.5:
                row["quartile"] = "Q2"
            elif rank >= 0.25:
                row["quartile"] = "Q3"
            else:
                row["quartile"] = "Q4"
        if row.get("cloud_multiplier") is None:
            row["cloud_multiplier"] = 1.0
        if row.get("regime_signal") is None:
            row["regime_signal"] = regime_signal_from_gm(row.get("gm_z_3yr"), row.get("quartile"))


def merge_csv_into_stub(doc: dict[str, Any], csv_path: Path) -> dict[str, Any]:
    """Merge parsed Koyfin GM columns into an existing corporate_gm document."""
    merged = json.loads(json.dumps(doc))
    parsed = parse_koyfin_watchlist_csv(csv_path)
    live_count = 0

    for bucket in ("rows", "nice_to_have"):
        for row in merged.get(bucket, []):
            ticker = row.get("ticker")
            payload = parsed.get(ticker)
            if payload is None:
                continue
            for field in ("current_gm_pct", "avg_gm_3yr", "gm_z_3yr", "quartile"):
                value = payload.get(field)
                if value is not None:
                    row[field] = value
                    if field == "current_gm_pct":
                        live_count += 1
            if row.get("cloud_multiplier") is None:
                row["cloud_multiplier"] = 1.0
            if row.get("current_gm_pct") is not None:
                row["status"] = "live"
            elif any(row.get(field) is not None for field in ("avg_gm_3yr", "gm_z_3yr", "quartile")):
                row["status"] = "partial"

    # Derive right-half Litmus columns when Koyfin export lacks z/quartile.
    enrich_cross_section_gm_stats(merged.get("rows") or [])
    enrich_cross_section_gm_stats(merged.get("nice_to_have") or [])

    primary_rows = merged.get("rows", [])
    primary_live = sum(1 for row in primary_rows if row.get("current_gm_pct") is not None)
    if primary_live == len(PRIMARY_TICKERS):
        merged["data_status"] = "live"
    elif primary_live > 0:
        merged["data_status"] = "partial"
    else:
        merged["data_status"] = "stub"

    merged["as_of"] = _utc_now()
    merged["lineage"] = {
        "watchlist_url": merged.get("lineage", {}).get("watchlist_url") or load_watchlist_url(),
        "drop_file": str(csv_path),
        "ingested_at": _utc_now(),
        "live_primary_count": primary_live,
        "notes": None,
    }
    return merged


def validate_corporate_gm_doc(doc: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(doc, dict):
        return ["root: expected object"]

    for key in ("schema_version", "adapter_version", "data_status", "source", "export_id", "saved_view"):
        if key not in doc:
            errors.append(f"{key}: required")

    if doc.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version: expected {SCHEMA_VERSION!r}")
    if doc.get("adapter_version") != ADAPTER_VERSION:
        errors.append(f"adapter_version: expected {ADAPTER_VERSION!r}")
    if doc.get("data_status") not in {"stub", "partial", "live"}:
        errors.append(f"data_status: invalid {doc.get('data_status')!r}")

    tables = doc.get("tables")
    if not isinstance(tables, list) or len(tables) != 2:
        errors.append("tables: expected array of 2 midwest trade templates")
    else:
        for idx, table in enumerate(tables):
            if not isinstance(table, dict):
                errors.append(f"tables[{idx}]: expected object")
                continue
            if list(table.get("columns", [])) != list(LITMUS_COLUMNS):
                errors.append(f"tables[{idx}].columns: mismatch with Litmus §5 contract")
            if table.get("trade_id") not in TRADE_IDS:
                errors.append(f"tables[{idx}].trade_id: invalid {table.get('trade_id')!r}")

    rows = doc.get("rows")
    if not isinstance(rows, list):
        errors.append("rows: expected array")
    elif len(rows) != len(PRIMARY_TICKERS):
        errors.append(f"rows: expected {len(PRIMARY_TICKERS)} primary tickers")
    else:
        tickers = [row.get("ticker") for row in rows if isinstance(row, dict)]
        expected = [meta["ticker"] for meta in PRIMARY_TICKERS]
        if tickers != expected:
            errors.append(f"rows.tickers: expected {expected}, got {tickers}")
        for idx, row in enumerate(rows):
            if not isinstance(row, dict):
                errors.append(f"rows[{idx}]: expected object")
                continue
            for col in LITMUS_COLUMNS:
                if col not in row:
                    errors.append(f"rows[{idx}].{col}: required")
            if row.get("cloud_multiplier") != 1.0:
                errors.append(f"rows[{idx}].cloud_multiplier: expected default 1.0 in stub")

    nice = doc.get("nice_to_have")
    if not isinstance(nice, list):
        errors.append("nice_to_have: expected array")
    elif len(nice) != len(NICE_TO_HAVE_TICKERS):
        errors.append(f"nice_to_have: expected {len(NICE_TO_HAVE_TICKERS)} tickers")
    else:
        tickers = [row.get("ticker") for row in nice if isinstance(row, dict)]
        expected = [meta["ticker"] for meta in NICE_TO_HAVE_TICKERS]
        if tickers != expected:
            errors.append(f"nice_to_have.tickers: expected {expected}, got {tickers}")
        for idx, row in enumerate(nice):
            if not isinstance(row, dict):
                errors.append(f"nice_to_have[{idx}]: expected object")
                continue
            for col in LITMUS_COLUMNS:
                if col not in row:
                    errors.append(f"nice_to_have[{idx}].{col}: required")
            if row.get("tier") != "nice_to_have":
                errors.append(f"nice_to_have[{idx}].tier: expected nice_to_have")

    return errors


def _finalize_corporate_gm_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Ensure right-half Litmus columns are populated before write/return."""
    enrich_cross_section_gm_stats(doc.get("rows") or [])
    enrich_cross_section_gm_stats(doc.get("nice_to_have") or [])
    return doc


def ingest_corporate_gm(
    drop_dir: Path | None = None,
    *,
    out_path: Path | None = None,
    csv_path: Path | None = None,
) -> dict[str, Any]:
    """Ingest Koyfin watchlist CSV when present; otherwise emit typed stub."""
    target = Path(out_path or DEFAULT_OUT)
    stub = build_corporate_gm_stub()

    resolved_csv = csv_path
    if resolved_csv is None and drop_dir is not None:
        resolved_csv = discover_koyfin_csv(drop_dir)
    # Fallback: vendor export often lands in ~/Downloads before drop staging.
    # Only when using the real desk drop (never temp test dirs).
    if (resolved_csv is None or not resolved_csv.is_file()) and drop_dir is not None:
        drop_path = Path(drop_dir)
        desk_drop = Path.home() / "Downloads" / "whinfell_drop"
        if drop_path.resolve() == desk_drop.resolve() or drop_path.name == "whinfell_drop":
            downloads = Path.home() / "Downloads"
            if downloads.is_dir() and downloads.resolve() != drop_path.resolve():
                resolved_csv = discover_koyfin_csv(downloads)

    if resolved_csv is None or not resolved_csv.is_file():
        # Preserve an existing live/partial file when drop has no Midwest GM CSV yet.
        if target.is_file():
            try:
                existing = json.loads(target.read_text(encoding="utf-8"))
                if isinstance(existing, dict) and existing.get("data_status") in {"live", "partial"}:
                    finalized = _finalize_corporate_gm_doc(existing)
                    target.write_text(json.dumps(finalized, indent=2) + "\n", encoding="utf-8")
                    return finalized
            except (OSError, json.JSONDecodeError):
                pass
        write_corporate_gm_stub(target)
        return build_corporate_gm_stub()

    merged = _finalize_corporate_gm_doc(merge_csv_into_stub(stub, resolved_csv))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    return merged


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Ingest Koyfin Midwest corporate GM% into Litmus stub JSON.")
    parser.add_argument(
        "--drop-dir",
        type=Path,
        default=Path.home() / "Downloads" / "whinfell_drop",
        help="whinfell_drop directory for watchlist CSV discovery",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=None,
        help="Explicit Koyfin watchlist CSV path (overrides drop discovery)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="Output path for bang_bang_da/litmus/corporate_gm.json",
    )
    parser.add_argument(
        "--stub-only",
        action="store_true",
        help="Write typed stub without attempting CSV discovery",
    )
    args = parser.parse_args(argv)

    if args.stub_only:
        path = write_corporate_gm_stub(args.out)
        print(f"wrote stub {path}")
        return 0

    doc = ingest_corporate_gm(None if args.csv else args.drop_dir, out_path=args.out, csv_path=args.csv)
    print(f"wrote {args.out} data_status={doc.get('data_status')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())