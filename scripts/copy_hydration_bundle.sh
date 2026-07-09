#!/usr/bin/env bash
# Atomic publish of Cousins (or explicit) hydration bundle into TC docs/ + data/.
# Write → validate → stamp sources_manifest → os.replace. Prior good file kept on failure.
# Run after daily --chain with required exports ready (post Clark URL wiring).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export WHINFELL_TC_ROOT="$ROOT"

python3 - <<'PY'
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(os.environ["WHINFELL_TC_ROOT"]).resolve()
REQUIRED = ("as_of", "snapshot_id", "freshness_status")
HOME = Path.home()


def pipeline_roots() -> list[Path]:
    roots: list[Path] = []
    env = os.environ.get("WHINFELL_PIPELINE_ROOT", "").strip()
    if env:
        roots.append(Path(env).expanduser())
    roots.extend(
        [
            HOME / "Desktop" / "Whinfell_BUILD_Cousins",
            HOME / "Desktop" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE",
            HOME / "Desktop" / "Archive-20260703" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE",
        ]
    )
    # Prefer roots that look like Cousins (run_batch_collect.py) when resolving
    return roots


def parse_as_of(value: object) -> datetime:
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    s = str(value).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def load_json(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def resolve_src() -> Path:
    explicit = os.environ.get("WHINFELL_HYDRATION_SRC", "").strip()
    if explicit:
        p = Path(explicit).expanduser().resolve()
        if not p.is_file():
            print(f"ERROR: missing WHINFELL_HYDRATION_SRC={p}", file=sys.stderr)
            raise SystemExit(1)
        return p

    candidates: list[tuple[datetime, Path]] = []
    for root in pipeline_roots():
        if not root.is_dir():
            continue
        latest = root / "data" / "hydration" / "latest.json"
        if not latest.is_file():
            continue
        # Prefer roots that look like a Cousins pipeline when env not set
        data = load_json(latest)
        if not data:
            continue
        missing = [k for k in REQUIRED if not data.get(k)]
        if missing:
            continue
        candidates.append((parse_as_of(data.get("as_of")), latest.resolve()))

    if not candidates:
        print(
            "ERROR: no valid hydration latest.json found under pipeline candidates "
            "(set WHINFELL_PIPELINE_ROOT or WHINFELL_HYDRATION_SRC)",
            file=sys.stderr,
        )
        raise SystemExit(1)

    candidates.sort(key=lambda t: t[0], reverse=True)
    return candidates[0][1]


def derive_sources_manifest(bundle: dict) -> list:
    existing = bundle.get("sources_manifest")
    if isinstance(existing, list):
        return existing
    prov = bundle.get("ingest_provenance") or {}
    entries = prov.get("entries")
    if isinstance(entries, list) and entries:
        return entries
    source = bundle.get("source")
    if source:
        return [{"source": source, "role": "hydration_producer"}]
    return []


def prepare_bundle(src: Path) -> dict:
    data = load_json(src)
    if data is None:
        print(f"ERROR: invalid JSON: {src}", file=sys.stderr)
        raise SystemExit(1)
    missing = [k for k in REQUIRED if not data.get(k)]
    if missing:
        print(f"ERROR: missing required fields {missing} in {src}", file=sys.stderr)
        raise SystemExit(1)
    data["sources_manifest"] = derive_sources_manifest(data)
    return data


def atomic_write_json(dest: Path, payload: dict) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(f"{dest.name}.tmp.{os.getpid()}")
    try:
        tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, dest)
    except Exception:
        if tmp.is_file():
            try:
                tmp.unlink()
            except OSError:
                pass
        raise


def main() -> int:
    src = resolve_src()
    bundle = prepare_bundle(src)
    dests = [
        ROOT / "docs" / "data" / "hydration" / "latest.json",
        ROOT / "data" / "hydration" / "latest.json",
    ]
    for dest in dests:
        atomic_write_json(dest, bundle)
        print(
            "hydration_publish_ok "
            f"src={src} dest={dest} "
            f"snapshot_id={bundle.get('snapshot_id')} "
            f"as_of={bundle.get('as_of')} "
            f"freshness_status={bundle.get('freshness_status')} "
            f"sources_manifest={len(bundle.get('sources_manifest') or [])}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
PY
