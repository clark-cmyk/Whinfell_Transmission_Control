#!/usr/bin/env python3
"""Merge task_force.json (and wtm_export_v21) into a hydration bundle."""
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


def validate_task_force(tf: dict) -> list[str]:
    errors: list[str] = []
    if tf.get("task_force_version") != "1.1.0":
        errors.append(f"task_force_version must be 1.1.0, got {tf.get('task_force_version')!r}")
    if tf.get("pipeline_seq") != PIPELINE_SEQ:
        errors.append("pipeline_seq mismatch")
    status = tf.get("validation_status")
    if status not in ("partial", "complete", "stub"):
        errors.append(f"validation_status invalid: {status!r}")
    if status == "complete" and not tf.get("wtm_export_v21"):
        errors.append("validation_status=complete but wtm_export_v21 missing")
    if status == "complete" and not tf.get("master_sizing"):
        errors.append("validation_status=complete but master_sizing missing")
    return errors


def merge(hydration: dict, task_force: dict) -> dict:
    out = dict(hydration)
    out["task_force"] = task_force
    wtm = task_force.get("wtm_export_v21")
    if wtm:
        out["wtm_export_v21"] = wtm
    return out


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Merge task_force into hydration latest.json")
    parser.add_argument(
        "--hydration",
        default=str(root / "docs/data/hydration/latest.json"),
        help="Hydration bundle path",
    )
    parser.add_argument(
        "--task-force",
        default=str(root / "data/hydration/task_force.json"),
        help="task_force JSON path",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Output path (default: overwrite --hydration)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate only; do not write",
    )
    args = parser.parse_args()

    hydration_path = Path(args.hydration)
    task_force_path = Path(args.task_force)
    output_path = Path(args.output) if args.output else hydration_path

    hydration = json.loads(hydration_path.read_text())
    task_force = json.loads(task_force_path.read_text())
    errors = validate_task_force(task_force)

    if errors:
        print("FAIL merge_task_force")
        for e in errors:
            print(f"  - {e}")
        return 1

    merged = merge(hydration, task_force)
    has_wtm = bool(task_force.get("wtm_export_v21"))
    verdict = (task_force.get("master_sizing") or {}).get("verdict", "—")

    if args.dry_run:
        print("DRY-RUN merge_task_force OK")
        print(f"  hydration: {hydration_path}")
        print(f"  task_force: {task_force_path}")
        print(f"  validation_status: {task_force.get('validation_status')}")
        print(f"  wtm_export_v21: {'yes' if has_wtm else 'no'}")
        print(f"  verdict: {verdict}")
        return 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(merged, indent=2) + "\n")
    print(f"merged task_force into {output_path}")
    print(f"  validation_status={task_force.get('validation_status')}")
    print(f"  wtm_export_v21={'yes' if has_wtm else 'no'}")
    print(f"  verdict={verdict}")
    return 0


if __name__ == "__main__":
    sys.exit(main())