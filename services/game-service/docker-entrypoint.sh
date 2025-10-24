#!/bin/sh
set -e

# Install deps if node_modules is missing or empty
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[game-service] Installing dependencies..."
  npm install
  # Optional: mark installation
  touch node_modules/.deps-installed
else
  echo "[game-service] node_modules already populated."
fi

exec "$@"