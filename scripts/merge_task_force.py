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


def atomic_write_json(path: Path, payload: dict) -> None:
    """Temp + os.replace so readers never see a partial latest.json."""
    import os

    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.tmp.{os.getpid()}")
    try:
        tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, path)
    except Exception:
        if tmp.is_file():
            try:
                tmp.unlink()
            except OSError:
                pass
        raise


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

    hydration = json.loads(hydration_path.read_text(encoding="utf-8"))
    task_force = json.loads(task_force_path.read_text(encoding="utf-8"))
    errors = validate_task_force(task_force)

    if errors:
        print("FAIL merge_task_force")
        for e in errors:
            print(f"  - {e}")
        return 1

    # Guard: never promote TF stamped for a different hydration snapshot.
    tf_snap = task_force.get("snapshot_id") or (
        (task_force.get("snapshot") or {}).get("hydration_ref") or {}
    ).get("snapshot_id")
    hy_snap = hydration.get("snapshot_id")
    if tf_snap and hy_snap and str(tf_snap) != str(hy_snap):
        print("FAIL merge_task_force")
        print(f"  - snapshot_id mismatch task_force={tf_snap!r} hydration={hy_snap!r}")
        print("  - re-run --gatherer on current latest.json before --merge")
        return 1

    merged = merge(hydration, task_force)
    has_wtm = bool(task_force.get("wtm_export_v21"))
    verdict = (task_force.get("master_sizing") or {}).get("verdict", "—")

    if args.dry_run:
        print("DRY-RUN merge_task_force OK")
        print(f"  hydration: {hydration_path}")
        print(f"  task_force: {task_force_path}")
        print(f"  snapshot_id: {hy_snap}")
        print(f"  validation_status: {task_force.get('validation_status')}")
        print(f"  wtm_export_v21: {'yes' if has_wtm else 'no'}")
        print(f"  verdict: {verdict}")
        return 0

    atomic_write_json(output_path, merged)
    print(f"merged task_force into {output_path}")
    print(f"  snapshot_id={hy_snap}")
    print(f"  validation_status={task_force.get('validation_status')}")
    print(f"  wtm_export_v21={'yes' if has_wtm else 'no'}")
    print(f"  verdict={verdict}")
    return 0


if __name__ == "__main__":
    sys.exit(main())