#!/usr/bin/env bash
# Publish static site to isolated gh-pages branch — never commits to main.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="gh-pages"
PAGES_URL="https://clark-cmyk.github.io/Whinfell_Transmission_Control/"
SKIP_DATA="${WHINFELL_PUBLISH_SKIP_DATA:-0}"
SKIP_BACKUP="${WHINFELL_PUBLISH_SKIP_BACKUP:-0}"
WITH_COLLECT="${WHINFELL_PUBLISH_COLLECT:-0}"

cd "$ROOT"

echo "==> publish_ghpages: pre-flight (main worktree untouched)"
git status -sb

if [[ "$WITH_COLLECT" == "1" ]]; then
  echo "==> publish_ghpages: full collect + hydration chain"
  bash "${ROOT}/scripts/morning_auto_collect.sh"
elif [[ "$SKIP_DATA" != "1" ]]; then
  echo "==> publish_ghpages: sync live desk data (fast path)"
  bash "${ROOT}/scripts/sync_live_desk_data.sh" || {
    echo "WARN: sync_live_desk_data incomplete — continuing with available data" >&2
  }
fi

bash "${ROOT}/scripts/build_web.sh"

if [[ "$SKIP_BACKUP" != "1" ]]; then
  bash "${ROOT}/scripts/backup_web_bundle.sh" "${ROOT}/dist" || true
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$REMOTE_URL" ]]; then
  echo "publish_ghpages: ERROR — no git remote origin" >&2
  exit 1
fi

DEPLOY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/whinfell-ghpages-XXXXXX")"
cleanup() { rm -rf "$DEPLOY_DIR"; }
trap cleanup EXIT

echo "==> publish_ghpages: stage dist/ in temp deploy dir"
rsync -a --delete "${ROOT}/dist/" "${DEPLOY_DIR}/"
touch "${DEPLOY_DIR}/.nojekyll"

cd "$DEPLOY_DIR"
git init -q
git checkout -q -b "${BRANCH}"
git add -A
STAMP="$(date -u +"%Y-%m-%dT%H:%MZ")"
git commit -q -m "web publish ${STAMP}"

git remote add origin "$REMOTE_URL"
echo "==> publish_ghpages: push origin/${BRANCH}"
git push -f origin "${BRANCH}"
echo "publish_ghpages: pushed origin/${BRANCH}"

echo ""
echo "==> Published: ${PAGES_URL}"
if [[ -f "${ROOT}/dist/BUILD_MANIFEST.json" ]]; then
  python3 - <<PY
import json
with open("${ROOT}/dist/BUILD_MANIFEST.json", encoding="utf-8") as f:
    m = json.load(f)
print(f"    Last updated: {m.get('published_at', '?')} · hydration {m.get('hydration_version', '?')}")
PY
fi
echo "    Enable Pages once: Settings → Pages → Branch gh-pages / (root)"