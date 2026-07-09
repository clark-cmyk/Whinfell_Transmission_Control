#!/usr/bin/env python3
"""Complete a partial DataGatherer task_force with specialist stubs + WTM EXPORT.

Pattern (Jul 4 lesson): live gatherer snapshot + complete stubs until Grok 12-step runs.
Does not invent a second market history — stamps as_of/snapshot_id from gatherer output.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from statistics import mean

PIPELINE_SEQ = [
    "data_gatherer",
    "btc_eth_basis",
    "btc_eth_vol_arb",
    "compute_gpu",
    "power_nat_gas",
    "metals_debt",
    "china_sq3_deep",
    "sofr_fedfunds",
    "hy_vs_ig",
    "global_transmission",
    "master_sizing",
    "tx_integrator",
]

SPECIALIST_STUB_IDS = [
    "btc_eth_basis",
    "btc_eth_vol_arb",
    "compute_gpu",
    "power_nat_gas",
    "metals_debt",
    "china_sq3_deep",
    "sofr_fedfunds",
    "hy_vs_ig",
]


def _round_score(value: object) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return 0


def _node_scores(tf: dict) -> dict[str, float]:
    seed = ((tf.get("snapshot") or {}).get("global_transmission_seed") or {}).get("node_scores") or {}
    out: dict[str, float] = {}
    for k, v in seed.items():
        try:
            out[str(k)] = float(v)
        except (TypeError, ValueError):
            continue
    return out


def _verdict_and_gross(tf: dict) -> tuple[str, int, str]:
    snap = tf.get("snapshot") or {}
    ns = snap.get("node_summaries") or {}
    cc = ns.get("cockpit_context") or {}
    weakest = str(cc.get("weakest_node_id") or "")
    credit = ns.get("credit") or {}
    credit_state = str(credit.get("state") or "").lower()
    full = _round_score((snap.get("global") or {}).get("whinfell_score", 0))
    state = str((snap.get("global") or {}).get("transmission_state") or "").lower()

    if weakest == "credit" or "block" in credit_state:
        return (
            "WATCH",
            30,
            f"Task Force complete stub — elevated credit block ({weakest or 'credit'} weakest); "
            f"cap gross at 30%. Pipeline score {full}.",
        )
    if state in ("stressed", "impaired", "crisis") or full < 45:
        return (
            "WATCH",
            25,
            f"Task Force complete stub — {state or 'soft'} transmission (score {full}); cap gross at 25%.",
        )
    if full >= 70 and state in ("constructive", "supportive", "elevated", ""):
        return (
            "EXECUTE",
            40,
            f"Task Force complete stub — constructive tape (score {full}); probe gross 40%.",
        )
    return (
        "WATCH",
        30,
        f"Task Force complete stub — selective risk (score {full}); cap gross at 30%.",
    )


def _global_only_score(scores: dict[str, float], weakest: str) -> int:
    if not scores:
        return 0
    if weakest and weakest in scores and len(scores) > 1:
        vals = [v for k, v in scores.items() if k != weakest]
    else:
        vals = list(scores.values())
    return _round_score(mean(vals)) if vals else 0


def build_wtm_export(tf: dict, *, verdict: str, gross_pct: int, synthesis: str) -> str:
    snap = tf.get("snapshot") or {}
    g = snap.get("global") or {}
    china = snap.get("china") or {}
    href = snap.get("hydration_ref") or {}
    score = _round_score(g.get("whinfell_score", 0))
    state = g.get("transmission_state") or "elevated"
    regime = g.get("regime_tag") or "Task Force synthesis"
    key_obs = synthesis
    pipeline_obs = g.get("key_observation") or ""
    if pipeline_obs:
        key_obs = f"{synthesis} | {pipeline_obs}"
    lineage = href.get("lineage_hash") or ""
    snapshot_id = href.get("snapshot_id") or tf.get("snapshot_id") or ""
    as_of = href.get("as_of") or tf.get("as_of") or ""
    freshness = href.get("freshness_status") or "fresh"
    ts = str(as_of).replace("+00:00", "").replace("Z", "")

    lines = [
        "--- WTM EXPORT v2.1 ---",
        f"Whinfell Score: {score}",
        f"Transmission State: {state}",
        f"Regime Tag: Task Force synthesis — {regime}",
        f"Key Observation: {key_obs}",
        f"Gross Risk Recommendation: {gross_pct}% total, {verdict} posture",
        f"BTC Bias: {g.get('btc_bias') or 'Neutral'}",
        f"Timestamp: {ts}",
        f"SQ3 Score: {_round_score(g.get('sq3_score', china.get('sq3_score', 0)))}",
        f"SQ3 Band: {g.get('sq3_band') or china.get('sq3_band') or ''}",
        f"Policy Strength: {_round_score(china.get('policy_strength', 50))}",
        f"State Impulse Score: {_round_score(china.get('state_impulse_score', 0))}",
        f"Growth Impulse Score: {_round_score(china.get('growth_impulse_score', 0))}",
        f"China Regime Tag: {china.get('regime_tag') or 'desk-auto'}",
        f"Snapshot ID: {snapshot_id}",
        f"Lineage Hash: {lineage}",
        "Validation Status: complete",
        f"Data As Of: {as_of}",
        "Source Channel: task_force",
        f"Freshness Status: {freshness}",
        "",
    ]
    return "\n".join(lines)


def complete_stubs(tf: dict) -> dict:
    if tf.get("task_force_version") != "1.1.0":
        raise ValueError(f"task_force_version must be 1.1.0, got {tf.get('task_force_version')!r}")
    if tf.get("pipeline_seq") != PIPELINE_SEQ:
        raise ValueError("pipeline_seq mismatch")

    out = json.loads(json.dumps(tf))  # deep copy
    as_of = out.get("as_of") or ""
    snap = out.setdefault("snapshot", {})
    g = snap.get("global") or {}
    ns = snap.get("node_summaries") or {}
    cc = ns.get("cockpit_context") or {}
    weakest = str(cc.get("weakest_node_id") or "")
    scores = _node_scores(out)
    full_score = _round_score(g.get("whinfell_score", 0))
    global_only = _global_only_score(scores, weakest)
    verdict, gross_pct, synthesis = _verdict_and_gross(out)

    specialists = dict(out.get("specialists") or {})
    # Refresh global_transmission stub against live snapshot
    specialists["global_transmission"] = {
        "status": "stub",
        "node_id": "cockpit_context",
        "signal": "pending",
        "confidence": 0.0,
        "invalidation": "",
        "as_of": as_of,
        "global_only_score": global_only,
        "global_transmission_state": "pending",
        "key_drivers": [weakest] if weakest else [],
        "vs_full_signal": {
            "full_score": full_score,
            "delta": None,
            "interpretation": "pending GlobalTransmission specialist",
        },
    }

    for sid in SPECIALIST_STUB_IDS:
        prior = specialists.get(sid) or {}
        # Keep live Grok specialist layers if status already ok with real signal
        if (
            prior.get("status") == "ok"
            and prior.get("signal")
            and prior.get("signal") not in ("stub", "pending")
        ):
            continue
        specialists[sid] = {
            "status": "stub",
            "node_id": sid,
            "signal": "stub",
            "confidence": 0.5,
            "invalidation": "",
            "as_of": as_of,
        }

    wtm = build_wtm_export(out, verdict=verdict, gross_pct=gross_pct, synthesis=synthesis)
    specialists["tx_integrator"] = {
        "status": "ok",
        "node_id": None,
        "signal": "WTM EXPORT v2.1 ready for Control import",
        "confidence": 1.0,
        "invalidation": "",
        "as_of": as_of,
        "wtm_export_v21": wtm,
        "import_targets": [
            "global",
            "cockpit_context",
            "grossRiskRecommendation",
            "wtm_export_v21",
        ],
        "task_force_ref": {
            "task_force_version": "1.1.0",
            "snapshot_id": out.get("snapshot_id") or "",
            "verdict": verdict,
        },
    }

    out["specialists"] = specialists
    out["master_sizing"] = {
        "verdict": verdict,
        "gross_pct": gross_pct,
        "synthesis_signal": synthesis,
        "layer2_cap": "reduced" if verdict != "EXECUTE" else "probe",
        "global_only_score": global_only,
        "full_whinfell_score": full_score,
    }
    out["wtm_export_v21"] = wtm
    out["validation_status"] = "complete"
    return out


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Complete partial task_force with specialist stubs + WTM EXPORT v2.1"
    )
    parser.add_argument(
        "--input",
        default=str(root / "data/hydration/task_force.json"),
        help="Partial (or prior) task_force JSON",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Output path (default: overwrite --input)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate + print summary; do not write",
    )
    args = parser.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output) if args.output else in_path
    tf = json.loads(in_path.read_text(encoding="utf-8"))
    completed = complete_stubs(tf)

    print(f"snapshot_id={completed.get('snapshot_id')}")
    print(f"as_of={completed.get('as_of')}")
    print(f"validation_status={completed.get('validation_status')}")
    ms = completed.get("master_sizing") or {}
    print(f"verdict={ms.get('verdict')} gross_pct={ms.get('gross_pct')}")
    print(f"full_whinfell_score={ms.get('full_whinfell_score')} global_only={ms.get('global_only_score')}")
    print(f"specialists={sorted((completed.get('specialists') or {}).keys())}")
    wtm = completed.get("wtm_export_v21") or ""
    print(f"wtm_export_v21={'yes' if wtm else 'no'} source_channel={'task_force' in wtm}")

    if args.dry_run:
        print("DRY-RUN complete_task_force_stubs OK")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_path.with_name(f"{out_path.name}.tmp")
    tmp.write_text(json.dumps(completed, indent=2) + "\n", encoding="utf-8")
    tmp.replace(out_path)
    print(f"written: {out_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 — CLI surface
        print(f"FAIL complete_task_force_stubs: {exc}", file=sys.stderr)
        raise SystemExit(1)
