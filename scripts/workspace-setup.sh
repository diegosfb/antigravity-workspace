#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/diegosfb/antigravity-workspace"
TMP_DIR="$(mktemp -d -t antigravity-workspace-setup.XXXXXX)"
SRC_DIR="${TMP_DIR}/repo"
DEST_DIR="$(pwd)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

if ! command -v git >/dev/null 2>&1; then
  echo "git is required to run workspace-setup." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required to run workspace-setup." >&2
  exit 1
fi

git clone --depth 1 "${REPO_URL}" "${SRC_DIR}" >/dev/null

# Sync the entire repo without overwriting existing local files.
rsync -a --ignore-existing \
  --exclude ".git" \
  --exclude ".agent/global-config" \
  "${SRC_DIR}/" "${DEST_DIR}/"

echo "workspace-setup: copied missing files from ${REPO_URL}"
