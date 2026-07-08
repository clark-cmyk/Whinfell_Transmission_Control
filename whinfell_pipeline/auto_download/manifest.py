"""Load core export targets from locked TC collection_manifest + desk_urls."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

from whinfell_pipeline.auto_download.targets import CORE_EXPORT_IDS
from whinfell_pipeline.auto_download.validators import build_export_raw_patterns

ENV_VAR_RE = re.compile(r"\$\{([A-Z0-9_]+)\}")

_BATCH_DESK_KEYS: dict[str, tuple[str, str]] = {
    "barchart_futures_intraday": ("barchart", "WTM-Futures-Intraday"),
    "koyfin_rates": ("koyfin", "WTM-Rates-Credit"),
    "koyfin_import_core": ("koyfin", "WTM-Import-Core"),
    "koyfin_flows_global": ("koyfin", "WTM-Flows-Global"),
    "koyfin_china": ("koyfin", "WTM-China-Policy"),
    "koyfin_equities": ("koyfin", "WTM-Equities-Breadth"),
    "koyfin_midwest_corporate_gm": ("koyfin", "WTM-Midwest-Corporate-GM"),
}

_ARCHIVE_MARKERS = ("OLD_2238_ARCHIVE", "/Archive-")


class ManifestLoadError(RuntimeError):
    """Raised when collection_manifest.yaml cannot be parsed."""

    def __init__(self, path: Path, cause: Exception) -> None:
        self.path = path
        self.cause = cause
        archived = any(marker in str(path) for marker in _ARCHIVE_MARKERS)
        locked = locked_manifest_path()
        if archived:
            hint = (
                "Archived Cousins manifest is invalid and is not used for desk Collect. "
                f"Locked manifest: {locked}. "
                "Repair the archive copy or ignore it — set WHINFELL_MANIFEST_ROOT to the TC repo if needed."
            )
        else:
            hint = (
                f"Locked manifest invalid at {path}. "
                "Repair YAML syntax or set WHINFELL_MANIFEST_ROOT."
            )
        super().__init__(f"{hint}\nYAML error: {cause}")


@dataclass(frozen=True)
class ManifestPaths:
    manifest_root: Path
    manifest_path: Path
    desk_urls_path: Path | None


@dataclass
class ExportTarget:
    id: str
    source: str
    saved_view: str
    url: str
    priority: int
    canonical_name: str
    raw_patterns: list[str] = field(default_factory=list)
    export_menu: str = ""
    navigate: str = ""
    optional: bool = False
    replace_me: bool = False
    steps: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "source": self.source,
            "saved_view": self.saved_view,
            "url": self.url,
            "priority": self.priority,
            "canonical_name": self.canonical_name,
            "raw_patterns": self.raw_patterns,
            "export_menu": self.export_menu,
            "navigate": self.navigate,
            "optional": self.optional,
            "replace_me": self.replace_me,
            "steps": self.steps,
        }


def resolve_tc_root() -> Path:
    """Whinfell_Transmission_Control repo containing this package."""
    return Path(__file__).resolve().parents[2]


def default_pipeline_candidates() -> list[Path]:
    """Execution roots that host run_batch_collect.py (Cousins archive)."""
    env = os.environ.get("WHINFELL_PIPELINE_ROOT", "").strip()
    home = Path.home()
    return [
        Path(env) if env else Path(),
        home / "Desktop" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE",
        home / "Desktop" / "Whinfell_BUILD_Cousins",
        home / "Desktop" / "Archive-20260703" / "Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE",
    ]


def resolve_pipeline_root(explicit: Path | None = None) -> Path | None:
    """Cousins repo used only for normalize/collect/hydrate chain execution."""
    if explicit and (explicit / "run_batch_collect.py").is_file():
        return explicit.resolve()
    for candidate in default_pipeline_candidates():
        if not candidate or not candidate.is_dir():
            continue
        if (candidate / "run_batch_collect.py").is_file():
            return candidate.resolve()
    return None


def resolve_manifest_root(explicit: Path | None = None) -> Path:
    """Authoritative manifest root — TC repo first, never a broken archive copy."""
    if explicit:
        p = explicit.expanduser().resolve()
        if (p / "whinfell_pipeline" / "collection_manifest.yaml").is_file():
            return p
        if p.name == "collection_manifest.yaml" and p.is_file():
            return p.parent.parent.resolve()

    env = os.environ.get("WHINFELL_MANIFEST_ROOT", "").strip()
    if env:
        p = Path(env).expanduser().resolve()
        if (p / "whinfell_pipeline" / "collection_manifest.yaml").is_file():
            return p

    tc = resolve_tc_root()
    if (tc / "whinfell_pipeline" / "collection_manifest.yaml").is_file():
        return tc

    pipeline = resolve_pipeline_root()
    if pipeline:
        return pipeline
    return tc


def locked_manifest_path(manifest_root: Path | None = None) -> Path:
    root = resolve_manifest_root(manifest_root)
    return root / "whinfell_pipeline" / "collection_manifest.yaml"


def locked_desk_urls_path(manifest_root: Path | None = None) -> Path | None:
    root = resolve_manifest_root(manifest_root)
    path = root / "whinfell_pipeline" / "desk_urls.yaml"
    return path if path.is_file() else None


def resolve_manifest_paths(manifest_root: Path | None = None) -> ManifestPaths:
    root = resolve_manifest_root(manifest_root)
    manifest_path = root / "whinfell_pipeline" / "collection_manifest.yaml"
    desk = locked_desk_urls_path(root)
    return ManifestPaths(manifest_root=root, manifest_path=manifest_path, desk_urls_path=desk)


def _expand_env(value: str) -> str:
    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        return os.environ.get(key, match.group(0))

    return ENV_VAR_RE.sub(repl, value)


def _resolve_url(raw: str, wired: str | None, fallback: str) -> str:
    expanded = _expand_env(raw)
    if expanded and not expanded.startswith("${"):
        return expanded
    if wired:
        wired_exp = _expand_env(wired)
        if wired_exp and not wired_exp.startswith("${"):
            return wired_exp
    return fallback


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except yaml.YAMLError as exc:
        raise ManifestLoadError(path, exc) from exc


def _merge_desk_urls(manifest: dict[str, Any], desk: dict[str, Any]) -> dict[str, Any]:
    for entry in manifest.get("batch_exports", []):
        batch_id = entry.get("id", "")
        keys = _BATCH_DESK_KEYS.get(batch_id)
        if not keys:
            continue
        section, view_name = keys
        spec = (desk.get(section) or {}).get(view_name) or {}
        if not isinstance(spec, dict):
            continue
        resolved = _resolve_url(
            str(spec.get("url", entry.get("url", ""))),
            spec.get("wired_url"),
            str(entry.get("fallback_url", "")),
        )
        entry["url"] = resolved
        entry["desk_export_menu"] = spec.get("export_menu", "")
        entry["desk_navigate"] = spec.get("navigate", "")
        entry["desk_replace_me"] = bool(spec.get("replace_me"))
        for pattern_key in ("raw_export_patterns", "raw_export_name"):
            extra = spec.get(pattern_key)
            if not extra:
                continue
            entry.setdefault("raw_filename_patterns", [])
            merged = [extra] if isinstance(extra, str) else list(extra)
            entry["raw_filename_patterns"] = list(
                dict.fromkeys([*entry["raw_filename_patterns"], *merged])
            )
    return manifest


def load_core_exports(
    pipeline_root: Path | None = None,
    *,
    manifest_root: Path | None = None,
    export_ids: tuple[str, ...] = CORE_EXPORT_IDS,
) -> tuple[list[ExportTarget], Path | None]:
    """Return sorted core export targets; manifest_root is the locked TC repo when present."""
    paths = resolve_manifest_paths(manifest_root or pipeline_root)
    if not paths.manifest_path.is_file():
        return [], paths.manifest_root

    desk_path = paths.desk_urls_path
    manifest = _merge_desk_urls(
        _load_yaml(paths.manifest_path),
        _load_yaml(desk_path) if desk_path else {},
    )

    id_set = set(export_ids)
    entries = [e for e in manifest.get("batch_exports", []) if e.get("id") in id_set]
    entries.sort(key=lambda e: e.get("priority", 99))

    targets: list[ExportTarget] = []
    for entry in entries:
        canon = str(entry.get("canonical_name", ""))
        patterns = build_export_raw_patterns(
            source=str(entry.get("source", "")),
            saved_view=str(entry.get("saved_view", "")),
            canonical_name=canon,
            explicit_patterns=list(entry.get("raw_filename_patterns", []) or []),
        )

        targets.append(
            ExportTarget(
                id=str(entry.get("id", "")),
                source=str(entry.get("source", "")),
                saved_view=str(entry.get("saved_view", "")),
                url=str(entry.get("url", "")),
                priority=int(entry.get("priority", 99)),
                canonical_name=canon,
                raw_patterns=patterns,
                export_menu=str(entry.get("desk_export_menu", "")),
                navigate=str(entry.get("desk_navigate", "")),
                optional=bool(entry.get("optional")),
                replace_me=bool(entry.get("desk_replace_me")),
                steps=[str(s) for s in entry.get("steps", [])],
            )
        )

    return targets, paths.manifest_root