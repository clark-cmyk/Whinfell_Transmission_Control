#!/usr/bin/env python3
"""Unit tests for scripts/complete_task_force_stubs.py."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "complete_task_force_stubs.py"
GATHERER = ROOT / "scripts" / "run_data_gatherer.py"
LATEST = ROOT / "docs" / "data" / "hydration" / "latest.json"


def load_mod():
    spec = importlib.util.spec_from_file_location("complete_task_force_stubs", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


class CompleteTaskForceStubsTests(unittest.TestCase):
    def test_complete_from_gatherer_partial(self) -> None:
        mod = load_mod()
        with tempfile.TemporaryDirectory() as tmp:
            partial_path = Path(tmp) / "partial.json"
            proc = subprocess.run(
                [
                    sys.executable,
                    str(GATHERER),
                    "--input",
                    str(LATEST),
                    "--output",
                    str(partial_path),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            partial = json.loads(partial_path.read_text())
            self.assertEqual(partial.get("validation_status"), "partial")

            completed = mod.complete_stubs(partial)
            self.assertEqual(completed["validation_status"], "complete")
            self.assertEqual(completed["snapshot_id"], partial["snapshot_id"])
            self.assertEqual(completed["as_of"], partial["as_of"])
            self.assertIn("wtm_export_v21", completed)
            self.assertIn("Source Channel: task_force", completed["wtm_export_v21"])
            ms = completed["master_sizing"]
            self.assertIn(ms["verdict"], ("EXECUTE", "WATCH", "BLOCKED"))
            self.assertIsInstance(ms["gross_pct"], int)
            specs = completed["specialists"]
            for sid in (
                "btc_eth_basis",
                "compute_gpu",
                "btc_eth_vol_arb",
                "tx_integrator",
                "global_transmission",
            ):
                self.assertIn(sid, specs)
            self.assertEqual(specs["tx_integrator"]["status"], "ok")
            score = str(ms["full_whinfell_score"])
            self.assertIn(f"Whinfell Score: {score}", completed["wtm_export_v21"])

    def test_cli_writes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            partial_path = Path(tmp) / "partial.json"
            out_path = Path(tmp) / "complete.json"
            g = subprocess.run(
                [
                    sys.executable,
                    str(GATHERER),
                    "--input",
                    str(LATEST),
                    "--output",
                    str(partial_path),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(g.returncode, 0, g.stderr or g.stdout)
            proc = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--input",
                    str(partial_path),
                    "--output",
                    str(out_path),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)
            self.assertTrue(out_path.is_file())
            data = json.loads(out_path.read_text())
            self.assertEqual(data["validation_status"], "complete")


if __name__ == "__main__":
    unittest.main()
