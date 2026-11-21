# Content pass: live WordPress → rebuild

Scraped `christianchoristers.com` from the droplet (2026-11-21, America/Detroit) after Cloudflare blocked agent-side curl. Compared to this repo’s public routes.

## Live public IA

| Live URL | Rebuild |
|----------|---------|
| `/` Home | `/` — copy now aligned; streaming links added |
| `/music/` | `/music` — **ahead** of live (8 CDs + Melt the Heart + local stream) |
| `/live-recordings/` | `/live-recordings` — same 3 events with embeds |
| `/membership-login/` | `/login` |
| `/member-homepage/` | `/app` (members) |
| `/sheet-music/` | `/app/music` (member repertoire) |
| Password reset | `/forgot-password` + `/reset-password/[token]` |
| Profile | **Not built** |

No separate About, Contact, or Schedule pages appear in the live main menu.

## Home

**Live has, rebuild now matches:**
- 1959 founding / ACC ministry lede
- Song vignette paragraph (In the Lord Alone / I’m Feeling Fine / Sweet Beulah Land)
- Streaming callout (iTunes, YouTube Music, Spotify) with artist links

**Live “Program Schedule”:** heading only in WordPress HTML. Rebuild now surfaces upcoming `/app/calendar` concerts on the public home page as schedule cards (title, when, location).

## Music

| Item | Live | Rebuild |
|------|------|---------|
| Spotify embeds | He Is the Amen; Proclaim the Glory of the Lord | Same two + CD links for all eight |
| Remaining six albums | Not on public music page | Listed with Melt the Heart purchase links; Count Me In can local-stream |
| “Our Back Catalog” title | Yes | Yes |

**Cover art:** added under `public/album-covers/` (from Melt the Heart product images).

**Still optional:** Spotify (or other) embeds for the six non-Spotify titles when URLs exist.

## Live recordings

Parity: North Phoenix 2019, Union City 2011, Norton 50th Reunion 2009 — titles/locations/years and YouTube targets already in `src/data/public-catalog.ts`.

## Brand / chrome

| Asset | Status |
|-------|--------|
| Favicon (ChoristersFavicon 32/180/192) | Added under `public/` + `src/app/icon.png` / `apple-icon.png` |
| Choir cover photo (2025 home image) | Added as full-bleed `/hero-choir.jpg` on rebuild home |
| Header logo (`Artboard-1@2x`) | Restored as `/brand-logo.png` in the public header (transparent ink + white over hero) |
| Footer tagline | Rebuild has short tagline; live also cites streaming platforms on home |

## Member features (live → rebuild)

Already covered by the member app: music archive, vault/files, calendar/RSVP, announcements, suggestions, admin invites. Live password-reset/profile remain gaps.

## Recommended next content work

1. Publish real **program/concert** dates (public page or surface upcoming from `/app/calendar`).
2. Add **album artwork** on `/music`.
3. **Password reset** for members.
4. When cutting over the apex domain, keep this favicon set and re-check streaming links.
