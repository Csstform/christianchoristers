#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not installed; skipping compose db start"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  if command -v dockerd >/dev/null 2>&1; then
    sudo dockerd >/tmp/dockerd.log 2>&1 &
    for _ in $(seq 1 30); do
      if docker info >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
  fi
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose -f docker-compose.dev.yml up -d db

echo "Waiting for Postgres..."
for _ in $(seq 1 30); do
  if docker compose -f docker-compose.dev.yml exec -T db pg_isready -U choristers -d choristers >/dev/null 2>&1; then
    echo "Postgres is ready"
    break
  fi
  sleep 1
done

npm run db:migrate || true
