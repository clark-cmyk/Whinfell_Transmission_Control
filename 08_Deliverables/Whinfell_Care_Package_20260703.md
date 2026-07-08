# Whinfell Care Package — July 3, 2026

**Prepared by:** BUILD Cousins  
**Date:** July 3, 2026 (session stop — v0.4.2 shipped · Task Force Chunk 2 complete)
**Repo:** `Whinfell_Transmission_Control`  
**Build:** `1.5-BUILD-COUSINS-2026-07-03` · **Hydration:** `1.3.0` · Cousins `latest.json` **fresh** (`as_of=2026-07-03T17:57:22Z`)  
**Auto-download:** `0.4.2` (Barchart · Koyfin Watchlist `/myw/` · pre-chain `staged_noise` · drop auto-archive)

### Session snapshot (current)

| Area | Status |
|------|--------|
| **Shipped** | Barchart intraday · Koyfin Watchlists `import_core` + `flows_global` (`/myw/`) · drop auto-archive · **staged_noise quarantine v0.4.2** |
| **Chunk 5 chain** | `normalize_exit=0` · `hydrate_exit=0` · `collect_exit=0` **PASS** (pre-chain quarantine) |
| **Koyfin terms** | Watchlist `/myw/` (snapshot) · Chart `/charts/` (timeseries) · never `/myg/` `/myd/` |
| **Drop archive** | Active before `plan`/`status`/`fetch`/`daily` · keep 2 days · `WHINFELL_DROP_ARCHIVE=0` disables |
| **Task Force arena** | **Chunk 2 DONE** — all domain specialist Grok Tasks in `prompts/task_force/` · `global_transmission` stub filled (SQ3-excluded, score 86 vs full 69) · stubs in `latest.json` · see [01_Strategy_Docs/Task_Force_Arena_Plan_20260703.md](../01_Strategy_Docs/Task_Force_Arena_Plan_20260703.md) |
| **Next — BUILD** | **New session** — Chunk 3 MasterSizing + TxIntegrator (WTM EXPORT v2.1) · `run_task_force_chain.sh` · hydration copy after Clark wires URLs |
| **Next — Clark** | **Active** — wire `koyfin_rates` / `china` / `equities` Watchlist `/myw/` in Cousins `desk_urls.yaml` (`replace_me: false`) |
| **Dictionary** | Cousins `data_dictionary.yaml` in flight — **read-only from TC; do not overwrite** |

### Collect noise plan (Chunk A → B)

| Chunk | Owner | Scope | Done when |
|-------|-------|-------|-----------|
| **A — Diagnose** | BUILD | Taxonomy of `staged_raw/source=barchart/dataset=greeks\|options` failures: malformed filenames (` 2.csv`, spaces) vs `no adapter matched` | **DONE** — 37 malformed · 74 no_adapter (111 greeks/options) |
| **B — Quarantine** | BUILD | TC `staged_noise.py` + hook in `pipeline_bridge.chain()` before normalize: move noise → `staged_raw/quarantine/collect_noise/YYYYMMDD/` | **DONE** — `collect_exit=0` · `hydrate_exit=0` · residual barchart probe +11 |
| **C — Koyfin URLs** | Clark | Paste Watchlist `/myw/` URLs for rates, china, equities (`replace_me: false`) | `fetch --id koyfin_rates\|china\|equities` succeeds |

**Root cause (Chunk 5):** Cousins `cmd_collect` exits 1 when any `staged_raw` file fails (`files_failed > 0`). Legacy desk Barchart greeks/options exports poison collect; hydration still passes (`required_ok=33/33`).

**Chunk B fix:** `whinfell_pipeline/auto_download/staged_noise.py` — dictionary `normalize_rules` globs for greeks/options · Cousins subprocess probe for residual `futures_intraday`/`futures_daily` poison · `WHINFELL_STAGED_NOISE=0` disables · runs before normalize in `pipeline_bridge.chain()`.

### Auto-download v0.4.2 (accepted)

