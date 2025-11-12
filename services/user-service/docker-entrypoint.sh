#!/bin/sh
set -e

# # Install deps if node_modules is missing or empty
# if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
#   echo "[user-service] Installing dependencies..."
#   npm install
#   # Optional: mark installation
#   touch node_modules/.deps-installed
# else
#   echo "[user-service] node_modules already populated."
# fi

# if [ ! -d node_modules ] || [ ! -f node_modules/sqlite3/package.json ]; then
#   echo "[user-service] Installing dependencies..."
#   npm install
# fi

# Rebuild TypeScript on startup (for development with bind mounts)
if [ "$NODE_ENV" = "development" ]; then
  echo "[user-service] Rebuilding TypeScript..."
  npm run build
fi

echo "[user-service] Running database migrations..."
npm run migration:up || { echo "[user-service] Migration failed"; exit 1; }

exec "$@"