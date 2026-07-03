# Whinfell Desk URLs & Paths

**Updated:** July 3, 2026

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
# TC desk
cd ~/Desktop/Whinfell_Transmission_Control
bash scripts/publish.sh

# Cousins archive (delegates to TC build)
cd ~/Desktop/Whinfell_BUILD_Cousins_v2_OLD_2238_ARCHIVE
bash scripts/build_desk_preview.sh
```

---

## Enabling TC Pages (private repo)

1. GitHub → **Whinfell_Transmission_Control** → Settings → Pages  
2. Source: **GitHub Actions** (`desk-preview-pages.yml`)  
3. Requires **GitHub Pro** (or make repo public)  
4. URL will be: `https://clark-cmyk.github.io/Whinfell_Transmission_Control/`

Until then, use **https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/** or local `dist/` server.