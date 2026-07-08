"""BBDM v2.0 report schema — locked by Chunk 02 (bbdm-v2-report-schema)."""

from __future__ import annotations

from typing import Any

BBDM_VERSION = "2.0.0"

SIZING_BUCKETS = ("PASS", "1x", "2x", "3x", "BLOCKED", "DATA_GAP")
SIZING_MULTIPLIERS: dict[str, int | None] = {
    "PASS": 0,
    "1x": 1,
    "2x": 2,
    "3x": 3,
    "BLOCKED": None,
    "DATA_GAP": None,
}

TRADE_DIRECTIONS = ("buy_spread", "sell_spread", "none")
STRUCTURE_TYPES = ("basis", "calendar", "single")
RISK_ZONES = ("red", "amber", "green")
LITMUS_ALIGNMENTS = ("confirm", "neutral", "contradict")
ARTICULATOR_SOURCES = ("grok", "comet", "stub")

RISK_DASHBOARD_SCORES = ("whinfell_ex_china", "sq3", "combined")

INSPECTION_CHECK_IDS = (
    "data_live",
    "z_computed",
    "litmus_loaded",
    "articulator_fresh",
    "scores_present",
)

TRADE_IDS_V2 = (
    "btc_basis",
    "btc_calendar",
    "eth_basis",
    "eth_calendar",
    "midwest_basis",
    "midwest_calendar",
    "sofr_fed_funds",
    "curve_2s10s",
)

REQUIRED_ROOT_KEYS = (
    "bang_bang_da_version",
    "generated_at",
    "as_of",
    "snapshot_id",
    "window_days",
    "gate",
    "risk_dashboard",
    "summary",
    "trades",
    "litmus",
    "articulator",
    "inspection",
)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _require_dict(value: Any, path: str, errors: list[str]) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        errors.append(f"{path}: expected object")
        return None
    return value


def _require_list(value: Any, path: str, errors: list[str]) -> list[Any] | None:
    if not isinstance(value, list):
        errors.append(f"{path}: expected array")
        return None
    return value


def _require_str(value: Any, path: str, errors: list[str]) -> str | None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{path}: expected non-empty string")
        return None
    return value


def validate_risk_dashboard(block: Any, errors: list[str], *, path: str = "risk_dashboard") -> None:
    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    for key in RISK_DASHBOARD_SCORES:
        if key not in obj:
            errors.append(f"{path}.{key}: required")
        elif obj[key] is not None and not _is_number(obj[key]):
            errors.append(f"{path}.{key}: expected number or null")
    zones = obj.get("zones")
    zone_obj = _require_dict(zones, f"{path}.zones", errors)
    if zone_obj is not None:
        for key in RISK_DASHBOARD_SCORES:
            zone = zone_obj.get(key)
            if zone is not None and zone not in RISK_ZONES:
                errors.append(f"{path}.zones.{key}: invalid zone {zone!r}")


def validate_recommendation(block: Any, errors: list[str], *, path: str) -> None:
    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    bucket = obj.get("sizing_bucket")
    if bucket not in SIZING_BUCKETS:
        errors.append(f"{path}.sizing_bucket: invalid bucket {bucket!r}")
    direction = obj.get("direction")
    if direction not in TRADE_DIRECTIONS:
        errors.append(f"{path}.direction: invalid direction {direction!r}")
    multiplier = obj.get("sizing_multiplier")
    if bucket in SIZING_MULTIPLIERS and multiplier != SIZING_MULTIPLIERS[bucket]:
        errors.append(
            f"{path}.sizing_multiplier: expected {SIZING_MULTIPLIERS[bucket]!r} for bucket {bucket!r}, got {multiplier!r}"
        )
    if "structure" not in obj:
        errors.append(f"{path}.structure: required")


def validate_litmus(block: Any, errors: list[str], *, path: str = "litmus") -> None:
    from bang_bang_da.litmus_schema import validate_litmus_tables

    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    tables = obj.get("tables")
    if tables is not None:
        validate_litmus_tables(tables, errors, path=f"{path}.tables")
    midwest_secondary = obj.get("midwest_secondary")
    if midwest_secondary is not None:
        validate_litmus_tables(midwest_secondary, errors, path=f"{path}.midwest_secondary")
    by_trade = _require_dict(obj.get("by_trade"), f"{path}.by_trade", errors)
    if by_trade is not None:
        for trade_id, entry in by_trade.items():
            entry_obj = _require_dict(entry, f"{path}.by_trade.{trade_id}", errors)
            if entry_obj is None:
                continue
            alignment = entry_obj.get("alignment")
            if alignment is not None and alignment not in LITMUS_ALIGNMENTS:
                errors.append(f"{path}.by_trade.{trade_id}.alignment: invalid {alignment!r}")
    count = obj.get("unprocessed_filing_count")
    if count is not None and (not isinstance(count, int) or count < 0):
        errors.append(f"{path}.unprocessed_filing_count: expected non-negative integer")


