"""BBDM v2.0 risk dashboard contract — locked by Chunk 05 (bbdm-risk-dashboard-contract)."""

from __future__ import annotations

from typing import Any

from bang_bang_da.bbdm_report_schema import RISK_DASHBOARD_SCORES, RISK_ZONES

RISK_DASHBOARD_VERSION = "2.0.0-chunk05"

# Primary hydration paths (BUILD locked — see BBDM_v2_Development_Plan.md §3).
SCORE_SOURCE_PATHS: dict[str, tuple[tuple[str, ...], ...]] = {
    "whinfell_ex_china": (
        ("task_force", "specialists", "global_transmission", "global_only_score"),
        ("task_force_panels", "specialists", "global_transmission", "global_only_score"),
    ),
    "sq3": (
        ("china", "sq3_score"),
        ("global", "sq3_score"),
    ),
    "combined": (
        ("global", "whinfell_score"),
        ("margin_rules", "whinfell_score"),
    ),
}

SOURCE_LABELS: dict[str, str] = {
    "whinfell_ex_china": "task_force.specialists.global_transmission.global_only_score",
    "sq3": "china.sq3_score",
    "combined": "global.whinfell_score",
}

FALLBACK_SOURCE_LABEL = "node_cockpits.liquidity+credit+basis.composite_score_mean"
FALLBACK_NODE_IDS = ("liquidity", "credit", "basis")


def _dig(data: dict, *keys: str, default: Any = None) -> Any:
    cur: Any = data
    for key in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(key)
        if cur is None:
            return default
    return cur


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    if isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        s = val.strip()
        if not s or s.lower() in ("unavailable", "—", "-", "n/a", "null"):
            return None
        try:
            return float(s.replace(",", ""))
        except ValueError:
            return None
    return None


def score_zone(score: float | None) -> str | None:
    """Desk zone bands aligned with Transmission Control scoreZone (65 / 50)."""
    if score is None:
        return None
    if score >= 65:
        return "green"
    if score >= 50:
        return "amber"
    return "red"


def _path_label(path: tuple[str, ...]) -> str:
    return ".".join(path)


def _extract_score(bundle: dict, paths: tuple[tuple[str, ...], ...]) -> tuple[float | None, str | None]:
    for path in paths:
        value = _safe_float(_dig(bundle, *path))
        if value is not None:
            return value, _path_label(path)
    return None, None


def fallback_global_only_score(bundle: dict) -> float | None:
    """Mean of liquidity + credit + basis composite scores (spec §3 fallback)."""
    scores: list[float] = []
    for node_id in FALLBACK_NODE_IDS:
        value = _safe_float(_dig(bundle, "node_cockpits", node_id, "composite_score"))
        if value is not None:
            scores.append(value)
    if not scores:
        return None
    return round(sum(scores) / len(scores), 2)


def extract_whinfell_ex_china(bundle: dict) -> tuple[float | None, str]:
    score, path = _extract_score(bundle, SCORE_SOURCE_PATHS["whinfell_ex_china"])
    if score is not None:
        return score, path or SOURCE_LABELS["whinfell_ex_china"]
    fallback = fallback_global_only_score(bundle)
    if fallback is not None:
        return fallback, FALLBACK_SOURCE_LABEL
    return None, SOURCE_LABELS["whinfell_ex_china"]


def extract_sq3(bundle: dict) -> tuple[float | None, str]:
    score, path = _extract_score(bundle, SCORE_SOURCE_PATHS["sq3"])
    return score, path or SOURCE_LABELS["sq3"]


def extract_combined(bundle: dict) -> tuple[float | None, str]:
    score, path = _extract_score(bundle, SCORE_SOURCE_PATHS["combined"])
    return score, path or SOURCE_LABELS["combined"]


def build_risk_dashboard(bundle: dict) -> dict[str, Any]:
    """Emit v2 report root `risk_dashboard` block from hydration bundle."""
    whinfell_ex_china, whinfell_src = extract_whinfell_ex_china(bundle)
    sq3, sq3_src = extract_sq3(bundle)
    combined, combined_src = extract_combined(bundle)

    zones: dict[str, str | None] = {}
    for key, score in (
        ("whinfell_ex_china", whinfell_ex_china),
        ("sq3", sq3),
        ("combined", combined),
    ):
        zones[key] = score_zone(score)

    return {
        "whinfell_ex_china": whinfell_ex_china,
        "sq3": sq3,
        "combined": combined,
        "zones": zones,
        "sources": {
            "whinfell_ex_china": whinfell_src,
            "sq3": sq3_src,
            "combined": combined_src,
        },
    }


def validate_risk_dashboard_contract() -> list[str]:
    """Return contract consistency violations (empty list means valid)."""
    errors: list[str] = []

    for key in RISK_DASHBOARD_SCORES:
        if key not in SCORE_SOURCE_PATHS:
            errors.append(f"SCORE_SOURCE_PATHS missing {key!r}")
        if key not in SOURCE_LABELS:
            errors.append(f"SOURCE_LABELS missing {key!r}")

    zone_cases: list[tuple[float | None, str | None]] = [
        (None, None),
        (49.9, "red"),
        (50.0, "amber"),
        (64.9, "amber"),
        (65.0, "green"),
        (80.0, "green"),
    ]
    for score, expected in zone_cases:
        if score_zone(score) != expected:
            errors.append(f"score_zone({score!r}): expected {expected!r}")

    bundle = {
        "global": {"whinfell_score": 38, "sq3_score": 40},
        "china": {"sq3_score": 61},
        "task_force": {
            "specialists": {
                "global_transmission": {"global_only_score": 52},
            }
        },
    }
    dash = build_risk_dashboard(bundle)
    for key in RISK_DASHBOARD_SCORES:
        if key not in dash:
            errors.append(f"build_risk_dashboard missing {key!r}")
    if dash["whinfell_ex_china"] != 52.0:
        errors.append("whinfell_ex_china should read task_force global_only_score")
    if dash["sq3"] != 61.0:
        errors.append("china.sq3_score should win over global.sq3_score")
    if dash["combined"] != 38.0:
        errors.append("combined should read global.whinfell_score")
    if dash["zones"]["combined"] != "red":
        errors.append("combined 38 should be red zone")

    fallback_bundle = {
        "global": {"whinfell_score": 38},
        "china": {"sq3_score": 55},
        "node_cockpits": {
            "liquidity": {"composite_score": 100},
            "credit": {"composite_score": 12},
            "basis": {"composite_score": 100},
        },
    }
    fb = build_risk_dashboard(fallback_bundle)
    if fb["whinfell_ex_china"] != 70.67:
        errors.append(f"fallback global_only expected 70.67, got {fb['whinfell_ex_china']!r}")
    if fb["sources"]["whinfell_ex_china"] != FALLBACK_SOURCE_LABEL:
        errors.append("fallback source label mismatch")

    for zone in fb["zones"].values():
        if zone is not None and zone not in RISK_ZONES:
            errors.append(f"invalid zone {zone!r}")

    return errors