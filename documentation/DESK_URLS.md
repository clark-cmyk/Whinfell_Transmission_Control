# Whinfell Desk URLs & Paths

**Updated:** July 7, 2026

---

## Public URLs

| Resource | URL | Notes |
|----------|-----|-------|
| **TC GitHub repo** | https://github.com/clark-cmyk/Whinfell_Transmission_Control | Private — collaborators only |
| **TC Pages (target)** | https://clark-cmyk.github.io/Whinfell_Transmission_Control/ | **404 until Pages enabled** on private repo (GitHub Pro) |
| **BUILD Cousins v2 (public)** | https://github.com/clark-cmyk/Whinfell_BUILD_Cousins_v2 | Public pipeline archive |
| **Cousins v2 Pages (live)** | https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/ | **Confirmed public** — use as fallback |
| **Hydration JSON (TC Pages)** | https://clark-cmyk.github.io/Whinfell_Transmission_Control/data/hydration/latest.json | When TC Pages live |
| **Raw hydration (GitHub)** | https://raw.githubusercontent.com/clark-cmyk/Whinfell_Transmission_Control/main/docs/data/hydration/latest.json | Requires repo access |
| **Bang Bang Da UI (TC Pages)** | https://clark-cmyk.github.io/Whinfell_Transmission_Control/bang_bang_da_machine.html | Static report only — API needs local server |
| **RV history sidecar** | `docs/data/hydration/rv_history.json` | Built by `enrich_hydration_rv.py` |

---

## Bang Bang Da Machine (local)

| Item | URL / path |
|------|------------|
| **One-click launcher** | `scripts/Bang_Bang_Da.command` |
| **Desk UI** | http://127.0.0.1:8765/bang_bang_da_machine.html |
| **Live API** | http://127.0.0.1:8766/api/report?window=60 |
| **Health** | http://127.0.0.1:8766/health |
| **Operator README** | `bang_bang_da/README.md` |
| **Report JSON** | `bang_bang_da/bang_bang_da_report.json` |

```bash
cd ~/Desktop/Whinfell_Transmission_Control
open scripts/Bang_Bang_Da.command
# Manual: enrich → server → static host
python3 scripts/enrich_hydration_rv.py
python3 scripts/bang_bang_da_server.py &    # :8766
python3 -m http.server 8765                 # serve repo root
```

**Note:** Window selector (30/60/90d) requires API on `:8766`. Without it, UI falls back to last static report.

---

## Local paths

| Item | Absolute path |
|------|---------------|
| TC repo | `/Users/clarksonwthornburgh/Desktop/Whinfell_Transmission_Control` |
| Pipeline archive | `/Users/clarksonwthornburgh/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE` |
| Hydration source | `.../Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE/data/hydration/latest.json` |
| Local preview | `http://localhost:8765/` after `python3 -m http.server 8765` in `dist/` |

---

## Build & publish

```bash
# TC desk — publish to gh-pages (main untouched)
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/publish_ghpages.sh

# Full collect + publish
WHINFELL_PUBLISH_COLLECT=1 bash scripts/publish_ghpages.sh

# Local preview only
bash scripts/build_web.sh && cd dist && python3 -m http.server 8765
```

---

## Enabling TC Pages (private repo)

1. Run `bash scripts/publish_ghpages.sh` once (creates `gh-pages` branch)
2. GitHub → **Whinfell_Transmission_Control** → [Settings → Pages](https://github.com/clark-cmyk/Whinfell_Transmission_Control/settings/pages)
3. Source: **Deploy from a branch** → Branch: `gh-pages` → Folder: `/ (root)`
4. Requires **GitHub Pro** (or make repo public) + repo collaborators
5. URL: `https://clark-cmyk.github.io/Whinfell_Transmission_Control/`

Until then, use **https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/** or local `dist/` server.