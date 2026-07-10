"""Bridge to in-repo normalize + run_batch_collect / run_csv_download (TC self-rooted)."""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from whinfell_pipeline.auto_download.manifest import locked_manifest_path, resolve_pipeline_root
from whinfell_pipeline.auto_download.staged_noise import quarantine_collect_noise


@dataclass
class ChainResult:
    normalize_exit: int = 0
    run_exit: int = 0
    normalize_stdout: str = ""
    run_stdout: str = ""
    quarantine_stdout: str = ""
    skipped: bool = False
    skip_reason: str = ""

    @property
    def ok(self) -> bool:
        return not self.skipped and self.normalize_exit == 0 and self.run_exit == 0


class PipelineBridge:
    def __init__(self, pipeline_root: Path | None = None) -> None:
        self.pipeline_root = resolve_pipeline_root(pipeline_root)

    def available(self) -> bool:
        return self.pipeline_root is not None and (self.pipeline_root / "run_batch_collect.py").is_file()

    def _manifest_args(self) -> list[str]:
        manifest = locked_manifest_path()
        if manifest.is_file():
            return ["--manifest", str(manifest)]
        return []

    def normalize(self, drop_dir: Path, *, dry_run: bool = False) -> tuple[int, str]:
        if not self.available():
            return 1, "pipeline_root not found — set WHINFELL_PIPELINE_ROOT"
        cmd = [
            sys.executable,
            str(self.pipeline_root / "run_batch_collect.py"),
            "normalize",
            *self._manifest_args(),
            "--drop",
            str(drop_dir),
        ]
        if dry_run:
            cmd.append("--dry-run")
        proc = subprocess.run(cmd, cwd=str(self.pipeline_root), capture_output=True, text=True)
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out

    def batch_status(self, drop_dir: Path) -> tuple[int, str]:
        if not self.available():
            return 1, "pipeline_root not found"
        cmd = [
            sys.executable,
            str(self.pipeline_root / "run_batch_collect.py"),
            "status",
            *self._manifest_args(),
            "--drop",
            str(drop_dir),
        ]
        proc = subprocess.run(cmd, cwd=str(self.pipeline_root), capture_output=True, text=True)
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out

    def run_pipeline(
        self,
        drop_dir: Path,
        *,
        operator: str = "desk",
        window: str = "today",
    ) -> tuple[int, str]:
        if not self.available():
            return 1, "pipeline_root not found"
        cmd = [
            sys.executable,
            str(self.pipeline_root / "run_batch_collect.py"),
            "run",
            *self._manifest_args(),
            "--drop",
            str(drop_dir),
            "--operator",
            operator,
            "--window",
            window,
        ]
        proc = subprocess.run(cmd, cwd=str(self.pipeline_root), capture_output=True, text=True)
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out

    def chain(
        self,
        drop_dir: Path,
        *,
        operator: str = "desk",
        window: str = "today",
        required_ready: bool = True,
        missing_required: list[str] | None = None,
    ) -> ChainResult:
        if not self.available():
            return ChainResult(skipped=True, skip_reason="pipeline_root not found")

        if required_ready and missing_required:
            return ChainResult(
                skipped=True,
                skip_reason=f"missing required exports: {', '.join(missing_required)}",
            )

        staged_root = self.pipeline_root / "staged_raw"
        q_result = quarantine_collect_noise(staged_root, pipeline_root=self.pipeline_root)
        q_out = "\n".join(q_result.summary_lines()) + "\n" if q_result.moved or q_result.actions else ""

        norm_code, norm_out = self.normalize(drop_dir)
        if norm_code != 0:
            return ChainResult(normalize_exit=norm_code, normalize_stdout=norm_out)

        # Koyfin Midwest GM → Litmus (corporate_gm.json). Not part of Parquet staged
        # datasets; map after normalize so vendor + canonical names both resolve.
        litmus_out = ""
        try:
            from whinfell_pipeline.koyfin_corporate_gm import ingest_corporate_gm

            litmus_doc = ingest_corporate_gm(drop_dir)
            litmus_out = (
                f"litmus_corporate_gm data_status={litmus_doc.get('data_status')} "
                f"as_of={litmus_doc.get('as_of')}\n"
            )
        except Exception as exc:  # noqa: BLE001 — never block rates/credit chain
            litmus_out = f"litmus_corporate_gm_warn={exc}\n"

        try:
            from whinfell_pipeline.coinglass_perp import ingest_crypto_market

            crypto_doc = ingest_crypto_market(drop_dir=drop_dir)
            litmus_out += (
                f"litmus_crypto_market data_status={crypto_doc.get('data_status')} "
                f"live_signals={crypto_doc.get('lineage', {}).get('live_signal_count')}\n"
            )
        except Exception as exc:  # noqa: BLE001 — never block chain
            litmus_out += f"litmus_crypto_market_warn={exc}\n"

        run_code, run_out = self.run_pipeline(drop_dir, operator=operator, window=window)
        return ChainResult(
            normalize_exit=norm_code,
            run_exit=run_code,
            normalize_stdout=norm_out + litmus_out,
            run_stdout=run_out,
            quarantine_stdout=q_out,
        )