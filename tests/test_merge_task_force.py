#!/usr/bin/env python3
"""Unit tests for scripts/merge_task_force.py."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MERGE = ROOT / "scripts" / "merge_task_force.py"
LATEST = ROOT / "docs" / "data" / "hydration" / "latest.json"


class MergeTaskForceTests(unittest.TestCase):
    def test_dry_run_passes_on_shipped_bundle(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(MERGE), "--dry-run"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
        self.assertIn("DRY-RUN merge_task_force OK", proc.stdout)

    def test_merge_writes_task_force_and_wtm(self) -> None:
        hydration = json.loads(LATEST.read_text())
        task_force = hydration["task_force"]
        with tempfile.TemporaryDirectory() as tmp:
            hydration_path = Path(tmp) / "hydration.json"
            task_force_path = Path(tmp) / "task_force.json"
            out_path = Path(tmp) / "merged.json"
            hydration_clean = {k: v for k, v in hydration.items() if k not in ("task_force", "wtm_export_v21")}
            hydration_path.write_text(json.dumps(hydration_clean))
            task_force_path.write_text(json.dumps(task_force))

            proc = subprocess.run(
                [
                    sys.executable,
                    str(MERGE),
                    "--hydration",
                    str(hydration_path),
                    "--task-force",
                    str(task_force_path),
                    "--output",
                    str(out_path),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            merged = json.loads(out_path.read_text())
            self.assertEqual(merged["task_force"]["task_force_version"], "1.1.0")
            self.assertIn("wtm_export_v21", merged)
            self.assertIn("Source Channel: task_force", merged["wtm_export_v21"])

    def test_rejects_incomplete_without_wtm_when_complete(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            hydration_path = Path(tmp) / "hydration.json"
            task_force_path = Path(tmp) / "task_force.json"
            hydration_path.write_text("{}")
            task_force_path.write_text(
                json.dumps(
                    {
                        "task_force_version": "1.1.0",
                        "pipeline_seq": json.loads(LATEST.read_text())["task_force"]["pipeline_seq"],
                        "validation_status": "complete",
                        "master_sizing": {"verdict": "WATCH"},
                    }
                )
            )
            proc = subprocess.run(
                [
                    sys.executable,
                    str(MERGE),
                    "--hydration",
                    str(hydration_path),
                    "--task-force",
                    str(task_force_path),
                    "--dry-run",
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 1)
            self.assertIn("wtm_export_v21 missing", proc.stdout)


if __name__ == "__main__":
    unittest.main()