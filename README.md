# Whinfell Transmission Control

**v1.5** modular operator console — July 6, 2026  
**Build:** `1.5-BUILD-COUSINS-2026-07-04-PHASE23` · **Hydration:** `1.3.0`

## Team access (zero setup)

Open: **https://clark-cmyk.github.io/Whinfell_Transmission_Control/**

No install, no local server, no API keys. The console auto-loads the latest published hydration bundle.

**Standalone tools (same site):**

| Tool | URL |
|------|-----|
| Main console | `/` |
| Midwest Compute Crush | `/Whinfell_Midwest_Compute_Crush.html` |
| Crypto Analytics | `/Crypto_Analytics.html` |
| BasisWatch | `/Whinfell_BasisWatch.html` |
| Bang Bang Da Machine | `/bang_bang_da_machine.html` |

Private repo Pages requires **GitHub Pro** and repo collaborators. Fallback desk: https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/

## Clark — local console

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

## Clark — publish to web

Pushes a complete static bundle to the isolated **`gh-pages`** branch (main branch untouched):

```bash
bash scripts/publish_ghpages.sh
```

Or click **Publish Web** in the console header (requires collect agent), or double-click `scripts/Publish_to_Web.command`.

**One-time GitHub setup** (after first publish):

1. [Repo Settings → Pages](https://github.com/clark-cmyk/Whinfell_Transmission_Control/settings/pages)
2. Source: **Deploy from a branch** → `gh-pages` → `/ (root)`
3. Add collaborators under Settings → Collaborators

**Full collect before publish:**

```bash
WHINFELL_PUBLISH_COLLECT=1 bash scripts/publish_ghpages.sh
```

## Documentation

| Doc | Path |
|-----|------|
| User Guide v1.5 | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Quick Reference | `documentation/Whinfell_Quick_Reference_v1.5.md` |
| Data Dictionary | `documentation/DATA_DICTIONARY_v1.5.md` |
| URLs & paths | `documentation/DESK_URLS.md` |
| Bang Bang Da (RV Z scanner) | `bang_bang_da/README.md` |
| Publish hygiene | `BEST_PRACTICES.md` |

## Structure

```
index.html          # Console markup
css/                # main, basis_watch, ai_compute, v15_desk, ui_polish
js/                 # bootstrap, core, panels
midwest_compute/    # Midwest Compute Crush standalone
crypto_analytics/   # Crypto Analytics standalone
bang_bang_da/       # BBDM report output + operator README
bang_bang_da_calculator.py
bang_bang_da_machine.html
documentation/      # Operator docs (committed)
scripts/            # build.sh, build_web.sh, publish_ghpages.sh
dist/               # Local build output (gitignored)
data/hydration/     # Local hydration (gitignored)
```

## URLs

| URL | Status |
|-----|--------|
| https://github.com/clark-cmyk/Whinfell_Transmission_Control | Repo (private) |
| https://clark-cmyk.github.io/Whinfell_Transmission_Control/ | Team desk (enable Pages on `gh-pages`) |
| https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/ | Public fallback desk |

Pipeline: `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`

## Bang Bang Da (local)

```bash
open scripts/Bang_Bang_Da.command
# or: python3 scripts/enrich_hydration_rv.py && python3 scripts/bang_bang_da_server.py
# UI: http://127.0.0.1:8765/bang_bang_da_machine.html · API :8766
```

See `bang_bang_da/README.md`.