"""Base adapter contract for v1 auto-download."""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from whinfell_pipeline.auto_download.manifest import ExportTarget


class BaseAdapter(ABC):
    source: str = ""

    @abstractmethod
    def fetch(self, target: ExportTarget, drop_dir: Path) -> Path:
        """Download one export into drop_dir. Implemented in Chunk 3+."""

    def describe(self, target: ExportTarget) -> str:
        return f"{target.id}: {target.saved_view} → {target.url}"