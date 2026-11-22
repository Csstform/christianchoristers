import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { liveRecordings } from "@/db/schema";
import { liveRecordings as seedLiveRecordings } from "@/data/public-catalog";

export type LiveRecordingRow = typeof liveRecordings.$inferSelect;

let seedPromise: Promise<void> | null = null;

export async function ensureLiveRecordingsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db
        .select({ id: liveRecordings.id })
        .from(liveRecordings)
        .limit(1);
      if (existing.length > 0) return;

      await db.insert(liveRecordings).values(
        seedLiveRecordings.map((item, index) => ({
          title: item.title,
          location: item.location,
          recordedYear: item.year,
          youtubeUrl: item.youtubeUrl,
          sortOrder: index + 1,
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

export async function listAllLiveRecordings(): Promise<LiveRecordingRow[]> {
  await ensureLiveRecordingsSeeded();
  return db
    .select()
    .from(liveRecordings)
    .orderBy(asc(liveRecordings.sortOrder), asc(liveRecordings.title));
}

export async function listPublishedLiveRecordings(): Promise<
  LiveRecordingRow[]
> {
  await ensureLiveRecordingsSeeded();
  return db
    .select()
    .from(liveRecordings)
    .where(eq(liveRecordings.published, true))
    .orderBy(asc(liveRecordings.sortOrder), asc(liveRecordings.title));
}

export async function getLiveRecording(
  id: string,
): Promise<LiveRecordingRow | null> {
  await ensureLiveRecordingsSeeded();
  const [row] = await db
    .select()
    .from(liveRecordings)
    .where(eq(liveRecordings.id, id))
    .limit(1);
  return row ?? null;
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

export async function createLiveRecording(input: {
  title: string;
  location?: string;
  recordedYear?: number | null;
  youtubeUrl?: string;
  sortOrder: number;
  published: boolean;
}): Promise<LiveRecordingRow> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");

  const [row] = await db
    .insert(liveRecordings)
    .values({
      title,
      location: input.location?.trim() || null,
      recordedYear: input.recordedYear ?? null,
      youtubeUrl: parseOptionalUrl(input.youtubeUrl ?? "", "YouTube URL"),
      sortOrder: Math.trunc(input.sortOrder),
      published: input.published,
    })
    .returning();
  return row;
}

export async function updateLiveRecording(
  id: string,
  input: {
    title: string;
    location?: string;
    recordedYear?: number | null;
    youtubeUrl?: string;
    sortOrder: number;
    published: boolean;
  },
): Promise<LiveRecordingRow> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");

  const [row] = await db
    .update(liveRecordings)
    .set({
      title,
      location: input.location?.trim() || null,
      recordedYear: input.recordedYear ?? null,
      youtubeUrl: parseOptionalUrl(input.youtubeUrl ?? "", "YouTube URL"),
      sortOrder: Math.trunc(input.sortOrder),
      published: input.published,
    })
    .where(eq(liveRecordings.id, id))
    .returning();
  if (!row) throw new Error("Live recording not found.");
  return row;
}

export async function deleteLiveRecording(
  id: string,
): Promise<LiveRecordingRow | null> {
  const [row] = await db
    .delete(liveRecordings)
    .where(eq(liveRecordings.id, id))
    .returning();
  return row ?? null;
}
