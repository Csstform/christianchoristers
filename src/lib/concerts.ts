import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { concerts, rsvps, users } from "@/db/schema";

export type YesNo = "yes" | "no";

export async function listConcerts() {
  return db.select().from(concerts).orderBy(asc(concerts.startsAt));
}

export async function listUpcomingConcerts() {
  return db
    .select()
    .from(concerts)
    .where(gte(concerts.startsAt, new Date()))
    .orderBy(asc(concerts.startsAt));
}

export async function listPastConcerts() {
  return db
    .select()
    .from(concerts)
    .where(lt(concerts.startsAt, new Date()))
    .orderBy(desc(concerts.startsAt));
}

export async function getConcert(id: string) {
  const [row] = await db.select().from(concerts).where(eq(concerts.id, id)).limit(1);
  return row ?? null;
}

export async function createConcert(input: {
  title: string;
  location?: string;
  startsAt: Date;
  endsAt?: Date | null;
  details?: string;
  createdById: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  if (Number.isNaN(input.startsAt.getTime())) {
    throw new Error("Start date/time is required.");
  }

  const [row] = await db
    .insert(concerts)
    .values({
      title,
      location: input.location?.trim() || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      details: input.details?.trim() || null,
      createdById: input.createdById,
    })
    .returning();
  return row;
}

export async function updateConcert(
  id: string,
  input: {
    title: string;
    location?: string;
    startsAt: Date;
    endsAt?: Date | null;
    details?: string;
  },
) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  if (Number.isNaN(input.startsAt.getTime())) {
    throw new Error("Start date/time is required.");
  }

  const [row] = await db
    .update(concerts)
    .set({
      title,
      location: input.location?.trim() || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      details: input.details?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(concerts.id, id))
    .returning();
  if (!row) throw new Error("Concert not found.");
  return row;
}

export async function deleteConcert(id: string) {
  const [row] = await db.delete(concerts).where(eq(concerts.id, id)).returning();
  return row ?? null;
}

export async function listRsvpsForConcert(concertId: string) {
  return db
    .select({
      id: rsvps.id,
      concertId: rsvps.concertId,
      userId: rsvps.userId,
      coming: rsvps.coming,
      practiceSaturday: rsvps.practiceSaturday,
      programSaturday: rsvps.programSaturday,
      programSunday: rsvps.programSunday,
      needHousing: rsvps.needHousing,
      housingDays: rsvps.housingDays,
      housingPeople: rsvps.housingPeople,
      notes: rsvps.notes,
      updatedAt: rsvps.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .where(eq(rsvps.concertId, concertId))
    .orderBy(asc(users.name));
}

export async function getUserRsvp(concertId: string, userId: string) {
  const [row] = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.concertId, concertId), eq(rsvps.userId, userId)))
    .limit(1);
  return row ?? null;
}

function parseYesNo(value: FormDataEntryValue | null, label: string): YesNo {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "yes" || raw === "no") return raw;
  throw new Error(`${label} must be yes or no.`);
}

export function rsvpInputFromForm(formData: FormData) {
  const coming = parseYesNo(formData.get("coming"), "Coming");
  const practiceSaturday = parseYesNo(
    formData.get("practiceSaturday"),
    "Practice Saturday",
  );
  const programSaturday = parseYesNo(
    formData.get("programSaturday"),
    "Program Saturday",
  );
  const programSunday = parseYesNo(
    formData.get("programSunday"),
    "Program Sunday",
  );
  const needHousing = parseYesNo(formData.get("needHousing"), "Need housing");
  const housingDays = String(formData.get("housingDays") ?? "").trim();
  const housingPeopleRaw = String(formData.get("housingPeople") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  let housingPeople: number | null = null;
  if (needHousing === "yes") {
    if (!housingDays) {
      throw new Error("Housing days are required when housing is needed.");
    }
    housingPeople = Number(housingPeopleRaw || "0");
    if (!Number.isInteger(housingPeople) || housingPeople < 1) {
      throw new Error("Housing people must be a whole number of at least 1.");
    }
  }

  return {
    coming,
    practiceSaturday,
    programSaturday,
    programSunday,
    needHousing,
    housingDays: needHousing === "yes" ? housingDays : null,
    housingPeople: needHousing === "yes" ? housingPeople : null,
    notes: notes || null,
  };
}

export async function upsertRsvp(input: {
  concertId: string;
  userId: string;
  coming: YesNo;
  practiceSaturday: YesNo;
  programSaturday: YesNo;
  programSunday: YesNo;
  needHousing: YesNo;
  housingDays?: string | null;
  housingPeople?: number | null;
  notes?: string | null;
}) {
  const existing = await getUserRsvp(input.concertId, input.userId);
  if (existing) {
    const [row] = await db
      .update(rsvps)
      .set({
        coming: input.coming,
        practiceSaturday: input.practiceSaturday,
        programSaturday: input.programSaturday,
        programSunday: input.programSunday,
        needHousing: input.needHousing,
        housingDays: input.housingDays ?? null,
        housingPeople: input.housingPeople ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(rsvps.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(rsvps)
    .values({
      concertId: input.concertId,
      userId: input.userId,
      coming: input.coming,
      practiceSaturday: input.practiceSaturday,
      programSaturday: input.programSaturday,
      programSunday: input.programSunday,
      needHousing: input.needHousing,
      housingDays: input.housingDays ?? null,
      housingPeople: input.housingPeople ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export function formatConcertWhen(startsAt: Date, endsAt?: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "America/Detroit",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const start = startsAt.toLocaleString("en-US", opts);
  if (!endsAt) return start;
  return `${start} – ${endsAt.toLocaleString("en-US", {
    timeZone: "America/Detroit",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function toDatetimeLocalValue(date: Date): string {
  // Render in America/Detroit for form inputs
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromDatetimeLocalValue(value: string): Date {
  // Interpret form datetime-local as America/Detroit wall time
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return new Date(Number.NaN);
  const [, y, m, d, hh, mm] = match;
  // Approximate via locale formatter inverse using Date in UTC offset guess:
  // Build an ISO string with fixed -05:00/-04:00 is hard; use temporal-less approach:
  // Create a Date from the parts as if local VM, then adjust by Detroit offset.
  const asUtc = Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
  );
  const probe = new Date(asUtc);
  const detroit = new Date(
    probe.toLocaleString("en-US", { timeZone: "America/Detroit" }),
  );
  const utc = new Date(probe.toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = detroit.getTime() - utc.getTime();
  return new Date(asUtc - offset);
}
