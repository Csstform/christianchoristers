import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { songSuggestions, users } from "@/db/schema";

export type SuggestionStatus =
  | "submitted"
  | "reviewing"
  | "accepted"
  | "declined";

export async function listSuggestions() {
  const submitter = db
    .select({
      id: songSuggestions.id,
      title: songSuggestions.title,
      notes: songSuggestions.notes,
      linkOrPath: songSuggestions.linkOrPath,
      status: songSuggestions.status,
      submittedById: songSuggestions.submittedById,
      reviewedById: songSuggestions.reviewedById,
      createdAt: songSuggestions.createdAt,
      updatedAt: songSuggestions.updatedAt,
      submitterName: users.name,
    })
    .from(songSuggestions)
    .innerJoin(users, eq(songSuggestions.submittedById, users.id))
    .orderBy(desc(songSuggestions.createdAt), asc(songSuggestions.title));

  return submitter;
}

export async function getSuggestion(id: string) {
  const [row] = await db
    .select()
    .from(songSuggestions)
    .where(eq(songSuggestions.id, id))
    .limit(1);
  return row ?? null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeSuggestionLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (!isHttpUrl(value)) {
    throw new Error("Link must be a valid http(s) URL.");
  }
  return value;
}

export function isStoredSuggestionFile(linkOrPath: string | null): boolean {
  return Boolean(linkOrPath?.startsWith("suggestions/"));
}

export async function createSuggestion(input: {
  title: string;
  notes?: string;
  linkOrPath?: string | null;
  submittedById: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");

  const [row] = await db
    .insert(songSuggestions)
    .values({
      title,
      notes: input.notes?.trim() || null,
      linkOrPath: input.linkOrPath ?? null,
      submittedById: input.submittedById,
      status: "submitted",
    })
    .returning();
  return row;
}

export async function updateSuggestionStatus(input: {
  id: string;
  status: SuggestionStatus;
  reviewedById: string;
}) {
  const allowed: SuggestionStatus[] = [
    "submitted",
    "reviewing",
    "accepted",
    "declined",
  ];
  if (!allowed.includes(input.status)) {
    throw new Error("Invalid status.");
  }

  const [row] = await db
    .update(songSuggestions)
    .set({
      status: input.status,
      reviewedById: input.reviewedById,
      updatedAt: new Date(),
    })
    .where(eq(songSuggestions.id, input.id))
    .returning();
  if (!row) throw new Error("Suggestion not found.");
  return row;
}

export async function deleteSuggestion(id: string) {
  const [row] = await db
    .delete(songSuggestions)
    .where(eq(songSuggestions.id, id))
    .returning();
  return row ?? null;
}
