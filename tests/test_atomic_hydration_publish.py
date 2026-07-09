#!/usr/bin/env python3
"""Atomic hydration publish — tmp+validate+replace; prior kept on bad SRC; dual dest; sources_manifest."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COPY_SCRIPT = ROOT / "scripts" / "copy_hydration_bundle.sh"
ENRICH_SCRIPT = ROOT / "scripts" / "enrich_hydration_rv.py"


def _minimal_bundle(**overrides):
    base = {
        "as_of": "2026-07-09T12:00:00+00:00",
        "snapshot_id": "test-snap-atomic-01",
        "freshness_status": "fresh",
        "source": "unit_test",
        "hydration_version": "1.3.0",
        "validation_status": "ok",
        "ingest_provenance": {
            "entries": [
                {"path": "staged/foo.csv", "export_id": "koyfin_rates"},
                {"path": "staged/bar.csv", "export_id": "barchart_futures_intraday"},
            ]
        },
        "global": {},
    }
    base.update(overrides)
    return base


def _run_copy(env_extra: dict, cwd: Path | None = None) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env.update(env_extra)
    return subprocess.run(
        ["bash", str(COPY_SCRIPT)],
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )


def test_copy_script_exists_and_is_executable_pattern():
    assert COPY_SCRIPT.is_file()
    text = COPY_SCRIPT.read_text(encoding="utf-8")
    assert "hydration_publish_ok" in text or "os.replace" in text or "atomic" in text.lower()
    assert "sources_manifest" in text


def test_atomic_publish_dual_dest_and_sources_manifest(tmp_path: Path):
    """Publish into a temp TC-like tree via WHINFELL_TC_ROOT + WHINFELL_HYDRATION_SRC."""
    # Build fake TC root layout expected by copy script
    tc = tmp_path / "tc"
    (tc / "scripts").mkdir(parents=True)
    # Point WHINFELL_TC_ROOT by running python logic via env — script uses ROOT from dirname.
    # Instead: write SRC, invoke real script against real ROOT but with isolated SRC and
    # verify via a unit of the python block by importing pattern through subprocess +
    # WHINFELL_HYDRATION_SRC only — dual dest is real docs/ + data/.
    # Use isolated src + real dest with snapshot unique id, restore after.
    src = tmp_path / "src_latest.json"
    snap = "test-atomic-dual-dest-01"
    src.write_text(json.dumps(_minimal_bundle(snapshot_id=snap)), encoding="utf-8")

    docs = ROOT / "docs" / "data" / "hydration" / "latest.json"
    data = ROOT / "data" / "hydration" / "latest.json"
    prior_docs = docs.read_text(encoding="utf-8") if docs.is_file() else None
    prior_data = data.read_text(encoding="utf-8") if data.is_file() else None

    try:
        proc = _run_copy({"WHINFELL_HYDRATION_SRC": str(src)})
        assert proc.returncode == 0, proc.stderr + proc.stdout
        assert "hydration_publish_ok" in proc.stdout
        assert snap in proc.stdout

        d_docs = json.loads(docs.read_text(encoding="utf-8"))
        d_data = json.loads(data.read_text(encoding="utf-8"))
        assert d_docs["snapshot_id"] == snap
        assert d_data["snapshot_id"] == snap
        assert d_docs["as_of"] == d_data["as_of"]
        assert isinstance(d_docs.get("sources_manifest"), list)
        assert len(d_docs["sources_manifest"]) >= 1
        assert d_docs["sources_manifest"] == d_data["sources_manifest"]
    finally:
        if prior_docs is not None:
            docs.write_text(prior_docs, encoding="utf-8")
        if prior_data is not None:
            data.write_text(prior_data, encoding="utf-8")


def test_bad_src_leaves_prior_intact(tmp_path: Path):
    docs = ROOT / "docs" / "data" / "hydration" / "latest.json"
    data = ROOT / "data" / "hydration" / "latest.json"
    assert docs.is_file(), "fixture docs hydration required"
    prior_docs = docs.read_text(encoding="utf-8")
    prior_data = data.read_text(encoding="utf-8") if data.is_file() else None
    prior_snap = json.loads(prior_docs).get("snapshot_id")

    bad = tmp_path / "bad.json"
    bad.write_text("{not-json", encoding="utf-8")

    try:
        proc = _run_copy({"WHINFELL_HYDRATION_SRC": str(bad)})
        assert proc.returncode != 0
        after = json.loads(docs.read_text(encoding="utf-8"))
        assert after.get("snapshot_id") == prior_snap
        if prior_data is not None:
            assert data.read_text(encoding="utf-8") == prior_data
    finally:
        docs.write_text(prior_docs, encoding="utf-8")
        if prior_data is not None:
            data.write_text(prior_data, encoding="utf-8")


def test_missing_required_field_rejected(tmp_path: Path):
    docs = ROOT / "docs" / "data" / "hydration" / "latest.json"
    prior_docs = docs.read_text(encoding="utf-8") if docs.is_file() else None
    prior_snap = json.loads(prior_docs).get("snapshot_id") if prior_docs else None

    src = tmp_path / "incomplete.json"
    incomplete = _minimal_bundle()
    del incomplete["snapshot_id"]
    src.write_text(json.dumps(incomplete), encoding="utf-8")

    try:
        proc = _run_copy({"WHINFELL_HYDRATION_SRC": str(src)})
        assert proc.returncode != 0
        if prior_docs is not None:
            after = json.loads(docs.read_text(encoding="utf-8"))
            assert after.get("snapshot_id") == prior_snap
    finally:
        if prior_docs is not None:
            docs.write_text(prior_docs, encoding="utf-8")


def test_enrich_uses_atomic_write():
    text = ENRICH_SCRIPT.read_text(encoding="utf-8")
    assert "os.replace" in text
    assert "atomic_write_json" in text


def test_sync_mirrors_atomically():
    sync = ROOT / "scripts" / "sync_live_desk_data.sh"
    text = sync.read_text(encoding="utf-8")
    assert "atomic_mirror_json" in text
    assert "copy_hydration_bundle.sh" in text
    assert "enrich_hydration_rv.py" in text


if __name__ == "__main__":
    # Lightweight runner without pytest fixtures
    import tempfile as _tf

    test_copy_script_exists_and_is_executable_pattern()
    test_enrich_uses_atomic_write()
    test_sync_mirrors_atomically()
    with _tf.TemporaryDirectory() as td:
        test_atomic_publish_dual_dest_and_sources_manifest(Path(td))
    with _tf.TemporaryDirectory() as td:
        test_bad_src_leaves_prior_intact(Path(td))
    with _tf.TemporaryDirectory() as td:
        test_missing_required_field_rejected(Path(td))
    print("test_atomic_hydration_publish OK")
