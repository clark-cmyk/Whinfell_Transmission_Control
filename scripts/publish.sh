#!/usr/bin/env bash
# Build + publish dist/ → docs/ for GitHub Pages. Targeted git add only — never git add -A.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "publish: pre-flight status"
git status -sb

bash "${ROOT}/scripts/build_desk_preview.sh"

rm -rf docs
cp -R dist docs
touch docs/.nojekyll

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "publish: not a git repo — built docs/ only (no push)."
  exit 0
fi

REMOTE="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$REMOTE" ]]; then
  REPO_SLUG=$(echo "$REMOTE" | sed -E 's#^.*github.com[/:]([^/]+/[^/.]+)(\.git)?$#\1#')
  PAGES_URL="https://${REPO_SLUG%%/*}.github.io/${REPO_SLUG##*/}/"
  echo "publish: Pages URL → ${PAGES_URL}"

  if command -v gh >/dev/null 2>&1; then
    gh api "repos/${REPO_SLUG}/pages" --silent 2>/dev/null || \
      gh api -X POST "repos/${REPO_SLUG}/pages" -f build_type=workflow 2>/dev/null || true
  fi
fi

# Targeted add only (BEST_PRACTICES — no git add -A)
git add \
  docs/ \
  index.html \
  css/ \
  js/ \
  scripts/ \
  .github/ \
  README.md \
  BEST_PRACTICES.md \
  .gitignore \
  Whinfell_BasisWatch.html

if git diff --cached --quiet; then
  echo "publish: nothing to commit — already up to date."
else
  git commit -m "desk preview: TC $(date -u +%Y-%m-%dT%H:%MZ)"
fi

if ! git diff --quiet || [[ -n "$(git status --porcelain)" ]]; then
  echo "publish: ERROR — working tree not clean after commit:" >&2
  git status -sb >&2
  exit 1
fi

git pull --rebase origin main
git push origin HEAD
echo "publish: pushed — clean working tree confirmed."