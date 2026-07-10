#!/usr/bin/env python3
"""Chunk 22 — barchart_curve_refresh converter tests."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from whinfell_pipeline.barchart_curve_refresh import (  # noqa: E402
    CurveRefreshError,
    find_latest_watchlist_csv,
    parse_watchlist_rows,
    refresh_barchart_curve,
)


SAMPLE_CSV = """Symbol,Name,Latest,Change,%Change,High,Low,Volume
BTN26,"Bitcoin Futures",63375,-10.,-0.02%,63600,63225,214
BTQ26,"Bitcoin Futures",63500,-140.,-0.22%,63720,63500,71
BTU26,"Bitcoin Futures",63880,950,+1.51%,63880,62520,46
"""


class BarchartCurveRefreshTests(unittest.TestCase):
    def test_parse_watchlist_btn26(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "futures_intraday_20260709_1845.csv"
            p.write_text(SAMPLE_CSV, encoding="utf-8")
            quotes = parse_watchlist_rows(p)
            self.assertIn("BTN26", quotes)
            self.assertEqual(quotes["BTN26"]["close"], 63375.0)
            self.assertEqual(quotes["BTN26"]["date"], "2026-07-09")

    def test_refresh_writes_curve(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            drop = Path(td) / "drop"
            drop.mkdir()
            out = Path(td) / "data" / "barchart" / "v1"
            out.mkdir(parents=True)
            csv_path = drop / "watchlist-wtm-canonical-universe-intraday-07-09-2026.csv"
            csv_path.write_text(SAMPLE_CSV, encoding="utf-8")
            dest = out / "barchart_curve_history.json"
            # seed stale
            dest.write_text(
                json.dumps(
                    {
                        "version": "1.0.0",
                        "bucket": "curve",
                        "as_of": "old",
                        "records": [
                            {
                                "raw_symbol": "BTN26",
                                "latest": {"close": 59995, "date": "2026-06-26"},
                                "points": [{"close": 59995, "date": "2026-06-26"}],
                                "contract_meta": {"contract_root": "BT"},
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            result = refresh_barchart_curve(
                csv_path=csv_path,
                drop=drop,
                base=dest,
                dests=[dest],
                repo_root=Path(td),
            )
            self.assertTrue(result["ok"])
            self.assertEqual(result["BTN26_close"], 63375.0)
            self.assertEqual(result["max_quote_date"], "2026-07-09")
            payload = json.loads(dest.read_text(encoding="utf-8"))
            btn = next(r for r in payload["records"] if r["raw_symbol"] == "BTN26")
            self.assertEqual(btn["latest"]["close"], 63375.0)
            self.assertEqual(btn["latest"]["date"], "2026-07-09")
            # history retained + new point
            dates = {p["date"] for p in btn["points"]}
            self.assertIn("2026-06-26", dates)
            self.assertIn("2026-07-09", dates)

    def test_prefers_btn26_bearing_csv(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            drop = Path(td)
            stale = drop / "futures_intraday_20260626_0000.csv"
            stale.write_text(
                'Symbol,Latest\nESU26,5000\n',
                encoding="utf-8",
            )
            live = drop / "futures_intraday_20260709_1845.csv"
            live.write_text(SAMPLE_CSV, encoding="utf-8")
            path, quotes = find_latest_watchlist_csv(None, drop)
            self.assertEqual(path.name, live.name)
            self.assertEqual(quotes["BTN26"]["close"], 63375.0)

    def test_prefers_newer_mtime_not_higher_price(self) -> None:
        """Chunk 23: older high print must not beat a newer ~63k quote."""
        import os
        import time

        with tempfile.TemporaryDirectory() as td:
            drop = Path(td)
            old_high = drop / "watchlist-wtm-futures-daily-intraday-07-08-2026.csv"
            old_high.write_text(
                'Symbol,Name,Latest,Change,%Change,High,Low,Volume\n'
                'BTN26,"Bitcoin Futures",68000,100,+0.1%,68100,67900,10\n',
                encoding="utf-8",
            )
            new_live = drop / "futures_intraday_20260709_1845.csv"
            new_live.write_text(SAMPLE_CSV, encoding="utf-8")
            # Force mtimes: older high price first, then newer lower (live) price.
            now = time.time()
            os.utime(old_high, (now - 3600, now - 3600))
            os.utime(new_live, (now, now))
            path, quotes = find_latest_watchlist_csv(None, drop)
            self.assertEqual(path.name, new_live.name)
            self.assertEqual(quotes["BTN26"]["close"], 63375.0)

    def test_missing_csv_raises(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(CurveRefreshError):
                find_latest_watchlist_csv(None, Path(td))


if __name__ == "__main__":
    unittest.main()
