#!/bin/sh
set -e

# Install deps if node_modules is missing or empty
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[gateway-service] Installing dependencies..."
  npm install
else
  echo "[gateway-service] node_modules already populated."
fi

exec "$@"