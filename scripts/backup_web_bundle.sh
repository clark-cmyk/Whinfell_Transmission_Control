#!/usr/bin/env bash
# Optional Google Drive backup of latest web bundle — no-fail.
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "backup_web_bundle: skip — no dist directory" >&2
  exit 0
fi

DEST=""
if [[ -n "${WHINFELL_GDRIVE_BACKUP:-}" ]]; then
  DEST="${WHINFELL_GDRIVE_BACKUP}"
elif compgen -G "${HOME}/Library/CloudStorage/GoogleDrive"*/Whinfell_Web_Backup >/dev/null 2>&1; then
  DEST="$(ls -d "${HOME}"/Library/CloudStorage/GoogleDrive*/Whinfell_Web_Backup 2>/dev/null | head -1)"
elif [[ -d "${HOME}/Google Drive/Whinfell_Web_Backup" ]]; then
  DEST="${HOME}/Google Drive/Whinfell_Web_Backup"
fi

if [[ -z "$DEST" ]]; then
  echo "backup_web_bundle: no GDrive path — set WHINFELL_GDRIVE_BACKUP to enable"
  exit 0
fi

STAMP="$(date -u +"%Y%m%d_%H%M%S")"
ZIP_NAME="whinfell_web_${STAMP}.zip"
TMP_ZIP="${TMPDIR:-/tmp}/${ZIP_NAME}"

(
  cd "$SRC/.."
  zip -qr "$TMP_ZIP" "$(basename "$SRC")"
)

mkdir -p "$DEST"
cp "$TMP_ZIP" "${DEST}/${ZIP_NAME}"
rm -f "$TMP_ZIP"
echo "backup_web_bundle: copied → ${DEST}/${ZIP_NAME}"