def validate_articulator(block: Any, errors: list[str], *, path: str = "articulator") -> None:
    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    source = obj.get("source")
    if source not in ARTICULATOR_SOURCES:
        errors.append(f"{path}.source: invalid source {source!r}")
    by_trade = _require_dict(obj.get("by_trade"), f"{path}.by_trade", errors)
    if by_trade is not None:
        for trade_id, entry in by_trade.items():
            _require_dict(entry, f"{path}.by_trade.{trade_id}", errors)


def validate_inspection(block: Any, errors: list[str], *, path: str = "inspection") -> None:
    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    if "pass" not in obj or not isinstance(obj["pass"], bool):
        errors.append(f"{path}.pass: expected boolean")
    fail_count = obj.get("fail_count")
    if fail_count is not None and (not isinstance(fail_count, int) or fail_count < 0):
        errors.append(f"{path}.fail_count: expected non-negative integer")
    checks = _require_list(obj.get("checks"), f"{path}.checks", errors)
    if checks is None:
        return
    seen_ids: set[str] = set()
    actual_fail = 0
    for idx, check in enumerate(checks):
        check_obj = _require_dict(check, f"{path}.checks[{idx}]", errors)
        if check_obj is None:
            continue
        check_id = _require_str(check_obj.get("id"), f"{path}.checks[{idx}].id", errors)
        if check_id:
            seen_ids.add(check_id)
        _require_str(check_obj.get("label"), f"{path}.checks[{idx}].label", errors)
        if "pass" not in check_obj or not isinstance(check_obj["pass"], bool):
            errors.append(f"{path}.checks[{idx}].pass: expected boolean")
        elif not check_obj["pass"]:
            actual_fail += 1
    if fail_count is not None and fail_count != actual_fail:
        errors.append(f"{path}.fail_count: expected {actual_fail}, got {fail_count}")
    if obj.get("pass") is False and fail_count == 0:
        errors.append(f"{path}: pass=false requires fail_count > 0")
    if obj.get("pass") is True and fail_count not in (0, None):
        errors.append(f"{path}: pass=true requires fail_count=0")


def validate_trade(trade: Any, errors: list[str], *, path: str) -> None:
    obj = _require_dict(trade, path, errors)
    if obj is None:
        return
    trade_id = _require_str(obj.get("id"), f"{path}.id", errors)
    if trade_id and trade_id not in TRADE_IDS_V2:
        errors.append(f"{path}.id: unknown trade id {trade_id!r}")
    structure_type = obj.get("structure_type")
    if structure_type not in STRUCTURE_TYPES:
        errors.append(f"{path}.structure_type: invalid {structure_type!r}")
    for key in ("label", "unit", "dislocation", "data_status"):
        _require_str(obj.get(key), f"{path}.{key}", errors)
    for key in ("z_score", "z_abs", "current_value"):
        if key in obj and obj[key] is not None and not _is_number(obj[key]):
            errors.append(f"{path}.{key}: expected number or null")
    validate_recommendation(obj.get("recommendation"), errors, path=f"{path}.recommendation")


def validate_summary(block: Any, errors: list[str], *, path: str = "summary") -> None:
    obj = _require_dict(block, path, errors)
    if obj is None:
        return
    trade_count = obj.get("trade_count")
    if trade_count != 8:
        errors.append(f"{path}.trade_count: expected 8 for v2 report, got {trade_count!r}")
    bucket_counts = _require_dict(obj.get("bucket_counts"), f"{path}.bucket_counts", errors)
    if bucket_counts is not None:
        for bucket, count in bucket_counts.items():
            if bucket not in SIZING_BUCKETS:
                errors.append(f"{path}.bucket_counts.{bucket}: invalid bucket")
            if not isinstance(count, int) or count < 0:
                errors.append(f"{path}.bucket_counts.{bucket}: expected non-negative integer")
    top_bucket = obj.get("top_sizing_bucket")
    if top_bucket is not None and top_bucket not in SIZING_BUCKETS:
        errors.append(f"{path}.top_sizing_bucket: invalid bucket {top_bucket!r}")


def validate_report(report: Any, *, strict_trade_count: bool = True) -> list[str]:
    """Return a list of schema violations (empty list means valid)."""
    errors: list[str] = []
    obj = _require_dict(report, "report", errors)
    if obj is None:
        return errors

    version = obj.get("bang_bang_da_version")
    if version != BBDM_VERSION:
        errors.append(f"bang_bang_da_version: expected {BBDM_VERSION!r}, got {version!r}")

    for key in REQUIRED_ROOT_KEYS:
        if key not in obj:
            errors.append(f"{key}: required root key")

    validate_risk_dashboard(obj.get("risk_dashboard"), errors)
    validate_summary(obj.get("summary"), errors)
    validate_litmus(obj.get("litmus"), errors)
    validate_articulator(obj.get("articulator"), errors)
    validate_inspection(obj.get("inspection"), errors)

    trades = _require_list(obj.get("trades"), "trades", errors)
    if trades is not None:
        if strict_trade_count and len(trades) != 8:
            errors.append(f"trades: expected 8 entries for full v2 report, got {len(trades)}")
        for idx, trade in enumerate(trades):
            validate_trade(trade, errors, path=f"trades[{idx}]")

    return errors