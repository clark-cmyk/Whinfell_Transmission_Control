#!/usr/bin/env python3
"""TCM-Task-DataGatherer v1.1.0 — build task_force snapshot from hydration latest.json."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

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

NODE_IDS = ("basis", "credit", "liquidity", "breadth", "highbeta")


def lead_rv(cockpit: dict) -> str:
    rv = cockpit.get("rv_basis") or {}
    sid = rv.get("active_series_id")
    series = (rv.get("series") or {}).get(sid) or {}
    label = series.get("label", "")
    richness = rv.get("richness_label", "")
    if label and richness:
        return f"{label} ({richness})"
    if label:
        return label
    rel = cockpit.get("relative_value") or {}
    structure = rel.get("structure", "")
    posture = rel.get("posture", "")
    if structure and posture and posture != "neutral":
        return f"{posture} — {structure}"
    return structure or posture or ""


def node_summary(cockpit: dict, cc: dict) -> dict:
    gate = (cockpit.get("gate_interaction") or {}).get("zone") or cc.get("gate_zone", "")
    return {
        "state": cockpit.get("band") or cockpit.get("band_key", ""),
        "gate": gate,
        "lead_rv": lead_rv(cockpit),
    }


def gpu_basis(ai: dict) -> str:
    note = (ai.get("ladder_stage") or {}).get("note", "")
    if note:
        return note
    ornn = ai.get("ornn_h200") or {}
    rental = ornn.get("rental_usd_per_hr") or {}
    spot = rental.get("spot")
    fwd3 = rental.get("3m_fwd")
    gpu = ornn.get("gpu", "GPU")
    if spot is not None and fwd3 is not None:
        shape = "contango" if fwd3 > spot else "backwardation"
        return f"{gpu} {shape}: spot {spot} → 3M {fwd3}"
    return ""


def power_basis(ai: dict) -> str:
    miso = ai.get("miso_indiana_hub") or {}
    lmp = miso.get("lmp_usd_per_mwh") or {}
    rt, da = lmp.get("rt"), lmp.get("da")
    if rt is not None and da is not None:
        return f"MISO RT ${rt}/MWh vs DA ${da}"
    return ""


def trim_provenance(h: dict) -> dict:
    prov = h.get("ingest_provenance") or {}
    sources = prov.get("sources")
    if not sources:
        seen: set[str] = set()
        sources = []
        for entry in prov.get("entries") or []:
            src = entry.get("source")
            if src and src not in seen:
                seen.add(src)
                sources.append({"source": src, "as_of": h.get("as_of", ""), "stale_flags": []})
    else:
        sources = [
            {k: s.get(k) for k in ("source", "as_of", "stale_flags") if k in s}
            for s in sources
        ]
    return {
        "sources": sources,
        "as_of": prov.get("as_of", h.get("as_of", "")),
        "stale_flags": prov.get("stale_flags", h.get("warnings", [])),
    }


def build(h: dict) -> dict:
    g = h.get("global") or {}
    nc = h.get("node_cockpits") or {}
    cc = h.get("cockpit_context") or {}
    ai = h.get("ai_compute") or {}
    margin = h.get("margin_rules") or {}

    node_scores = {
        nid: (nc.get(nid) or {}).get("composite_score", 0) for nid in NODE_IDS
    }

    summaries: dict = {}
    for nid in NODE_IDS:
        cockpit = nc.get(nid) or {}
        entry = node_summary(cockpit, cc)
        if nid == "highbeta":
            entry["layer2_allowed"] = bool(margin.get("layer2_allowed", False))
        summaries[nid] = entry

    summaries["ai_compute"] = {
        "gpu_basis": gpu_basis(ai),
        "power_basis": power_basis(ai),
    }
    summaries["cockpit_context"] = {
        "weakest_node_id": cc.get("weakest_node_id", ""),
        "transmission_health_score": cc.get("transmission_health_score", 0),
        "gate_zone": cc.get("gate_zone", ""),
    }

    return {
        "task_force_version": "1.1.0",
        "as_of": h.get("as_of"),
        "snapshot_id": h.get("snapshot_id"),
        "validation_status": "partial",
        "pipeline_seq": list(PIPELINE_SEQ),
        "snapshot": {
            "hydration_ref": {
                "snapshot_id": h.get("snapshot_id", ""),
                "as_of": h.get("as_of", ""),
                "hydration_version": h.get("hydration_version", ""),
                "lineage_hash": h.get("lineage_hash", ""),
                "freshness_status": h.get("freshness_status", ""),
                "validation_status": h.get("validation_status", ""),
            },
            "global": {
                "whinfell_score": g.get("whinfell_score", 0),
                "transmission_state": g.get("transmission_state", ""),
                "regime_tag": g.get("regime_tag", ""),
                "sq3_score": g.get("sq3_score", 0),
                "sq3_band": g.get("sq3_band", ""),
                "btc_bias": g.get("btc_bias", ""),
                "key_observation": g.get("key_observation", ""),
            },
            "china": h.get("china", {}),
            "china_ladder": h.get("china_ladder", {}),
            "execution": {
                "near_month": g.get("near_month", ""),
                "far_month": g.get("far_month", ""),
                "basis_spread": g.get("basis_spread", ""),
                "ref_low": g.get("ref_low", ""),
                "ref_mid": g.get("ref_mid", ""),
                "ref_high": g.get("ref_high", ""),
            },
            "corporate_credit": h.get("corporate_credit", {}),
            "flows_health": h.get("flows_health", {}),
            "global_transmission_seed": {
                "node_scores": node_scores,
                "full_whinfell_score": g.get("whinfell_score", 0),
                "sq3_excluded": True,
            },
            "node_summaries": summaries,
            "provenance": trim_provenance(h),
        },
        "specialists": {
            "global_transmission": {
                "status": "stub",
                "node_id": "cockpit_context",
                "signal": "pending",
                "confidence": 0.0,
                "invalidation": "",
                "as_of": h.get("as_of"),
                "global_only_score": None,
                "global_transmission_state": "pending",
                "key_drivers": [],
                "vs_full_signal": {
                    "full_score": g.get("whinfell_score", 0),
                    "delta": None,
                    "interpretation": "pending GlobalTransmission specialist",
                },
            }
        },
        "master_sizing": None,
    }


def validate(out: dict, nc: dict) -> list[str]:
    errors: list[str] = []
    if out.get("pipeline_seq") != PIPELINE_SEQ:
        errors.append(f"pipeline_seq mismatch: {out.get('pipeline_seq')!r}")
    ns = (out.get("snapshot") or {}).get("node_summaries") or {}
    for nid in NODE_IDS:
        if nid not in nc:
            continue
        entry = ns.get(nid) or {}
        for field in ("state", "gate", "lead_rv"):
            if not entry.get(field):
                errors.append(f"node_summaries.{nid}.{field} is empty")
    ai = ns.get("ai_compute") or {}
    for field in ("gpu_basis", "power_basis"):
        if not ai.get(field):
            errors.append(f"node_summaries.ai_compute.{field} is empty")
    cc = ns.get("cockpit_context") or {}
    if not cc.get("weakest_node_id"):
        errors.append("node_summaries.cockpit_context.weakest_node_id is empty")
    return errors


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Run TCM-Task-DataGatherer against hydration")
    parser.add_argument(
        "--input",
        default=str(root / "docs/data/hydration/latest.json"),
        help="Hydration bundle path",
    )
    parser.add_argument(
        "--output",
        default=str(root / "data/hydration/task_force.json"),
        help="task_force output path",
    )
    args = parser.parse_args()

    hydration = json.loads(Path(args.input).read_text())
    out = build(hydration)
    errors = validate(out, hydration.get("node_cockpits") or {})

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n")

    print("pipeline_seq:", json.dumps(out["pipeline_seq"]))
    print("node_summaries:")
    for key, val in out["snapshot"]["node_summaries"].items():
        print(f"  {key}: {json.dumps(val)}")
    print(f"written: {out_path}")

    if errors:
        print("FAIL")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("PASS — pipeline_seq correct, node_summaries populated")
    return 0


if __name__ == "__main__":
    sys.exit(main())