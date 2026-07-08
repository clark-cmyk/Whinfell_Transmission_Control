"""BBDM v2 Chunk 21 — three-score gate overlay with per-node blocks_rv."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from bang_bang_da.bbdm_report_schema import RISK_DASHBOARD_SCORES, SIZING_BUCKETS
from whinfell_pipeline.bbdm_risk_dashboard import build_risk_dashboard, score_zone

GATE_VERSION = "2.0.0-chunk21"

GLOBAL_BLOCK_THRESHOLD = 50.0

ZONE_VERDICT_CAP: dict[str, str] = {
    "green": "3x",
    "amber": "1x",
    "red": "BLOCKED",
}

CAP_PRECEDENCE: dict[str, int] = {
    "BLOCKED": 0,
    "DATA_GAP": 0,
    "PASS": 1,
    "1x": 2,
    "2x": 3,
    "3x": 4,
}

# v2 registry node_id → cockpit gate_interaction path (v1.2 contract).
NODE_GATE_ALIASES: dict[str, str] = {
    "aicompute": "highbeta",
}


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


def min_verdict_cap(*caps: str) -> str:
    """Return the most restrictive sizing cap."""
    present = [cap for cap in caps if cap in CAP_PRECEDENCE]
    if not present:
        return "3x"
    return min(present, key=lambda cap: CAP_PRECEDENCE[cap])


def verdict_cap_from_zones(zones: dict[str, str | None]) -> str:
    """Derive global verdict cap from the three-score dashboard zones."""
    caps: list[str] = []
    for key in RISK_DASHBOARD_SCORES:
        zone = zones.get(key)
        if zone in ZONE_VERDICT_CAP:
            caps.append(ZONE_VERDICT_CAP[zone])
    return min_verdict_cap(*caps) if caps else "3x"


def _cockpit_gate_node(node_id: str) -> str:
    return NODE_GATE_ALIASES.get(node_id, node_id)


def node_gate_interaction(bundle: dict, node_id: str) -> dict[str, Any]:
    """Load per-node gate_interaction block (v1.2 contract)."""
    cockpit_node = _cockpit_gate_node(node_id)
    gi = _dig(bundle, "node_cockpits", cockpit_node, "gate_interaction", default={}) or {}
    return gi if isinstance(gi, dict) else {}


@dataclass(frozen=True)
class GlobalGateState:
    risk_dashboard: dict[str, Any]
    whinfell_score: float | None
    whinfell_ex_china: float | None
    sq3: float | None
    combined: float | None
    zones: dict[str, str | None]
    zone: str
    blocked: bool
    block_reason: str
    verdict_cap: str
    transmission_state: str
    regime_tag: str
    tier: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "whinfell_score": self.whinfell_score,
            "whinfell_ex_china": self.whinfell_ex_china,
            "sq3": self.sq3,
            "combined": self.combined,
            "zones": self.zones,
            "transmission_state": self.transmission_state,
            "regime_tag": self.regime_tag,
            "tier": self.tier,
            "zone": self.zone,
            "blocked": self.blocked,
            "block_reason": self.block_reason,
            "verdict_cap": self.verdict_cap,
        }


@dataclass(frozen=True)
class TradeGateState:
    blocked: bool
    block_reason: str
    gate_zone: str
    verdict_cap: str
    node_blocks_rv: bool
    node_id: str
    cockpit_gate_node: str


def build_global_gate(bundle: dict) -> GlobalGateState:
    """Build report-root gate block from the three-score risk dashboard."""
    dash = build_risk_dashboard(bundle)
    combined = dash.get("combined")
    whinfell_ex_china = dash.get("whinfell_ex_china")
    sq3 = dash.get("sq3")
    zones = dash.get("zones") or {}

    blocked = combined is not None and combined < GLOBAL_BLOCK_THRESHOLD
    block_reason = ""
    if blocked and combined is not None:
        block_reason = f"Global Whinfell score {combined:.0f} < 50 — layer2/3 blocked"

    verdict_cap = "BLOCKED" if blocked else verdict_cap_from_zones(zones)
    zone = zones.get("combined") or score_zone(combined) or "red"

    tier = _dig(bundle, "margin_rules", "tier", default="unknown") or "unknown"

    return GlobalGateState(
        risk_dashboard=dash,
        whinfell_score=combined,
        whinfell_ex_china=whinfell_ex_china,
        sq3=sq3,
        combined=combined,
        zones=zones,
        zone=zone,
        blocked=blocked,
        block_reason=block_reason,
        verdict_cap=verdict_cap,
        transmission_state=_dig(bundle, "global", "transmission_state", default="unknown") or "unknown",
        regime_tag=_dig(bundle, "global", "regime_tag", default="") or "",
        tier=str(tier),
    )


def evaluate_trade_gate(
    node_id: str,
    global_gate: GlobalGateState,
    bundle: dict,
) -> TradeGateState:
    """Apply global gate + per-node blocks_rv for a trade."""
    gi = node_gate_interaction(bundle, node_id)
    cockpit_gate_node = _cockpit_gate_node(node_id)
    node_blocks_rv = bool(gi.get("blocks_rv"))
    node_zone = gi.get("zone") or global_gate.zone
    node_note = str(gi.get("note") or "").strip()

    blocked = global_gate.blocked or node_blocks_rv
    if node_blocks_rv and node_note:
        block_reason = node_note
    elif global_gate.blocked:
        block_reason = global_gate.block_reason
    else:
        block_reason = ""

    node_cap = ZONE_VERDICT_CAP.get(str(node_zone), "BLOCKED")
    if blocked:
        verdict_cap = "BLOCKED"
    else:
        verdict_cap = min_verdict_cap(global_gate.verdict_cap, node_cap)

    return TradeGateState(
        blocked=blocked,
        block_reason=block_reason,
        gate_zone=str(node_zone),
        verdict_cap=verdict_cap,
        node_blocks_rv=node_blocks_rv,
        node_id=node_id,
        cockpit_gate_node=cockpit_gate_node,
    )


def apply_gate_to_recommendation(
    recommendation: dict[str, Any],
    trade_gate: TradeGateState,
) -> dict[str, Any]:
    """Ensure BLOCKED gate overrides sizing bucket on trade.recommendation."""
    if not trade_gate.blocked:
        return recommendation
    return {
        **recommendation,
        "sizing_bucket": "BLOCKED",
        "sizing_multiplier": None,
    }


def validate_gate_overlay() -> list[str]:
    """Return gate overlay consistency violations (empty list means valid)."""
    errors: list[str] = []

    bundle_red = {
        "global": {"whinfell_score": 38, "transmission_state": "impaired"},
        "china": {"sq3_score": 61},
        "task_force": {
            "specialists": {"global_transmission": {"global_only_score": 52}},
        },
    }
    gate = build_global_gate(bundle_red)
    if not gate.blocked:
        errors.append("combined 38 must block globally")
    if gate.verdict_cap != "BLOCKED":
        errors.append("blocked global gate must set verdict_cap BLOCKED")
    if gate.whinfell_score != 38.0:
        errors.append("whinfell_score alias must equal combined score")

    bundle_amber = {
        "global": {"whinfell_score": 55},
        "china": {"sq3_score": 70},
        "task_force": {
            "specialists": {"global_transmission": {"global_only_score": 68}},
        },
    }
    gate_amber = build_global_gate(bundle_amber)
    if gate_amber.blocked:
        errors.append("combined 55 must not block globally")
    if gate_amber.verdict_cap != "1x":
        errors.append("all-amber dashboard should cap at 1x")

    bundle_green = {
        "global": {"whinfell_score": 72},
        "china": {"sq3_score": 80},
        "task_force": {
            "specialists": {"global_transmission": {"global_only_score": 75}},
        },
    }
    gate_green = build_global_gate(bundle_green)
    if gate_green.verdict_cap != "3x":
        errors.append("all-green dashboard should cap at 3x")

    node_bundle = {
        "global": {"whinfell_score": 72},
        "china": {"sq3_score": 80},
        "task_force": {
            "specialists": {"global_transmission": {"global_only_score": 75}},
        },
        "node_cockpits": {
            "basis": {
                "gate_interaction": {
                    "zone": "red",
                    "blocks_rv": True,
                    "note": "Basis node blocks RV expression",
                }
            }
        },
    }
    global_open = build_global_gate(node_bundle)
    trade_gate = evaluate_trade_gate("basis", global_open, node_bundle)
    if not trade_gate.blocked:
        errors.append("node blocks_rv must block trade")
    if trade_gate.verdict_cap != "BLOCKED":
        errors.append("node blocks_rv must set verdict_cap BLOCKED")
    if trade_gate.block_reason != "Basis node blocks RV expression":
        errors.append("node gate note should win as block_reason")

    alias_bundle = {
        "global": {"whinfell_score": 72},
        "node_cockpits": {
            "highbeta": {
                "gate_interaction": {
                    "zone": "amber",
                    "blocks_rv": False,
                    "note": "Layer2 probe cap",
                }
            }
        },
    }
    global_alias = build_global_gate(alias_bundle)
    ai_gate = evaluate_trade_gate("aicompute", global_alias, alias_bundle)
    if ai_gate.cockpit_gate_node != "highbeta":
        errors.append("aicompute must alias to highbeta gate node")

    rec = apply_gate_to_recommendation(
        {"direction": "buy_spread", "sizing_bucket": "3x", "sizing_multiplier": 3, "structure": "x"},
        TradeGateState(
            blocked=True,
            block_reason="blocked",
            gate_zone="red",
            verdict_cap="BLOCKED",
            node_blocks_rv=True,
            node_id="basis",
            cockpit_gate_node="basis",
        ),
    )
    if rec["sizing_bucket"] != "BLOCKED" or rec["sizing_multiplier"] is not None:
        errors.append("apply_gate_to_recommendation must override sizing to BLOCKED")

    for cap in (*ZONE_VERDICT_CAP.values(), "BLOCKED"):
        if cap not in SIZING_BUCKETS:
            errors.append(f"verdict_cap {cap!r} must be a sizing bucket")

    return errors