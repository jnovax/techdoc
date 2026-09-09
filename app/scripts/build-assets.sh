#!/usr/bin/env bash
set -euo pipefail

# TechDoc Modern Asset Builder (Rspack + SWC + LightningCSS)
# Supports both host execution and container execution without host node_modules

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Building TechDoc frontend assets with Rspack..."

if command -v rspack &> /dev/null; then
  echo "--> Using host rspack..."
  cd "${APP_DIR}"
  rspack build --config rspack.prod.js
elif [ -f "${APP_DIR}/node_modules/.bin/rspack" ]; then
  echo "--> Using local node_modules rspack..."
  cd "${APP_DIR}"
  ./node_modules/.bin/rspack build --config rspack.prod.js
else
  # Container execution (Podman / Docker)
  CONTAINER_CMD=""
  if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
  elif command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
  fi

  if [ -n "${CONTAINER_CMD}" ]; then
    echo "--> No host node_modules found. Running build in ${CONTAINER_CMD} container (node:22-alpine)..."
    ${CONTAINER_CMD} run --rm \
      -v "${APP_DIR}:/app:z" \
      -w /app \
      node:22-alpine \
      sh -c "npm install --include=dev && npx rspack build --config rspack.prod.js"
  else
    echo "Error: Neither rspack nor podman/docker found. Please install @rspack/cli or run with podman/docker." >&2
    exit 1
  fi
fi

echo "==> Build complete! Assets generated in public/build and public/views/build."
