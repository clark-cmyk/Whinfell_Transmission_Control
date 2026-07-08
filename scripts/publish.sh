#!/usr/bin/env bash
# DEPRECATED — use publish_ghpages.sh (isolated gh-pages branch; main untouched).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "publish.sh is deprecated — redirecting to publish_ghpages.sh" >&2
echo "  (gh-pages branch only; main branch and working tree stay untouched)" >&2
echo "" >&2

exec bash "${ROOT}/scripts/publish_ghpages.sh" "$@"