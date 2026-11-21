import { access, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { albums } from "@/db/schema";
import { albums as seedAlbums } from "@/data/public-catalog";
import {
  maxUploadBytes,
  validateAndCanonicalizeUpload,
} from "@/lib/file-validation";
import {
  absoluteUploadPath,
  ensureUploadsRoot,
  uploadsRoot,
} from "@/lib/storage";

export type CatalogAlbum = typeof albums.$inferSelect;

export type PublicAlbum = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  spotifyUrl: string | null;
  cdUrl: string | null;
  localAudioPath: string | null;
  published: boolean;
  sortOrder: number;
};

function coverImageFor(row: CatalogAlbum): string {
  if (row.coverPath?.startsWith("/")) return row.coverPath;
  return `/album-covers/${row.slug}.jpg`;
}

export function toPublicAlbum(row: CatalogAlbum): PublicAlbum {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    coverImage: coverImageFor(row),
    spotifyUrl: row.spotifyUrl,
    cdUrl: row.cdUrl,
    localAudioPath: row.localAudioPath,
    published: row.published,
    sortOrder: row.sortOrder,
  };
}

let seedPromise: Promise<void> | null = null;

/** Insert the hard-coded catalog once when the albums table is empty. */
export async function ensureAlbumsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: albums.id }).from(albums).limit(1);
      if (existing.length > 0) return;

      await db.insert(albums).values(
        seedAlbums.map((album, index) => ({
          slug: album.slug,
          title: album.title,
          sortOrder: index + 1,
          spotifyUrl: album.spotifyUrl,
          cdUrl: album.cdUrl,
          localAudioPath: album.localAudioPath,
          coverPath: album.coverImage,
          published: true,
        })),
      );
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;
}

export async function listAllAlbums(): Promise<PublicAlbum[]> {
  await ensureAlbumsSeeded();
  const rows = await db.select().from(albums).orderBy(asc(albums.sortOrder), asc(albums.title));
  return rows.map(toPublicAlbum);
}

export async function listPublishedAlbums(): Promise<PublicAlbum[]> {
  await ensureAlbumsSeeded();
  const rows = await db
    .select()
    .from(albums)
    .where(eq(albums.published, true))
    .orderBy(asc(albums.sortOrder), asc(albums.title));
  return rows.map(toPublicAlbum);
}

export async function getAlbumById(id: string): Promise<PublicAlbum | null> {
  await ensureAlbumsSeeded();
  const [row] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  return row ? toPublicAlbum(row) : null;
}

export async function getAlbumBySlug(slug: string): Promise<PublicAlbum | null> {
  await ensureAlbumsSeeded();
  const [row] = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
  return row ? toPublicAlbum(row) : null;
}

function parseOptionalUrl(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must start with http:// or https://.`);
  }
  return parsed.toString();
}

export async function updateAlbumStreaming(
  id: string,
  input: {
    title: string;
    spotifyUrl: string;
    cdUrl: string;
    sortOrder: number;
    published: boolean;
    clearLocalAudio?: boolean;
  },
): Promise<PublicAlbum> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  if (!Number.isFinite(input.sortOrder)) {
    throw new Error("Sort order must be a number.");
  }

  const existing = await getAlbumById(id);
  if (!existing) throw new Error("Album not found.");

  let localAudioPath = existing.localAudioPath;
  if (input.clearLocalAudio) {
    if (existing.localAudioPath) {
      try {
        await unlink(absoluteUploadPath(existing.localAudioPath));
      } catch {
        // File may already be gone.
      }
    }
    localAudioPath = null;
  }

  const [row] = await db
    .update(albums)
    .set({
      title,
      spotifyUrl: parseOptionalUrl(input.spotifyUrl, "Spotify URL"),
      cdUrl: parseOptionalUrl(input.cdUrl, "CD / MP3 URL"),
      sortOrder: Math.trunc(input.sortOrder),
      published: input.published,
      localAudioPath,
    })
    .where(eq(albums.id, id))
    .returning();

  if (!row) throw new Error("Album not found.");
  return toPublicAlbum(row);
}

/** Save uploaded album audio as albums/<slug>.<ext> and point localAudioPath at it. */
export async function saveAlbumLocalAudio(input: {
  albumId: string;
  filename: string;
  buffer: Buffer;
}): Promise<PublicAlbum> {
  const album = await getAlbumById(input.albumId);
  if (!album) throw new Error("Album not found.");

  if (input.buffer.length > maxUploadBytes()) {
    throw new Error("File is too large (25MB max).");
  }

  const { mimeType, safeFilename } = validateAndCanonicalizeUpload({
    kind: "rehearsal_audio",
    filename: input.filename,
    buffer: input.buffer,
  });
  void mimeType;
  void safeFilename;

  const ext = path.extname(input.filename).toLowerCase() || ".mp3";
  const relative = `albums/${album.slug}${ext}`;
  await ensureUploadsRoot();
  const absolute = path.join(uploadsRoot(), relative);
  await mkdir(path.dirname(absolute), { recursive: true });

  if (album.localAudioPath && album.localAudioPath !== relative) {
    try {
      await unlink(absoluteUploadPath(album.localAudioPath));
    } catch {
      // Ignore missing previous file.
    }
  }

  await writeFile(absolute, input.buffer);

  const [row] = await db
    .update(albums)
    .set({ localAudioPath: relative })
    .where(eq(albums.id, input.albumId))
    .returning();
  if (!row) throw new Error("Album not found.");
  return toPublicAlbum(row);
}

export async function localAlbumAudioAvailable(
  album: Pick<PublicAlbum, "localAudioPath">,
): Promise<boolean> {
  if (!album.localAudioPath) return false;
  const safe = safeAlbumAudioPath(album.localAudioPath);
  if (!safe) return false;
  try {
    await access(absoluteUploadPath(safe));
    return true;
  } catch {
    return false;
  }
}

const AUDIO_EXT_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

/** Reject path traversal; only allow files under the albums/ uploads prefix. */
export function safeAlbumAudioPath(relative: string): string | null {
  const normalized = relative.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("albums/")) return null;
  if (normalized.includes("..") || path.isAbsolute(normalized)) return null;
  const ext = path.extname(normalized).toLowerCase();
  if (!AUDIO_EXT_MIME[ext]) return null;
  return normalized;
}

export function contentTypeForAlbumAudio(storagePath: string): string {
  return (
    AUDIO_EXT_MIME[path.extname(storagePath).toLowerCase()] ||
    "application/octet-stream"
  );
}