| Layer | Order | Behavior |
|-------|-------|----------|
| **Drop auto-archive** | 1st (`plan`/`status`/`fetch`/`daily`) | Stale drop CSVs → `data/archive/drop/YYYYMMDD/` · `WHINFELL_DROP_ARCHIVE=0` disables |
| **staged_noise** | 2nd (`daily --chain` only) | Pre-normalize quarantine · greeks/options + residual barchart probe · no-op when clean |
| **normalize → collect → hydrate** | 3rd | Cousins `run_batch_collect.py` / `run_csv_download.py daily` |

**Idempotent re-run (Jul 3 verify):** second `daily --chain --chain-skip-required` → no `staged_noise` moves · `collect_exit=0` · `hydrate_exit=0` · `files_failed=0` · drop archive fires only when stale CSVs present.

---

## 1. Project status & architecture overview

### Transmission Control (console)

| Layer | Status | Detail |
|-------|--------|--------|
| Core shell | **Live** | `index.html` + `js/core.js` · modular panels |
| Node cockpits ×5 | **Live** | Basis · Credit · Liquidity · Breadth · Highbeta |
| Mission surfaces | **Live** | Tactical banner · summary strip · implication rail |
| RV/Basis table | **Live** | Spot-fallback formatting · `focus-horizon-table--spot-fallback` |
| AI Compute panel | **Live** | H200 curve · MISO Indiana Hub · crush trade |
| BasisWatch panel | **Live** | Calendar vs ref band tooling |
| v1.5 Desk panel | **Live** | Corporate Credit · Trade Tracker · BTC Attribution · Margin Rules |
| Docs drawer | **Live** | In-repo doc links + operator guides |

### Data pipeline

```
Comet/Playwright auto-fetch  →  ~/Downloads/whinfell_drop
  → drop auto-archive (v0.4.2)
  → staged_noise quarantine (v0.4.2, pre-chain)
  → run_batch_collect.py normalize  →  stage → collect → hydrate
  → TC Import hydration bundle (copy via scripts/copy_hydration_bundle.sh)
```

| Component | Status | Detail |
|-----------|--------|--------|
| **Auto-download** | **Partial** | Barchart intraday **live** · Koyfin Watchlist `/myw/` **live** · Koyfin Chart `/charts/` **blocked** |
| `run_auto_download.py` | **Live** | CLI: `plan` · `login` · `fetch` · `status` · `daily --chain` |
| `KoyfinAdapter` | **Partial** | Watchlist `/myw/` → Download · Chart `/charts/` → SHOW TABLE; `/myg/` `/myd/` forbidden · module `0.4.2` |
| `staged_noise` | **Live** | Pre-chain greeks/options + residual barchart quarantine · `tests/test_staged_noise.py` |
| Cousins pipeline bridge | **Live** | Pre-chain `staged_noise` quarantine · `collect_exit=0` · `hydrate_exit=0` |
| Drop auto-archive | **Live** | `drop_archive.py` · keep 2 days in drop · `WHINFELL_DROP_ARCHIVE=0` to disable |
| Morning launcher | **Live** | `morning_auto_collect.sh` · fixed `--drop` global arg order |
| Morning drop staging | **Live** | `scripts/normalize_whinfell_drop.sh` / `normalize_drop.py` |
| Barchart hydration | **Live** | Cousins `barchart_hydration.py` + watchlist intraday ingest |
| Bundled hydration | **Ready to copy** | Cousins `latest.json` fresh (`2026-07-03T17:57:22Z`) · TC `docs/data/hydration/` pending post-Clark full chain |
| Freshness indicators | **Live** | Header dot/label · per-node `composite_score_source` chips |
| Cousins `data_dictionary.yaml` | **In flight** | Ongoing edits in pipeline archive — **preserved; do not overwrite from TC** |
| ARCH-4 curve history | **Not started** | Multi-day `barchart_curve_history.json` |

### Repo layout (auto-download)

| Path | Role |
|------|------|
| `run_auto_download.py` | CLI entry (repo root) |
| `whinfell_pipeline/auto_download/` | Manifest loader · session · adapters · validators |
| `whinfell_pipeline/auto_download/adapters/barchart.py` | Chunk 3 — intraday watchlist |
| `whinfell_pipeline/auto_download/adapters/koyfin.py` | Chunk 4 — Koyfin Watchlist `/myw/` + Chart `/charts/` export |
| `whinfell_pipeline/auto_download/staged_noise.py` | v0.4.2 — pre-chain collect noise quarantine |
| `whinfell_pipeline/auto_download/drop_archive.py` | v0.4.1 — drop CSV auto-archive |
| `scripts/copy_hydration_bundle.sh` | Cousins `latest.json` → `docs/data/hydration/` (post-wire) |
| `~/.whinfell/comet_profile` | Persistent Comet browser session |
| Cousins `whinfell_pipeline/collection_manifest.yaml` | Export plan + `required_batch_ids` |
| Cousins `whinfell_pipeline/desk_urls.yaml` | Wired URLs + `replace_me` flags |

---

## 2. Shipped features

### Phase 2.2 UI (BUILD_MASTER_PROMPT)

| Chunk | Feature | Key artifacts |
|-------|---------|---------------|
| 1 | RV/Basis spot-fallback table | `resolveRvHorizonValueFallback` · `buildRvHorizonEvidenceMarkup` |
| 2 | Mission-surface consistency (5 nodes) | Unified banner/strip/rail · Composite + horizon-net fallback chips |
| 3 | Data refresh reliability (TC) | Relaxed staging quarantine · freshness in `latest.json` |
| 4 | Desk readiness docs | `Desk_Feedback_Log.md` · Clark/Wes test steps 1–8 |
| + | In-repo test suite | `rv_horizon_fallback.test.mjs` · `run_desk_probes.mjs` · `freshness_indicators.test.mjs` |

### Auto-download Chunk 3 (Barchart intraday)

| Item | Detail |
|------|--------|
| Target | `https://www.barchart.com/my/watchlist?viewName=197689` |
| Browser | **Comet** (`/Applications/Comet.app`) via Playwright |
| Profile | `~/.whinfell/comet_profile` |
| Export ID | `barchart_futures_intraday` |
| Verified output | `watchlist-wtm-canonical-universe-intraday-07-03-2026.csv` |
| Validation | ≥120 bytes · `Symbol` header · not HTML |

### Auto-download Chunk 4c (Koyfin Watchlists)

| Item | Detail |
|------|--------|
| Adapter | `KoyfinAdapter` v0.4.1 · Comet persistent profile · dictionary-aligned |
| Export rules | WTM* saved views · Watchlist `/myw/` or Chart `/charts/` only · never `/myg/` `/myd/` |
| Watchlist flow (`/myw/`) | **Live verified** — direct **Download** → CSV · `Ticker` header validates |
| Wired targets | `koyfin_import_core` (`/myw/70789aa7-…`) · `koyfin_flows_global` (`/myw/afb1f314-…`) |
| Chart flow (`/charts/`) | SHOW TABLE → Download Available Data — **blocked** until Clark wires `/charts/` URLs |
| Live proof | `koyfin_WTM-Import-Core_2026.07.03_11.49.38.066.csv` · `WTM-Flows-Global.csv` |
| Tests | `tests/test_koyfin_adapter.py` **PASS** (11 tests) |

### Auto-download Chunk 5 (Pipeline chain) — **PASS**

| Item | Detail |
|------|--------|
| Command | `python3 run_auto_download.py --drop ~/Downloads/whinfell_drop daily --chain` |
| Pre-chain | **PASS** `staged_noise` · 122 legacy files quarantined (first run) · idempotent on re-run |
| Normalize | **PASS** `normalize_exit=0` |
| Collect | **PASS** `collect_exit=0` · `files_failed=0` |
| Hydrate | **PASS** `hydrate_exit=0` · `freshness_status=fresh` · `required_ok=33/33` |
| Koyfin ingest | `credit_20260703_*` · `flows_20260703_1127` (flows_fallback) |
| Flags | `--chain-skip-required` when `koyfin_rates` not wired · `WHINFELL_STAGED_NOISE=0` disables quarantine |

