# Auto CSV Download Module — Design & Plan

**Prepared by:** BUILD Cousins  
**Date:** July 3, 2026  
**Chunk:** 1 (design only — no code yet)  
**Authority:** `collection_manifest.yaml` · `desk_urls.yaml` · `data_dictionary.yaml` (Cousins pipeline)

---

## 1. Problem statement

Comet / Perplexity browser agents are flaky when exporting Koyfin dashboards and the Barchart intraday watchlist (`viewName=197689`). Clark still performs too many manual clicks.

**Current chain (partially automated):**

```
Comet/Clark manual export → ~/Downloads/whinfell_drop
  → normalize_whinfell_drop.sh / run_batch_collect.py normalize
  → run_csv_download.py stage → collect → hydrate
  → TC Import hydration bundle
```

**Gap:** Steps between “open URL” and “file in whinfell_drop” depend on unreliable agents or manual clicks. Staging, collect, and hydrate are already solid.

---

## 2. Goal

Replace Comet/Perplexity with a **local, deterministic auto-download module** that:

1. Downloads required CSVs from Barchart + Koyfin saved views
2. Lands files in `~/Downloads/whinfell_drop` with validation
3. Chains into the existing pipeline without schema changes
4. Reduces Clark’s morning routine to **one command** (+ one-time login setup)
5. Expands later to ETF flows and additional tickers via manifest only

---

## 3. Architecture

### 3.1 Module placement

| Layer | Location | Notes |
|-------|----------|-------|
| **Auto-download core** | `whinfell_pipeline/auto_download/` | Lives in Cousins pipeline repo (source of truth) |
| **CLI entry** | `run_auto_download.py` | Repo root — mirrors `run_csv_download.py` |
| **TC launcher** | `scripts/morning_auto_collect.sh` | Thin wrapper for Clark’s Desktop workflow |
| **Config** | Existing YAML only | No duplicate ticker lists |

**Prerequisite:** Restore Cousins pipeline to Desktop (symlink or copy from `Archive-20260703/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`). TC repo keeps launcher + docs; pipeline code stays in Cousins.

### 3.2 Component diagram

```
run_auto_download.py
  │
  ├─ ManifestLoader ──► collection_manifest.yaml + desk_urls.yaml (merged)
  │
  ├─ SessionManager ──► Playwright persistent context (~/.whinfell/browser_profile/)
  │
  ├─ ExportOrchestrator
  │    ├─ KoyfinAdapter      (dashboard ⋮ → Export CSV)
  │    ├─ BarchartAdapter    (watchlist Download CSV · viewName=197689)
  │    └─ BarchartApiAdapter (ARCH-4 fast-path · BARCHART_API_KEY)
  │
  ├─ DropValidator ──► min bytes · CSV header · not HTML · pattern match
  │
  └─ PipelineBridge ──► run_batch_collect.py run | run_csv_download.py daily
```

### 3.3 Design principles

| Principle | Implementation |
|-----------|----------------|
| Manifest-driven | Reuse `batch_exports` + `required_batch_ids`; no hardcoded URLs in Python |
| Adapter pattern | One adapter per `source` field (`koyfin`, `barchart`, `crypto`) |
| Session reuse | Persistent Chromium profile — Clark logs in once per site |
| Fail loud, fail partial | Per-export status in manifest; quarantine bad files; continue remaining exports |
| Graceful fallback | On adapter failure → `run_batch_collect.py open` + print manual step |
| No CSV parsing in browser | Export-only robot — parsing stays in `ingest` / `hydrate` |

---

## 4. Export targets (daily core)

### 4.1 Required (`required_batch_ids`)

| ID | Source | Saved view | Wired URL |
|----|--------|------------|-----------|
| `koyfin_rates` | Koyfin | WTM-Rates-Credit | `desk_urls.yaml` (replace_me — needs share link or nav) |
| `barchart_futures_intraday` | Barchart | WTM-Futures-Intraday | `viewName=197689` ✓ wired |
| `barchart_futures_daily` | Barchart | WTM-Futures-Daily | BTM26 historical-download |

### 4.2 High-value optional (daily enrichments)

