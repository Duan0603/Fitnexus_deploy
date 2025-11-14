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
node ./bin/www
