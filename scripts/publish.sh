#!/usr/bin/env bash
# Build + publish dist/ to docs/ for GitHub Pages (if repo is initialized).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "${ROOT}/scripts/build.sh"

rm -rf docs
cp -R dist docs
touch docs/.nojekyll

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "publish: not a git repo — built docs/ only (no push)."
  echo "  Preview: cd $ROOT && python3 -m http.server 8765"
  echo "  Open:    http://localhost:8765/"
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

git add docs/ index.html css/ js/ scripts/ .github/ README.md .gitignore
if git diff --cached --quiet; then
  echo "publish: nothing to commit — already up to date."
  exit 0
fi

git commit -m "desk preview: disaggregated TC $(date -u +%Y-%m-%dT%H:%MZ)"
git push origin HEAD
echo "publish: pushed — GitHub Actions will redeploy Pages if workflow is configured."