| ID | Source | Saved view | Status |
|----|--------|------------|--------|
| `koyfin_import_core` | Koyfin | WTM-Import-Core | ✓ wired |
| `koyfin_china` | Koyfin | WTM-China-Policy | replace_me |
| `koyfin_flows_global` | Koyfin | WTM-Flows-Global | ✓ wired |
| `koyfin_equities` | Koyfin | WTM-Equities-Breadth | replace_me |

### 4.3 API fast-path (no browser)

When `BARCHART_API_KEY` is set, `barchart_core_batch` uses existing `fetch_all_tickers_api()` — already shipped in `batch_collect.py`. Auto-download module delegates to this; does not reimplement.

---

## 5. Adapter specifications

### 5.1 BarchartAdapter (priority — Chunk 3)

**Target:** `https://www.barchart.com/my/watchlist?viewName=197689`

| Step | Action |
|------|--------|
| 1 | Navigate to `wired_url` from desk_urls |
| 2 | Wait for watchlist table (`networkidle` + row selector) |
| 3 | Click **Download CSV** (top-right export control) |
| 4 | Capture download → `~/Downloads/whinfell_drop/` |
| 5 | Rename if needed to match `raw_export_patterns` (`watchlist-*-intraday-*.csv`) |
| 6 | Validate: ≥120 bytes, contains date/time column, not HTML |

**Retry:** 2 attempts with 3s backoff. Screenshot on failure → `data/quarantine/screenshots/`.

### 5.2 KoyfinAdapter (Chunk 4)

**Per saved view / watchlist:**

| Step | Action |
|------|--------|
| 1 | Navigate to `wired_url` or dashboard share link |
| 2 | Wait for data grid render |
| 3 | Open `⋮` menu → **Export** → **CSV** |
| 4 | Capture download → `whinfell_drop/` |
| 5 | Validate against `raw_export_name` / `canonical_name` patterns |

**Navigation fallback:** When `replace_me: true` and no share link, use `navigate` text + `assist_urls` to verify correct panel before export.

**Flows special case:** Preserve vendor filename `WTM-Flows-Global.csv` — normalize rules already map `WTM-Flows*.csv` → `flows_*`.

### 5.3 BarchartApiAdapter (delegate)

Thin wrapper calling `batch_collect.fetch_barchart_historical()` for ARCH-4 symbols. No Playwright.

---

## 6. CLI interface (proposed)

```bash
# One-time: open browser, Clark logs into Koyfin + Barchart, session saved
python3 run_auto_download.py login

# Daily core (required_batch_ids + --include-optional)
python3 run_auto_download.py daily \
  --drop ~/Downloads/whinfell_drop \
  --include-optional import_core,flows_global \
  --chain                    # auto-run normalize → collect → hydrate

# Single export debug
python3 run_auto_download.py fetch --id barchart_futures_intraday

# Status without downloading
python3 run_auto_download.py status --drop ~/Downloads/whinfell_drop

# Fallback: open tabs only (current behavior)
python3 run_auto_download.py open
```

**Morning one-liner (target):**

```bash
bash scripts/morning_auto_collect.sh
# → login check → auto_download daily --chain → prints hydration path
```

---

## 7. Pipeline integration

No changes to hydration schema or TC import.

```
run_auto_download.py daily --chain
  │
  ├─ [1] Export CSVs → ~/Downloads/whinfell_drop
  ├─ [2] batch_collect.normalize_drop_dir()     # canonical renames
  ├─ [3] run_csv_download.py daily              # stage → collect → hydrate
  └─ [4] Write auto_download_manifest.json      # per-export status + timestamps
```

**TC repo `normalize_drop.py`:** Stays as lightweight fallback when Cousins pipeline unavailable. Primary path uses Cousins `batch_collect.normalize_drop_dir()` (stricter, dictionary-aligned).

---

## 8. Validation & observability

