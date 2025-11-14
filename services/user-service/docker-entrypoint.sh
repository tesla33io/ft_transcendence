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
  # Check if watch mode is enabled
  if [ "$TS_WATCH" = "1" ]; then
    echo "[user-service] TypeScript watch mode enabled - skipping build"
    echo "[user-service] Note: Use 'npm run build' manually or set up a separate watch process"
  else
    echo "[user-service] Rebuilding TypeScript..."
    if ! npm run build; then
      echo "[user-service] ❌ TypeScript build failed!"
      echo "[user-service] Check the error messages above for details"
      exit 1
    fi
    echo "[user-service] ✅ TypeScript build successful"
  fi
fi

echo "[user-service] Running database migrations..."
if ! npm run migration:up; then
  echo "[user-service] ❌ Migration failed!"
  echo "[user-service] Check the error messages above for details"
  exit 1
fi
echo "[user-service] ✅ Migrations completed"

exec "$@"