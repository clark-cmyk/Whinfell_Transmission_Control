#!/usr/bin/env python3
"""CLI — rebuild barchart_curve_history.json from latest Barchart futures watchlist.

Permanent Chunk 22 entrypoint. Implementation lives in
whinfell_pipeline.barchart_curve_refresh (importable by agent / auto_download).

Usage:
  python3 scripts/refresh_barchart_curve_from_watchlist.py
  python3 scripts/refresh_barchart_curve_from_watchlist.py --csv ~/Downloads/whinfell_drop/futures_intraday_….csv
  python3 scripts/refresh_barchart_curve_from_watchlist.py --json
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from whinfell_pipeline.barchart_curve_refresh import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
