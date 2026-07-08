#!/usr/bin/env python3
"""Whinfell auto CSV download — plan · status · login · fetch · chain."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from whinfell_pipeline.auto_download.adapters.koyfin import validate_koyfin_target  # noqa: E402
from whinfell_pipeline.auto_download.drop_archive import archive_stale_drop_csvs  # noqa: E402
from whinfell_pipeline.auto_download.manifest import ManifestLoadError  # noqa: E402
from whinfell_pipeline.auto_download.orchestrator import ExportOrchestrator  # noqa: E402
from whinfell_pipeline.auto_download.pipeline_bridge import PipelineBridge  # noqa: E402
from whinfell_pipeline.auto_download.targets import MODULE_VERSION  # noqa: E402

_ARCHIVE_COMMANDS = frozenset({"plan", "status", "fetch", "daily"})


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Whinfell auto CSV download (Playwright session + Barchart + Koyfin)",
    )
    parser.add_argument(
        "--pipeline-root",
        default=None,
        help="Cousins pipeline repo (default: auto-detect WHINFELL_PIPELINE_ROOT / Desktop)",
    )
    parser.add_argument(
        "--drop",
        default=str(Path.home() / "Downloads" / "whinfell_drop"),
        help="CSV drop directory",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("plan", help="List core export targets (Barchart intraday + key Koyfin)")

    sub.add_parser(
        "login",
        help="Open Comet once; log into Barchart/Koyfin; session saved under ~/.whinfell/comet_profile",
    )

    p_status = sub.add_parser("status", help="Check drop dir for core exports")
    p_status.add_argument("--json", action="store_true", help="Emit JSON only")

    p_open = sub.add_parser("open", help="Open export URLs in system browser (v1 manual path)")
    p_open.add_argument("--id", help="Single export id (default: all core targets)")
    p_open.add_argument("--delay", type=float, default=1.5, help="Seconds between tabs")

    p_fetch = sub.add_parser(
        "fetch",
        help="Fetch one export (Barchart intraday; Koyfin Watchlist /myw/ or Chart /charts/)",
    )
    p_fetch.add_argument("--id", required=True, help="Export id e.g. barchart_futures_intraday")

    p_daily = sub.add_parser("daily", help="Status + optional pipeline chain when drop is ready")
    p_daily.add_argument("--chain", action="store_true", help="Run normalize + batch_collect run")
    p_daily.add_argument(
        "--chain-skip-required",
        action="store_true",
        help="Run chain even when required_batch exports are missing (collect/hydrate verify)",
    )
    p_daily.add_argument("--operator", default="desk")
    p_daily.add_argument("--window", default="today")
    p_daily.add_argument("--open", action="store_true", help="Open browser tabs before status")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    pipeline_root = Path(args.pipeline_root).expanduser() if args.pipeline_root else None
    drop = Path(args.drop).expanduser()
    try:
        orch = ExportOrchestrator(pipeline_root=pipeline_root, drop_dir=drop)
    except ManifestLoadError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if not orch.pipeline_root:
        print("ERROR: Cousins pipeline not found. Set WHINFELL_PIPELINE_ROOT.", file=sys.stderr)
        return 1

    if not orch.targets:
        print("ERROR: No core export targets loaded from collection_manifest.", file=sys.stderr)
        return 1

    if args.command in _ARCHIVE_COMMANDS:
        archive = archive_stale_drop_csvs(drop, repo_root=REPO_ROOT)
        if archive.moved:
            print(
                f"drop_archive moved={archive.moved} kept={archive.kept} "
                f"root={REPO_ROOT / 'data/archive/drop'}"
            )

    if args.command == "login":
        orch.login()
        print("login_ok profile=~/.whinfell/comet_profile browser=Comet")
        print("next: python3 run_auto_download.py fetch --id barchart_futures_intraday")
        return 0

    if args.command == "plan":
        print(f"auto_download_version={MODULE_VERSION}")
        print(f"manifest_path={orch.manifest_path}")
        print(f"manifest_root={orch.manifest_root}")
        print(f"pipeline_root={orch.pipeline_root}")
        print(f"drop_dir={orch.drop_dir}")
        print(f"core_exports={len(orch.targets)}")
        for item in orch.plan():
            flags: list[str] = []
            if item.get("replace_me"):
                flags.append("replace_me")
            if item.get("source") == "koyfin":
                ready, _ = validate_koyfin_target(
                    next(t for t in orch.targets if t.id == item["id"])
                )
                if not ready:
                    flags.append("needs_share_url")
            flag = f" [{' · '.join(flags)}]" if flags else ""
            print(
                f"  {item['priority']:>2}  {item['id']:<28}  {item['saved_view']}{flag}\n"
                f"      url={item['url']}"
            )
        return 0

    if args.command == "status":
        payload = orch.status()
        if args.json:
            print(json.dumps(payload, indent=2))
        else:
            print(f"drop_dir={payload['drop_dir']}")
            print(f"ready={payload['ready_count']}/{payload['export_count']}")
            print(f"required_ready={payload['required_ready']}")
            if payload["missing_required"]:
                print(f"missing_required={','.join(payload['missing_required'])}")
            for row in payload["exports"]:
                mark = "OK" if row["ready"] else row["validation"].upper()
                files = ", ".join(row["matched_files"]) or "-"
                print(f"  {row['id']:<28} {mark:<8} {files}")
        return 0 if payload["required_ready"] else 1

    if args.command == "open":
        try:
            opened = orch.open_urls(export_id=args.id, delay_sec=args.delay)
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1
        print(f"opened={len(opened)}")
        for url in opened:
            print(f"  {url}")
        print("v1: save CSVs to drop_dir, then run: python3 run_auto_download.py daily --chain")
        return 0

    if args.command == "fetch":
        try:
            path = orch.fetch_one(args.id)
        except (ValueError, NotImplementedError, RuntimeError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1
        print(f"fetch_ok path={path}")
        return 0

    if args.command == "daily":
        if args.open:
            orch.open_urls(delay_sec=args.delay if hasattr(args, "delay") else 1.5)
        payload = orch.status()
        manifest_path = orch.write_status_manifest()
        print(f"status_manifest={manifest_path}")
        print(f"ready={payload['ready_count']}/{payload['export_count']}")
        print(f"required_ready={payload['required_ready']}")

        if not args.chain:
            print("next: add CSVs to drop_dir, then re-run with --chain")
            return 0 if payload["required_ready"] else 1

        chain_required = not (
            args.chain_skip_required
            or os.environ.get("WHINFELL_CHAIN_REQUIRED", "1").strip().lower() in ("0", "false", "no")
        )
        bridge = PipelineBridge(orch.pipeline_root)
        result = bridge.chain(
            orch.drop_dir,
            operator=args.operator,
            window=args.window,
            required_ready=chain_required,
            missing_required=payload["missing_required"],
        )
        if result.skipped:
            print(f"chain_skipped reason={result.skip_reason}")
            return 1
        if result.quarantine_stdout.strip():
            sys.stdout.write(result.quarantine_stdout)
        if result.normalize_stdout.strip():
            sys.stdout.write(result.normalize_stdout)
        if result.run_stdout.strip():
            sys.stdout.write(result.run_stdout)
        print(f"normalize_exit={result.normalize_exit} run_exit={result.run_exit}")
        return 0 if result.ok else 1

    return 1


if __name__ == "__main__":
    raise SystemExit(main())