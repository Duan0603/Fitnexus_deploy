#!/bin/sh
set -e

echo "Checking backend node_modules and required packages..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/pg/index.js" ]; then
  echo "node_modules or pg missing. Installing dependencies (production)..."
  # Try deterministic install first
  if npm ci --omit=dev --no-audit --prefer-offline; then
    echo "npm ci completed"
  else
    echo "npm ci failed, falling back to npm install --omit=dev"
    npm install --omit=dev
  fi
else
  echo "node_modules and pg present"
fi

echo "Starting backend application"
echo "Running DB migrations (if any)..."
# Try to run migrations via npx; if sequelize-cli not available, install it temporarily and run
if npx --yes sequelize-cli db:migrate --url "$DATABASE_URL"; then
  echo "Migrations applied (or none to run)."
else
  echo "npx sequelize-cli failed; installing sequelize-cli temporarily and retrying..."
  npm install --no-save sequelize-cli
  npx --yes sequelize-cli db:migrate --url "$DATABASE_URL" || {
    echo "Migration failed. Exiting with error." >&2
    exit 1
  }
fi

echo "Starting server"
node ./bin/www
