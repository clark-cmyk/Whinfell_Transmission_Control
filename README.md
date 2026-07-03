# Whinfell Transmission Control (disaggregated)

Phase 2.2 operator console — modular HTML/CSS/JS build.

## Local dev

```bash
cd ~/Desktop/Whinfell_Transmission_Control
python3 -m http.server 8765
open http://localhost:8765/
```

Optional hydration symlink (auto-load on HTTP):

```bash
mkdir -p data/hydration
ln -sf ~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE/data/hydration/latest.json data/hydration/latest.json
```

## Build

```bash
bash scripts/build.sh
```

Output: `dist/` (ephemeral, gitignored).

## Publish (GitHub Pages)

```bash
bash scripts/publish.sh
```

Copies `dist/` → `docs/` and commits/pushes if this folder is a git repo.

## Structure

- `index.html` — operator console markup
- `css/main.css` — desk styles
- `js/bootstrap.js` — safe boot + error handling
- `js/core.js` — full Transmission Control logic
- `js/desk_china_ladder_models.js` — China ladder models