### Morning launcher + drop archive (Chunk 6–7)

| Item | Detail |
|------|--------|
| Script | `scripts/morning_auto_collect.sh` |
| Finder | `~/Desktop/Whinfell_Morning_Collect.command` (double-click) |
| Behavior | Auto-archive → Barchart + wired Koyfin Watchlist fetches → skip blocked Chart targets → `daily --chain` |
| Archive | CSVs older than 2 days: `~/Downloads/whinfell_drop` → `data/archive/drop/YYYYMMDD/` |

---

## 3. Blocked items

| Issue | Severity | Notes |
|-------|----------|-------|
| **Koyfin Chart SHOW TABLE flow** | **High · blocks rates/china/equities timeseries** | Need Clark **Chart** `/charts/` URLs (My Templates WTM-*) or **Watchlist** `/myw/` snapshot URLs in `desk_urls.yaml` |
| **Koyfin `replace_me` share URLs** | **High** | `koyfin_rates`, `koyfin_china`, `koyfin_equities` still `https://app.koyfin.com/` |
| **Collect noise (greeks/options)** | ~~High~~ **Fixed** | Pre-chain quarantine `staged_noise.py` v0.4.2 — 122 files → `quarantine/collect_noise/20260703/` |
| **TC bundled hydration copy** | Medium | Cousins bundle fresh · run `bash scripts/copy_hydration_bundle.sh` after Clark wires URLs + full chain |
| **Live desk ratings empty** | **Blocking go-live sign-off** | Operator table in `Desk_Feedback_Log.md` not filled |
| **Comet profile isolation** | Medium | Automation uses `~/.whinfell/comet_profile`; run `login` once or set env credentials |
| **Barchart headless blocked** | Medium | CloudFront rejects headless Chromium; headed Comet fetch required |

| **Credential hygiene** | Low | `KOYFIN_LOGIN_*` / `BARCHART_LOGIN_*` env vars only — never commit passwords |

---

## 4. Next priorities

| # | Priority | Goal | Owner |
|---|----------|------|-------|
| 1 | ~~Highest~~ **Done** | Collect noise quarantine — `collect_exit=0` on full chain | BUILD |
| 2 | ~~High~~ **Done** | **Task Force Chunk 2** — domain specialists (btc_eth_basis → hy_vs_ig) + `global_transmission` filled | BUILD |
| 2b | **High** | **Task Force Chunk 3** — MasterSizing + TxIntegrator + chain launcher | BUILD (new session) |
| 3 | **High** | **Koyfin Watchlist URLs** — wire rates, china, equities `/myw/` in `desk_urls.yaml` | Clark |
| 4 | **High** | **Live desk walk-through** — rate all 5 nodes + UI/docs drawer | Clark · Wes |
| 5 | **Medium** | **Copy fresh hydration** — `bash scripts/copy_hydration_bundle.sh` after full chain | BUILD (queued) |
| 5 | **Medium** | **Morning runbook** — Quick Ref update for `.command` launcher | BUILD |

**New session starter:**

```
v0.4.2 shipped (collect_exit=0). Task Force Chunk 2 DONE — all domain specialist prompts + global_transmission filled.
Start Chunk 3: MasterSizing + TxIntegrator (WTM EXPORT v2.1). Prompt automation only; no heavy UI.
Clark: wire koyfin_rates / china / equities Watchlist /myw/ in desk_urls.yaml.
```

---

## 5. Test commands & daily workflow

### Phase 2.2 UI verification

```bash
cd ~/Desktop/Whinfell_Transmission_Control
node tests/rv_horizon_fallback.test.mjs
node tests/run_desk_probes.mjs
node tests/freshness_indicators.test.mjs
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

### Auto-download

```bash
cd ~/Desktop/Whinfell_Transmission_Control

# One-time: open Comet, log into Barchart + Koyfin
python3 run_auto_download.py login

