#!/usr/bin/env python3
"""Chunk 01 — BBDM v2 master spec and development plan presence checks."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "01_Strategy_Docs" / "BBDM_v2_Master_Spec.md"
PLAN = ROOT / "01_Strategy_Docs" / "BBDM_v2_Development_Plan.md"

REQUIRED_SECTIONS = [
    "Introduction and Philosophy",
    "Core Framework",
    "Risk Dashboard",
    "Origin Story Trades",
    "Litmus Module",
    "System Architecture",
    "Data Sources",
    "Testing, Inspection",
    "Appendix A",
]

REQUIRED_DELTA = [
    "5 sleeves",
    "8 trades",
    "BANG",
    "sizing buckets",
    "global_only_score",
]


def test_master_spec_exists_and_sections():
    assert MASTER.is_file(), f"missing {MASTER}"
    text = MASTER.read_text(encoding="utf-8")
    for section in REQUIRED_SECTIONS:
        assert section in text, f"master spec missing section: {section}"


def test_development_plan_exists_and_chunk_count():
    assert PLAN.is_file(), f"missing {PLAN}"
    text = PLAN.read_text(encoding="utf-8")
    assert "55 micro-chunks" in text
    assert "Chunk 01" in text and "Done" in text


def test_delta_appendix_mappings():
    text = MASTER.read_text(encoding="utf-8")
    for token in REQUIRED_DELTA:
        assert token in text, f"delta appendix missing: {token}"