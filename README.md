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
docker compose up -d --build
docker compose exec app npx drizzle-kit migrate   # or db:push on first bring-up
```

Point Cloudflare DNS at the droplet when ready to cut over from MediaServe/WordPress.

## Routes

Public: `/`, `/music`, `/live-recordings`, `/login`, `/invite/[token]`

Member: `/app`, `/app/music`, `/app/calendar`, `/app/files`, `/app/suggestions`, `/app/admin`

## Roles

Member → Manager → Director → Admin (see product handoff for capability matrix).

## Notes

- No public signup; admins invite users.
- Member music library supports active/archive repertoire, search, PDF + rehearsal audio uploads (managers+), and repertoire status changes (directors+).
- File vault supports shared upload/download with type validation; managers+ upload/delete, all members download.
- Concert calendar supports manager concert CRUD and member RSVPs (coming/practice/programs/housing/notes) visible to all members.
- Announcements support manager posts with optional email to active members.
- Remaining MVP slice: song suggestions.
- Compose is the shared runtime shape for Cloud Agents and the droplet.
