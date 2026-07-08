#!/usr/bin/env python3
"""Guardrails — locked TC collection_manifest.yaml is source of truth for desk Collect."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

from whinfell_pipeline.auto_download.manifest import (  # noqa: E402
    ManifestLoadError,
    load_core_exports,
    locked_manifest_path,
    resolve_manifest_root,
    resolve_pipeline_root,
    resolve_tc_root,
)
from whinfell_pipeline.auto_download.pipeline_bridge import PipelineBridge  # noqa: E402
from whinfell_pipeline.auto_download.targets import CORE_EXPORT_IDS  # noqa: E402

ARCHIVE_MANIFEST = (
    Path.home()
    / "Desktop"
    / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE"
    / "whinfell_pipeline"
    / "collection_manifest.yaml"
)


def test_locked_manifest_parses() -> None:
    path = locked_manifest_path()
    assert path.is_file(), f"missing locked manifest: {path}"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert data.get("version"), "manifest version required"
    assert data.get("batch_exports"), "batch_exports required"
    assert data.get("required_batch_ids"), "required_batch_ids required"


def test_manifest_root_is_tc_repo_not_archive() -> None:
    tc = resolve_tc_root()
    root = resolve_manifest_root()
    assert root == tc.resolve()
    assert "OLD_2238_ARCHIVE" not in str(root)
    assert str(root).endswith("Whinfell_Transmission_Control")


def test_load_core_exports_ignores_broken_archive_manifest() -> None:
    targets, manifest_root = load_core_exports()
    assert manifest_root is not None
    assert manifest_root == resolve_tc_root().resolve()
    assert len(targets) == len(CORE_EXPORT_IDS)
    if ARCHIVE_MANIFEST.is_file():
        try:
            yaml.safe_load(ARCHIVE_MANIFEST.read_text(encoding="utf-8"))
            archive_broken = False
        except yaml.YAMLError:
            archive_broken = True
        if archive_broken:
            assert "OLD_2238_ARCHIVE" not in str(locked_manifest_path())


def test_archived_manifest_error_is_actionable() -> None:
    if not ARCHIVE_MANIFEST.is_file():
        return
    try:
        yaml.safe_load(ARCHIVE_MANIFEST.read_text(encoding="utf-8"))
        return
    except yaml.YAMLError as exc:
        err = ManifestLoadError(ARCHIVE_MANIFEST, exc)
        msg = str(err)
        assert "Archived Cousins manifest is invalid" in msg
        assert "Locked manifest" in msg


def test_pipeline_bridge_passes_locked_manifest_flag() -> None:
    bridge = PipelineBridge()
    if not bridge.available():
        return
    args = bridge._manifest_args()
    assert args[:2] == ["--manifest", str(locked_manifest_path())]
    assert Path(args[1]).is_file()


def test_whinfell_manifest_root_override() -> None:
    tc = resolve_tc_root()
    prev = os.environ.get("WHINFELL_MANIFEST_ROOT")
    os.environ["WHINFELL_MANIFEST_ROOT"] = str(tc)
    try:
        assert resolve_manifest_root() == tc.resolve()
    finally:
        if prev is None:
            os.environ.pop("WHINFELL_MANIFEST_ROOT", None)
        else:
            os.environ["WHINFELL_MANIFEST_ROOT"] = prev


def test_pipeline_execution_root_still_resolves_cousins() -> None:
    root = resolve_pipeline_root()
    if root is None:
        return
    assert (root / "run_batch_collect.py").is_file()


def main() -> int:
    tests = [
        test_locked_manifest_parses,
        test_manifest_root_is_tc_repo_not_archive,
        test_load_core_exports_ignores_broken_archive_manifest,
        test_archived_manifest_error_is_actionable,
        test_pipeline_bridge_passes_locked_manifest_flag,
        test_whinfell_manifest_root_override,
        test_pipeline_execution_root_still_resolves_cousins,
    ]
    for fn in tests:
        fn()
        print(f"PASS {fn.__name__}")
    print("PASS test_collection_manifest.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())