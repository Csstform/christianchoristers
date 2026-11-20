"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createConcert,
  deleteConcert,
  fromDatetimeLocalValue,
  getConcert,
  rsvpInputFromForm,
  updateConcert,
  upsertRsvp,
} from "@/lib/concerts";
import { canManageConcerts } from "@/lib/roles";

export type ConcertActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageConcerts(user.role)) {
    throw new Error("Managers and above can manage concerts.");
  }
  return user;
}

export async function createConcertAction(
  _prev: ConcertActionResult | null,
  formData: FormData,
): Promise<ConcertActionResult> {
  try {
    const user = await requireManager();
    const title = String(formData.get("title") ?? "");
    const location = String(formData.get("location") ?? "");
    const details = String(formData.get("details") ?? "");
    const startsAt = fromDatetimeLocalValue(
      String(formData.get("startsAt") ?? ""),
    );
    const endsRaw = String(formData.get("endsAt") ?? "").trim();
    const endsAt = endsRaw ? fromDatetimeLocalValue(endsRaw) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new Error("End date/time is invalid.");
    }

    const concert = await createConcert({
      title,
      location,
      details,
      startsAt,
      endsAt,
      createdById: user.id,
    });
    revalidatePath("/app/calendar");
    redirect(`/app/calendar/${concert.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create concert.",
    };
  }
}

export async function updateConcertAction(
  concertId: string,
  _prev: ConcertActionResult | null,
  formData: FormData,
): Promise<ConcertActionResult> {
  try {
    await requireManager();
    const title = String(formData.get("title") ?? "");
    const location = String(formData.get("location") ?? "");
    const details = String(formData.get("details") ?? "");
    const startsAt = fromDatetimeLocalValue(
      String(formData.get("startsAt") ?? ""),
    );
    const endsRaw = String(formData.get("endsAt") ?? "").trim();
    const endsAt = endsRaw ? fromDatetimeLocalValue(endsRaw) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new Error("End date/time is invalid.");
    }

    await updateConcert(concertId, {
      title,
      location,
      details,
      startsAt,
      endsAt,
    });
    revalidatePath("/app/calendar");
    revalidatePath(`/app/calendar/${concertId}`);
    return { ok: true, message: "Concert updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update concert.",
    };
  }
}

export async function deleteConcertAction(
  concertId: string,
): Promise<ConcertActionResult> {
  try {
    await requireManager();
    const deleted = await deleteConcert(concertId);
    if (!deleted) throw new Error("Concert not found.");
    revalidatePath("/app/calendar");
    redirect("/app/calendar");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete concert.",
    };
  }
}

export async function saveRsvpAction(
  concertId: string,
  _prev: ConcertActionResult | null,
  formData: FormData,
): Promise<ConcertActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const concert = await getConcert(concertId);
    if (!concert) throw new Error("Concert not found.");

    const payload = rsvpInputFromForm(formData);
    await upsertRsvp({
      concertId,
      userId: user.id,
      ...payload,
    });
    revalidatePath(`/app/calendar/${concertId}`);
    revalidatePath("/app/calendar");
    return { ok: true, message: "RSVP saved. Visible to all members." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save RSVP.",
    };
  }
}
