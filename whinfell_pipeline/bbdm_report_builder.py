"""BBDM v2 Chunk 22 — litmus, articulator, and inspection report blocks."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from bang_bang_da.bbdm_report_schema import INSPECTION_CHECK_IDS, SIZING_BUCKETS
from whinfell_pipeline.coinglass_perp import build_crypto_market_stub
from bang_bang_da.litmus_midwest import (
    build_midwest_litmus_tables,
    build_midwest_secondary_litmus_tables,
)
from whinfell_pipeline.koyfin_corporate_gm import (
    build_corporate_gm_stub,
    discover_koyfin_csv,
    merge_csv_into_stub,
)

REPORT_BLOCKS_VERSION = "2.0.0-chunk25"

CHECK_LABELS: dict[str, str] = {
    "data_live": "Primary series marked live or rv_history",
    "z_computed": "Z-score computed for active trade",
    "litmus_loaded": "Litmus tables loaded for active trade",
    "articulator_fresh": "Articulator commentary generated",
    "scores_present": "Three-score risk dashboard present",
}

CHECK_HINTS: dict[str, str | None] = {
    "litmus_loaded": "Populate litmus rows after Koyfin GM export lands in whinfell_drop",
    "articulator_fresh": "Run articulator refresh after Grok path ships (Chunk 34)",
}


def _drop_dir() -> Path:
    return Path.home() / "Downloads" / "whinfell_drop"


def load_corporate_gm_doc(root: Path) -> dict[str, Any]:
    """Load corporate GM litmus doc — merge drop CSV when present."""
    out_path = root / "bang_bang_da" / "litmus" / "corporate_gm.json"
    stub = build_corporate_gm_stub()
    csv_path = discover_koyfin_csv(_drop_dir())
    if csv_path is not None:
        return merge_csv_into_stub(stub, csv_path)
    if out_path.is_file():
        try:
            return json.loads(out_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return stub


def load_crypto_market_doc(root: Path) -> dict[str, Any]:
    """Load CoinGlass crypto market litmus stub (live fetch deferred to Chunk 17 env gate)."""
    out_path = root / "bang_bang_da" / "litmus" / "crypto_market.json"
    if out_path.is_file():
        try:
            return json.loads(out_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return build_crypto_market_stub()


def build_litmus_block(root: Path) -> dict[str, Any]:
    """Assemble report.litmus from corporate GM + crypto market adapters."""
    corporate = load_corporate_gm_doc(root)
    crypto = load_crypto_market_doc(root)

    primary_midwest = build_midwest_litmus_tables(corporate)
    secondary_midwest = build_midwest_secondary_litmus_tables(corporate)
    tables: list[dict[str, Any]] = list(primary_midwest) + list(secondary_midwest)

    for table in crypto.get("tables", []):
        if isinstance(table, dict):
            tables.append(table)

    by_trade: dict[str, dict[str, Any]] = {}
    for table in tables:
        trade_id = table.get("trade_id")
        table_id = table.get("id")
        if not trade_id or not table_id:
            continue
        entry = by_trade.setdefault(
            trade_id,
            {"alignment": "neutral", "table_ids": [], "headline": None},
        )
        if table_id not in entry["table_ids"]:
            entry["table_ids"].append(table_id)

    for trade_id in ("midwest_basis", "midwest_calendar"):
        if trade_id not in by_trade:
            continue
        if corporate.get("data_status") == "live":
            by_trade[trade_id]["alignment"] = "confirm"
        elif corporate.get("data_status") == "partial":
            by_trade[trade_id]["alignment"] = "neutral"

    return {
        "tables": tables,
        "midwest_secondary": secondary_midwest,
        "by_trade": by_trade,
        "unprocessed_filing_count": 0,
    }


def build_articulator_stub(trades: list[dict[str, Any]]) -> dict[str, Any]:
    """Stub articulator block until Grok/Comet path ships (Chunk 34)."""
    return {
        "source": "stub",
        "generated_at": None,
        "by_trade": {
            trade["id"]: {"headline": None, "body": None, "prompt_version": None}
            for trade in trades
            if trade.get("id")
        },
    }


def build_inspection(
    trades: list[dict[str, Any]],
    litmus: dict[str, Any],
    risk_dashboard: dict[str, Any],
) -> dict[str, Any]:
    """Build report.inspection checklist from scored trades and litmus state."""
    scores_present = all(
        risk_dashboard.get(key) is not None
        for key in ("whinfell_ex_china", "sq3", "combined")
    )
    z_computed = any(t.get("z_score") is not None for t in trades)
    data_live = any(
        t.get("data_status") in ("live", "rv_history")
        for t in trades
        if t.get("z_score") is not None
    )
    litmus_loaded = any(len(tbl.get("rows") or []) > 0 for tbl in litmus.get("tables", []))
    articulator_fresh = False

    flags = {
        "scores_present": scores_present,
        "z_computed": z_computed,
        "data_live": data_live,
        "litmus_loaded": litmus_loaded,
        "articulator_fresh": articulator_fresh,
    }

    checks: list[dict[str, Any]] = []
    fail_count = 0
    for check_id in INSPECTION_CHECK_IDS:
        passed = flags.get(check_id, False)
        if not passed:
            fail_count += 1
        checks.append(
            {
                "id": check_id,
                "label": CHECK_LABELS.get(check_id, check_id),
                "pass": passed,
                "hint": None if passed else CHECK_HINTS.get(check_id),
            }
        )

    return {
        "pass": fail_count == 0,
        "fail_count": fail_count,
        "checks": checks,
    }


def build_v2_summary(trades: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate v2 summary block from sorted trade dicts."""
    bucket_counts = {bucket: 0 for bucket in SIZING_BUCKETS}
    for trade in trades:
        bucket = (trade.get("recommendation") or {}).get("sizing_bucket", "DATA_GAP")
        if bucket in bucket_counts:
            bucket_counts[bucket] += 1

    top = trades[0] if trades else None
    return {
        "trade_count": len(trades),
        "bucket_counts": bucket_counts,
        "top_signal": top.get("id") if top else None,
        "top_z": top.get("z_score") if top else None,
        "top_sizing_bucket": (top.get("recommendation") or {}).get("sizing_bucket") if top else None,
    }