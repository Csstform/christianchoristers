import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";

export async function listAnnouncements(limit?: number) {
  const query = db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      authorId: announcements.authorId,
      emailedAt: announcements.emailedAt,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .orderBy(desc(announcements.createdAt));

  if (limit && limit > 0) {
    return query.limit(limit);
  }
  return query;
}

export async function getAnnouncement(id: string) {
  const [row] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      authorId: announcements.authorId,
      emailedAt: announcements.emailedAt,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .where(eq(announcements.id, id))
    .limit(1);
  return row ?? null;
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  authorId: string;
}) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("Title is required.");
  if (!body) throw new Error("Body is required.");

  const [row] = await db
    .insert(announcements)
    .values({
      title,
      body,
      authorId: input.authorId,
    })
    .returning();
  return row;
}

export async function markAnnouncementEmailed(id: string, when = new Date()) {
  const [row] = await db
    .update(announcements)
    .set({ emailedAt: when, updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAnnouncement(id: string) {
  const [row] = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning();
  return row ?? null;
}

export async function listActiveMemberEmails() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(asc(users.name));
}
