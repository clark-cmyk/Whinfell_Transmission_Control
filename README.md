# Whinfell Transmission Control

**v1.5** modular operator console — July 3, 2026  
**Build:** `1.5-BUILD-COUSINS-2026-07-03` · **Hydration:** `1.3.0`

## Quick start

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

## Documentation

| Doc | Path |
|-----|------|
| User Guide v1.5 | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| Quick Reference | `documentation/Whinfell_Quick_Reference_v1.5.md` |
| Data Dictionary | `documentation/DATA_DICTIONARY_v1.5.md` |
| URLs & paths | `documentation/DESK_URLS.md` |
| Publish hygiene | `BEST_PRACTICES.md` |

## Structure

```
index.html          # Console markup
css/                # main, basis_watch, ai_compute, v15_desk, ui_polish
js/                 # bootstrap, core, panels
documentation/      # Operator docs (committed)
scripts/            # build.sh, build_desk_preview.sh, publish.sh
docs/               # GitHub Pages payload (built — do not edit by hand)
data/hydration/     # Local hydration symlink (gitignored)
```

## Publish

```bash
git status -sb
bash scripts/publish.sh
```

## URLs

| URL | Status |
|-----|--------|
| https://github.com/clark-cmyk/Whinfell_Transmission_Control | Repo (private) |
| https://clark-cmyk.github.io/Whinfell_Transmission_Control/ | Pages target (needs Pro on private repo) |
| https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/ | Public fallback desk |

Pipeline: `~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE`