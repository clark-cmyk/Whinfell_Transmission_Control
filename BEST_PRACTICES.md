# Whinfell Transmission Control — Best Practices

**Last Updated:** July 3, 2026 (v1.5)

## Repo hygiene

- **Never** `git add -A`.
- **Always** `git status -sb` before commit or publish.
- Ignored: `dist/`, `data/` (local hydration + barchart cache).
- **Do not** hand-edit `docs/` — it is rebuilt from `dist/` on every publish.

## Publish workflow

```bash
git status -sb
bash scripts/publish.sh
git status -sb   # must be clean before push completes
```

`publish.sh` runs `build_desk_preview.sh`, copies `dist/` → `docs/`, stages:

`docs/ index.html css/ js/ scripts/ documentation/ .github/ README.md BEST_PRACTICES.md data_dictionary_meta.json .gitignore Whinfell_BasisWatch.html`

## Pages deploy

- Workflow: `.github/workflows/desk-preview-pages.yml` → `build_desk_preview.sh`
- Fallback: `main` branch `/docs` folder
- Verify: `cat docs/BUILD_STAMP.txt`
- **Private repo:** Pages requires GitHub Pro — see `documentation/DESK_URLS.md`

## Filename conventions

| Asset | Correct path |
|-------|----------------|
| Main console | `index.html` (not root monolith) |
| Hydration | `data/hydration/latest.json` → copied to `docs/data/hydration/` |
| Data dictionary meta | `data_dictionary_meta.json` (repo root) |
| User guide | `documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md` |
| BasisWatch standalone | `Whinfell_BasisWatch.html` |