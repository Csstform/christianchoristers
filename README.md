# Christian Choristers

Rebuild of [christianchoristers.com](https://christianchoristers.com): public marketing site + invite-only member app.

## Stack

- Next.js (App Router) + TypeScript
- Postgres (Drizzle ORM)
- Docker Compose (app + db for production; db-only compose for Cloud Agents)
- File uploads on droplet disk (`UPLOADS_DIR`)
- SMTP on droplet for invites / notifications

## Quick start (Cloud Agent / local)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d db
npm ci
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

The seed script prints an admin invite URL (set `SEED_ADMIN_EMAIL` in `.env`).

## Production (droplet)

```bash
cp .env.example .env   # fill SMTP_*, AUTH_SECRET, strong DB password, APP_BASE_URL
# Optional bot protection: TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY
# Set NODE_ENV=production so session cookies get the Secure flag
docker compose up -d --build
# Migrations run automatically on container start (scripts/run-migrate.mjs)
```

Point Cloudflare DNS at the droplet when ready to cut over from MediaServe/WordPress.

### Cloudflare Turnstile (login + password reset)

Create a Turnstile widget in the Cloudflare dashboard, then set both keys in `.env` (and restart the app). When unset, login works without a captcha.

### Backups

```bash
sudo mkdir -p /opt/backups/christianchoristers
sudo cp deploy/backup.sh /opt/christianchoristers/deploy/backup.sh
sudo chmod +x /opt/christianchoristers/deploy/backup.sh
# Daily 06:15 UTC
echo '15 6 * * * root APP_DIR=/opt/christianchoristers /opt/christianchoristers/deploy/backup.sh >> /var/log/choristers-backup.log 2>&1' \
  | sudo tee /etc/cron.d/christianchoristers-backup
```

## Routes

Public: `/`, `/music`, `/live-recordings`, `/login`, `/invite/[token]`

Member: `/app`, `/app/music`, `/app/calendar`, `/app/files`, `/app/suggestions`, `/app/admin`, `/app/admin/music`, `/app/admin/live-recordings`, `/app/admin/settings`

## Roles

Member → Manager → Director → Admin (see product handoff for capability matrix).

## Notes

- No public signup; admins invite users.
- Member music library supports active/archive repertoire, search, PDF + rehearsal audio uploads (managers+), and repertoire status changes (directors+).
- Public `/music` catalog (Spotify embeds, CD links, optional local audio) is managed by managers+ at `/app/admin/music`.
- File vault supports shared upload/download with type validation; managers+ upload/delete, all members download.
- Program calendar supports manager program CRUD and member RSVPs (coming/practice/programs/housing/notes) visible to all members.
- Announcements support manager posts with optional email to active members.
- Song suggestions support member proposals (link or file) and director review statuses.
- Compose is the shared runtime shape for Cloud Agents and the droplet.
