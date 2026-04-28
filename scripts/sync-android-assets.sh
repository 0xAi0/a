#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT_DIR/android/app/src/main/assets/web"

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$ROOT_DIR/index.html" "$ROOT_DIR/css" "$ROOT_DIR/js" "$DEST"

echo "Synced web assets to $DEST"
