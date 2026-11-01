#!/bin/sh
set -e

echo "==> [HonarHub] Checking database connection and running Prisma sync..."

if [ -n "$DATABASE_URL" ]; then
  if command -v prisma >/dev/null 2>&1; then
    prisma db push --schema=prisma/schema.prisma --skip-generate || echo "Warning: prisma db push failed, continuing startup..."
  elif [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma db push --schema=prisma/schema.prisma --skip-generate || echo "Warning: ./node_modules/.bin/prisma db push failed, continuing startup..."
  else
    npx prisma db push --schema=prisma/schema.prisma --skip-generate || echo "Warning: npx prisma db push failed, continuing startup..."
  fi
else
  echo "Notice: DATABASE_URL is not set, skipping prisma db push."
fi

echo "==> [HonarHub] Ensuring uploads directories exist..."
mkdir -p ./public/uploads/artists ./public/uploads/products ./public/uploads/support ./public/uploads/blog 2>/dev/null || true

echo "==> [HonarHub] Starting Next.js application server..."
exec node server.js
