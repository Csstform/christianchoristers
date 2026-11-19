import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { songAssets, songs } from "@/db/schema";

export type SongAssetKind = "sheet_pdf" | "rehearsal_audio";

export async function listSongs(input: {
  status: "active" | "archive";
  query?: string;
}) {
  const filters = [eq(songs.status, input.status)];
  const q = input.query?.trim();
  if (q) {
    filters.push(
      or(ilike(songs.title, `%${q}%`), ilike(songs.notes, `%${q}%`))!,
    );
  }

  const rows = await db
    .select()
    .from(songs)
    .where(and(...filters))
    .orderBy(asc(songs.title));

  const assets = rows.length
    ? await db
        .select()
        .from(songAssets)
        .where(
          inArray(
            songAssets.songId,
            rows.map((song) => song.id),
          ),
        )
        .orderBy(asc(songAssets.createdAt))
    : [];

  const bySong = new Map<string, typeof assets>();
  for (const asset of assets) {
    const list = bySong.get(asset.songId) ?? [];
    list.push(asset);
    bySong.set(asset.songId, list);
  }

  return rows.map((song) => ({
    ...song,
    assets: bySong.get(song.id) ?? [],
  }));
}

export async function getSong(id: string) {
  const song = await db.query.songs.findFirst({
    where: eq(songs.id, id),
  });
  if (!song) return null;
  const assets = await db
    .select()
    .from(songAssets)
    .where(eq(songAssets.songId, id))
    .orderBy(asc(songAssets.createdAt));
  return { ...song, assets };
}

export async function createSong(input: {
  title: string;
  notes?: string;
  status?: "active" | "archive";
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");

  const [song] = await db
    .insert(songs)
    .values({
      title,
      notes: input.notes?.trim() || null,
      status: input.status ?? "active",
    })
    .returning();
  return song;
}

export async function updateSongStatus(
  id: string,
  status: "active" | "archive",
) {
  const [song] = await db
    .update(songs)
    .set({ status, updatedAt: new Date() })
    .where(eq(songs.id, id))
    .returning();
  if (!song) throw new Error("Song not found.");
  return song;
}

export async function updateSongDetails(
  id: string,
  input: { title: string; notes?: string },
) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  const [song] = await db
    .update(songs)
    .set({
      title,
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(songs.id, id))
    .returning();
  if (!song) throw new Error("Song not found.");
  return song;
}

export async function addSongAsset(input: {
  songId: string;
  kind: SongAssetKind;
  label?: string;
  storagePath: string;
  mimeType?: string;
}) {
  const [asset] = await db
    .insert(songAssets)
    .values({
      songId: input.songId,
      kind: input.kind,
      label: input.label?.trim() || null,
      storagePath: input.storagePath,
      mimeType: input.mimeType || null,
    })
    .returning();
  return asset;
}

export async function getSongAsset(id: string) {
  const [asset] = await db
    .select()
    .from(songAssets)
    .where(eq(songAssets.id, id))
    .limit(1);
  return asset ?? null;
}

export async function deleteSongAsset(id: string) {
  const [asset] = await db
    .delete(songAssets)
    .where(eq(songAssets.id, id))
    .returning();
  return asset ?? null;
}

export async function deleteSong(id: string) {
  const [song] = await db.delete(songs).where(eq(songs.id, id)).returning();
  return song ?? null;
}

export async function countActiveSongs() {
  const rows = await db
    .select()
    .from(songs)
    .where(eq(songs.status, "active"))
    .orderBy(desc(songs.updatedAt));
  return rows.length;
}
