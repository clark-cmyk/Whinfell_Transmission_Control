"""Source adapters — Chunk 3+ implements fetch; v1 scaffold only."""

from whinfell_pipeline.auto_download.adapters.barchart import BarchartAdapter
from whinfell_pipeline.auto_download.adapters.koyfin import KoyfinAdapter

__all__ = ["BarchartAdapter", "KoyfinAdapter"]