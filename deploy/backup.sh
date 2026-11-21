#!/usr/bin/env bash
# Nightly backup of Postgres + uploads for Christian Choristers.
# Install on droplet: copy to /opt/christianchoristers/deploy/backup.sh and cron daily.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/christianchoristers}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/backups/christianchoristers}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${BACKUP_ROOT}/${STAMP}"

mkdir -p "${DEST}"

cd "${APP_DIR}"

# Read simple KEY=value lines (avoid `source` — SMTP_FROM may contain <...>)
env_get() {
  local key="$1" default="$2" line
  line="$(grep -E "^${key}=" "${APP_DIR}/.env" 2>/dev/null | tail -1 || true)"
  if [[ -z "${line}" ]]; then
    printf '%s' "${default}"
    return
  fi
  printf '%s' "${line#*=}"
}

POSTGRES_USER="$(env_get POSTGRES_USER choristers)"
POSTGRES_DB="$(env_get POSTGRES_DB choristers)"

echo "[backup] ${STAMP} starting → ${DEST}"

docker compose exec -T db pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists \
  | gzip -c > "${DEST}/postgres.sql.gz"

UPLOADS_VOLUME="$(docker volume ls -q --filter name=christianchoristers_uploads | head -1)"
if [[ -n "${UPLOADS_VOLUME}" ]]; then
  docker run --rm \
    -v "${UPLOADS_VOLUME}:/data:ro" \
    -v "${DEST}:/backup" \
    alpine:3.20 \
    tar -czf /backup/uploads.tar.gz -C /data .
else
  echo "[backup] warning: uploads volume not found; skipping uploads archive" >&2
fi

# Drop old backups
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime "+${KEEP_DAYS}" -exec rm -rf {} +

echo "[backup] ${STAMP} done ($(du -sh "${DEST}" | cut -f1))"