| Check | Rule | On fail |
|-------|------|---------|
| File size | ≥ 48 bytes (normalize) / ≥ 120 bytes (barchart) | Quarantine + retry |
| Content type | No `<html` in first 400 chars | Quarantine |
| CSV header | Contains `date` or `time` (barchart) | Quarantine |
| Pattern match | Matches `raw_filename_patterns` or `canonical_name` | Warn, still stage if valid CSV |
| Freshness | mtime within `--window` (default 24h) | Warn in status |

**Manifest output:** `staged_raw/manifests/auto_download_YYYYMMDD_HHMMSS.json`

```json
{
  "version": "1.0.0",
  "operator": "auto_download",
  "exports": [
    {"id": "barchart_futures_intraday", "status": "ok", "path": "...", "bytes": 8421},
    {"id": "koyfin_rates", "status": "failed", "error": "export_menu_not_found", "screenshot": "..."}
  ],
  "drop_ready": false,
  "missing_required": ["koyfin_rates"]
}
```

---

## 9. Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `playwright` | Browser automation | `pip install playwright && playwright install chromium` |
| `pyyaml` | Manifest loading | Already in pipeline |
| `stdlib` urllib | Barchart API path | Already used |

**No Comet / Perplexity / Selenium.** Playwright persistent context is the industry-standard replacement for flaky agent browsers on macOS.

---

## 10. Chunk execution plan

| Chunk | Scope | Est. | Deliverable | Go/no-go gate |
|-------|-------|------|-------------|---------------|
| **1** | Design + plan | 1h | This document | **Clark approves architecture** |
| **2** | Scaffold: manifest loader, session manager, CLI skeleton, tests | 1–2h | `run_auto_download.py` stub + unit tests | Manifest loads, login opens browser |
| **3** | Barchart intraday adapter (`viewName=197689`) | 2h | Working intraday CSV in drop | File validates + normalize accepts |
| **4** | Koyfin adapters (rates, import-core, flows, china) | 2–3h | 4 Koyfin CSVs auto-exported | Staged + ingest without manual click |
| **5** | Pipeline bridge (`--chain` → daily) | 1h | End-to-end `latest.json` | `hydrate_exit=0` |
| **6** | Morning launcher, docs, Clark runbook | 1h | `morning_auto_collect.sh` + Quick Ref update | Clark one-command morning |

**Deferred (post-MVP):** ETF flow expansions, optional crypto charts, China ladder assists, ARCH-4 API batch (already exists — wire into `--chain`).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Koyfin/Barchart UI changes | Adapter selectors in one file per source; screenshot-on-fail for fast fixes |
| `replace_me: true` views lack share URLs | Chunk 4 blocked until Clark pastes share links OR we ship nav selectors |
| Cousins archive not on Desktop | Chunk 2 prereq: restore pipeline path (symlink from Archive) |
| Login session expires | `login` command re-runnable; status check warns on auth redirect |
| Barchart rate limits | Retry + backoff; API path for historical when key available |

---

## 12. Clark prerequisites (before Chunk 2)

1. **Restore pipeline repo** to `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` (or tell BUILD preferred path)
2. **Paste Koyfin share links** for `replace_me: true` views (Rates, Equities, China-Policy) into `desk_urls.yaml`
3. **Confirm** `playwright` install is acceptable on desk Mac
4. **Optional:** Set `BARCHART_API_KEY` for ARCH-4 fast-path

---

## 13. Success criteria

| Metric | Target |
|--------|--------|
| Manual clicks per morning | ≤ 1 (run script; login once per month) |
| Required batch ready | `koyfin_rates` + `barchart_futures_intraday` + `barchart_futures_daily` without Comet |
| Pipeline chain | `hydrate_exit=0` after `--chain` |
| Quarantine rate | < 10% of exports on steady state |
| Fallback | Manual `open` still works if auto fails |

---

## Related files

| File | Role |
|------|------|
| `whinfell_pipeline/collection_manifest.yaml` | Export plan + required_batch_ids |
| `whinfell_pipeline/desk_urls.yaml` | Wired URLs + export menus |
| `run_csv_download.py` | Stage → collect → hydrate |
| `run_batch_collect.py` | Normalize, watch, open, fetch-api |
| `08_Deliverables/Perplexity_Comet_Collection_Instructions.md` | Replaced by auto-download runbook (Chunk 6) |