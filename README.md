# Whinfell Transmission Control (disaggregated)

Phase **2.3** operator console — modular HTML/CSS/JS + BasisWatch + AI Compute.

## Local dev

```bash
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/build_desk_preview.sh
cd dist && python3 -m http.server 8765
open http://localhost:8765/
```

## Publish (GitHub Pages)

```bash
git status -sb
bash scripts/publish.sh
```

See `BEST_PRACTICES.md` — never `git add -A`; working tree must be clean after publish.

## Structure

- `index.html` — operator console markup
- `css/` — `main.css`, `basis_watch.css`, `ai_compute.css`, `ui_polish.css`
- `js/` — `bootstrap.js`, `core.js`, BasisWatch, AI Compute, `ui_polish.js`
- `docs/` — committed Pages payload (built from `dist/`)
- `scripts/build_desk_preview.sh` — full desk build + BUILD_STAMP