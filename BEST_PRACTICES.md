# Whinfell Transmission Control — Best Practices

**Last Updated**: 2026-07-03

## Repo hygiene

- **Never** `git add -A`.
- **Always** `git status -sb` before commit or publish.
- Ignored: `dist/`, `data/` (local symlinks + barchart cache).

## Publish workflow

```bash
git status -sb
bash scripts/publish.sh
git status -sb   # must be clean before push completes
```

`publish.sh` runs `build_desk_preview.sh`, copies `dist/` → `docs/`, stages only:
`docs/ index.html css/ js/ scripts/ .github/ README.md .gitignore BEST_PRACTICES.md Whinfell_BasisWatch.html`

## Pages deploy

- Workflow: `.github/workflows/desk-preview-pages.yml` deploys `dist/` artifact.
- Fallback: `main` branch `/docs` folder.
- Verify: `cat docs/BUILD_STAMP.txt` after publish.