# Credentials (env only — do not commit)
export BARCHART_LOGIN_EMAIL='your@email'
export BARCHART_LOGIN_PASSWORD='…'
export KOYFIN_LOGIN_EMAIL='your@email'
export KOYFIN_LOGIN_PASSWORD='…'

# Barchart ✓
python3 run_auto_download.py fetch --id barchart_futures_intraday

# Chunk 4c — wired Koyfin Watchlists (/myw/)
python3 run_auto_download.py fetch --id koyfin_import_core
python3 run_auto_download.py fetch --id koyfin_flows_global

# Chunk 5 — pipeline chain (note: --drop is global, before subcommand)
python3 run_auto_download.py --drop ~/Downloads/whinfell_drop daily --chain
# Verify collect when required exports missing:
python3 run_auto_download.py --drop ~/Downloads/whinfell_drop daily --chain --chain-skip-required
python3 run_auto_download.py --drop ~/Downloads/whinfell_drop status

# Unit tests
python3 tests/test_auto_download_scaffold.py
python3 tests/test_barchart_adapter.py
python3 tests/test_koyfin_adapter.py
python3 tests/test_drop_archive.py
python3 tests/test_staged_noise.py

# After Clark wires URLs + full daily --chain:
bash scripts/copy_hydration_bundle.sh
bash scripts/build_desk_preview.sh
```

### Morning workflow

```bash
open ~/Desktop/Whinfell_Morning_Collect.command
# or:
bash scripts/morning_auto_collect.sh
```

### Drop + normalize check

```bash
bash scripts/normalize_whinfell_drop.sh ~/Downloads/whinfell_drop --dry-run
python3 run_auto_download.py --drop ~/Downloads/whinfell_drop status --json
```

---

## Desk testing status

### Automated pre-validation (July 3, 2026)

| # | Test | Result |
|---|------|--------|
| 1 | `rv_horizon_fallback.test.mjs` | **PASS** |
| 2 | `run_desk_probes.mjs` (mission surfaces ×5) | **PASS** |
| 3 | `freshness_indicators.test.mjs` | **PASS** |
| 4 | `build_desk_preview.sh` ×2 identical stamp | **PASS** |
| 5 | `test_auto_download_scaffold.py` | **PASS** |
| 6 | `test_barchart_adapter.py` | **PASS** |
| 7 | `test_koyfin_adapter.py` | **PASS** |
| 8 | Live Barchart fetch (Comet) | **PASS** |
| 9 | Koyfin Watchlist live fetch (`import_core`, `flows_global`) | **PASS** |
| 10 | `daily --chain` E2E (`hydrate_exit=0`) | **PASS** |
| 11 | `daily --chain` full (`collect_exit=0`) | **PASS** — `staged_noise` quarantine · `files_failed=0` |
| 12 | `test_drop_archive.py` | **PASS** |
| 13 | `test_staged_noise.py` | **PASS** |
| 14 | `daily --chain` re-run (idempotent archive + staged_noise) | **PASS** — `collect_exit=0` · no noise moves |

### Live operator walk-through

| Step | Status |
|------|--------|
| Build + serve locally | Ready — `Desk_Feedback_Log.md` steps 1–4 |
| Per-node visual check (steps 5–7) | **Pending** — no operator ratings logged |
| Go/no-go for new UI feature work | **Hold** until ratings complete |

---

## Related docs

| Doc | Path |
|-----|------|
| Desk feedback log | `08_Deliverables/Desk_Feedback_Log.md` |
| Auto-download design | `08_Deliverables/AUTO_CSV_DOWNLOAD_DESIGN_20260703.md` |
| BUILD TODO | `01_Strategy_Docs/BUILD_TODO_List.md` |
| Progress log | `01_Strategy_Docs/Progress_Log.md` |
| User guide v1.5 | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Quick reference | `documentation/Whinfell_Quick_Reference_v1.5.md` |
| Prior care package | `08_Deliverables/Whinfell_Care_Package_20260630.md` |
| Task Force arena plan | `01_Strategy_Docs/Task_Force_Arena_Plan_20260703.md` |