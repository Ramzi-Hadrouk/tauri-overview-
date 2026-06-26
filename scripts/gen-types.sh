#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Generating TypeScript types from Rust structs..."
(cd src-tauri && cargo test --quiet 2>/dev/null)

echo "==> Copying to frontend..."
cp src-tauri/bindings/*.ts src/frontend/shared/types/generated/

echo "==> Done. $(ls src-tauri/bindings/*.ts | wc -l) types generated."
