#!/bin/sh
set -eu

echo "[entrypoint] Applying database migrations…"
node /app/scripts/run-migrate.mjs

echo "[entrypoint] Starting Next.js…"
exec npm run start
