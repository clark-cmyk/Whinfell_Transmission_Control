#!/usr/bin/env python3
"""Enrich hydration bundle with all 8 BBDM RV series + lineage stamps (BBDM v2 Chunk 15)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from whinfell_pipeline.enrich_hydration import (  # noqa: E402
    BBDM_V2_PRIMARY_SERIES,
    ENRICH_VERSION,
    enrich_bundle,
    primary_series_status,
)
from whinfell_pipeline.rv_history import RV_HISTORY_VERSION  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Enrich latest.json with all 8 BBDM RV series + lineage")
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=ROOT / "docs" / "data" / "hydration" / "latest.json",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Default: overwrite --input; also writes rv_history.json sidecar",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.input.is_file():
        print(f"ERROR: not found: {args.input}", file=sys.stderr)
        return 1

    bundle = json.loads(args.input.read_text(encoding="utf-8"))
    enriched = enrich_bundle(bundle, ROOT)
    rv = enriched.get("rv_history") or {}
    stamp = enriched.get("bbdm_rv_enrich") or {}
    series = rv.get("series") or {}
    status = primary_series_status(rv)

    live_ids = [sid for sid in BBDM_V2_PRIMARY_SERIES if status.get(sid) == "live"]
    fallback_ids = [sid for sid in BBDM_V2_PRIMARY_SERIES if status.get(sid) == "fallback"]
    missing_ids = [sid for sid in BBDM_V2_PRIMARY_SERIES if status.get(sid) == "missing"]

    print(
        f"Enriched: enrich={ENRICH_VERSION} rv_history={RV_HISTORY_VERSION} "
        f"series={len(series)} primary=8 live={len(live_ids)} fallback={len(fallback_ids)} "
        f"missing={len(missing_ids)}"
    )
    print(
        "Primary: "
        + " · ".join(f"{sid}={status.get(sid, 'missing')}" for sid in BBDM_V2_PRIMARY_SERIES)
    )
    print(
        f"Lineage: input_hash={stamp.get('input_lineage_hash', '—')} "
        f"enrich_hash={stamp.get('enrich_lineage_hash', '—')} "
        f"cockpit_injects={len(stamp.get('cockpit_injects') or [])}"
    )

    if args.dry_run:
        print("(dry-run — no files written)")
        return 0

    out_path = args.output or args.input
    out_path.write_text(json.dumps(enriched, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")

    sidecar = out_path.parent / "rv_history.json"
    sidecar.write_text(json.dumps(rv, indent=2), encoding="utf-8")
    print(f"Wrote {sidecar}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())