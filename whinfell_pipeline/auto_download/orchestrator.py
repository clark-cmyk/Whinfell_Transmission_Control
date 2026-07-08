"""Export orchestration — plan, status, open tabs, Playwright fetch."""

from __future__ import annotations

import json
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from whinfell_pipeline.auto_download.adapters.barchart import BarchartAdapter
from whinfell_pipeline.auto_download.adapters.koyfin import KoyfinAdapter
from whinfell_pipeline.auto_download.manifest import (
    ExportTarget,
    load_core_exports,
    locked_manifest_path,
    resolve_pipeline_root,
)
from whinfell_pipeline.auto_download.session import SessionManager
from whinfell_pipeline.auto_download.targets import REQUIRED_FOR_CHAIN
from whinfell_pipeline.auto_download.validators import find_matching_files, validate_export_csv

DEFAULT_DROP = Path.home() / "Downloads" / "whinfell_drop"


@dataclass
class ExportStatus:
    target: ExportTarget
    matched_files: list[str] = field(default_factory=list)
    ready: bool = False
    validation: str = "missing"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.target.id,
            "saved_view": self.target.saved_view,
            "source": self.target.source,
            "url": self.target.url,
            "ready": self.ready,
            "matched_files": self.matched_files,
            "validation": self.validation,
            "replace_me": self.target.replace_me,
        }


class ExportOrchestrator:
    def __init__(
        self,
        *,
        pipeline_root: Path | None = None,
        drop_dir: Path | None = None,
    ) -> None:
        self.drop_dir = (drop_dir or DEFAULT_DROP).expanduser()
        self.pipeline_root = resolve_pipeline_root(pipeline_root)
        self.manifest_path = locked_manifest_path()
        self.targets, self.manifest_root = load_core_exports()
        self.session = SessionManager()
        self._adapters = {
            "barchart": BarchartAdapter(self.session),
            "koyfin": KoyfinAdapter(self.session),
            "crypto": KoyfinAdapter(self.session),
        }

    def ensure_drop(self) -> Path:
        self.drop_dir.mkdir(parents=True, exist_ok=True)
        return self.drop_dir

    def plan(self) -> list[dict[str, Any]]:
        return [t.to_dict() for t in self.targets]

    def status(self) -> dict[str, Any]:
        self.ensure_drop()
        exports: list[ExportStatus] = []
        for target in self.targets:
            matches = find_matching_files(self.drop_dir, target.raw_patterns)
            matched_names = [p.name for p in matches]
            ready = False
            validation = "missing"
            if matches:
                ok_paths = [
                    p for p in matches if validate_export_csv(p, source=target.source)[0]
                ]
                if ok_paths:
                    ready = True
                    validation = "ok"
                    matched_names = [p.name for p in ok_paths]
                else:
                    validation = validate_export_csv(matches[0], source=target.source)[1]
            exports.append(
                ExportStatus(
                    target=target,
                    matched_files=matched_names,
                    ready=ready,
                    validation=validation,
                )
            )

        required_ready = all(
            s.ready for s in exports if s.target.id in REQUIRED_FOR_CHAIN
        )
        missing_required = [
            s.target.id for s in exports
            if s.target.id in REQUIRED_FOR_CHAIN and not s.ready
        ]

        return {
            "version": "0.1.0",
            "as_of": datetime.now(timezone.utc).isoformat(),
            "drop_dir": str(self.drop_dir),
            "manifest_root": str(self.manifest_root) if self.manifest_root else None,
            "manifest_path": str(self.manifest_path) if self.manifest_path else None,
            "pipeline_root": str(self.pipeline_root) if self.pipeline_root else None,
            "export_count": len(exports),
            "ready_count": sum(1 for s in exports if s.ready),
            "required_ready": required_ready,
            "missing_required": missing_required,
            "exports": [s.to_dict() for s in exports],
        }

    def open_urls(self, *, export_id: str | None = None, delay_sec: float = 1.5) -> list[str]:
        """Open export URLs in system browser — manual-download fallback."""
        opened: list[str] = []
        targets = self.targets
        if export_id:
            targets = [t for t in self.targets if t.id == export_id]
            if not targets:
                raise ValueError(f"unknown export id: {export_id}")

        for target in targets:
            if not target.url:
                continue
            subprocess.run(["open", target.url], check=False)
            opened.append(target.url)
            time.sleep(delay_sec)
        return opened

    def login(self) -> None:
        self.session.login_interactive()

    def fetch_one(self, export_id: str) -> Path:
        target = next((t for t in self.targets if t.id == export_id), None)
        if not target:
            raise ValueError(f"unknown export id: {export_id}")
        adapter = self._adapters.get(target.source)
        if not adapter:
            raise ValueError(f"no adapter for source={target.source}")
        return adapter.fetch(target, self.ensure_drop())

    def write_status_manifest(self, out_dir: Path | None = None) -> Path:
        root = out_dir or (self.pipeline_root / "staged_raw" / "manifests" if self.pipeline_root else Path("data/manifests"))
        root.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        path = root / f"auto_download_{stamp}.json"
        payload = self.status()
        payload["mode"] = "scaffold_v1"
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return path