"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createProgram,
  deleteProgram,
  fromDatetimeLocalValue,
  getProgram,
  rsvpInputFromForm,
  updateProgram,
  upsertRsvp,
} from "@/lib/programs";
import { canManagePrograms } from "@/lib/roles";

export type ProgramActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManagePrograms(user.role)) {
    throw new Error("Managers and above can manage programs.");
  }
  return user;
}

export async function createProgramAction(
  _prev: ProgramActionResult | null,
  formData: FormData,
): Promise<ProgramActionResult> {
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

    const isPublic = String(formData.get("isPublic") ?? "") === "on";
    const program = await createProgram({
      title,
      location,
      details,
      startsAt,
      endsAt,
      isPublic,
      createdById: user.id,
    });
    revalidatePath("/");
    revalidatePath("/app/calendar");
    redirect(`/app/calendar/${program.id}`);
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
      error: error instanceof Error ? error.message : "Could not create program.",
    };
  }
}

export async function updateProgramAction(
  programId: string,
  _prev: ProgramActionResult | null,
  formData: FormData,
): Promise<ProgramActionResult> {
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

    const isPublic = String(formData.get("isPublic") ?? "") === "on";
    await updateProgram(programId, {
      title,
      location,
      details,
      startsAt,
      endsAt,
      isPublic,
    });
    revalidatePath("/");
    revalidatePath("/app/calendar");
    revalidatePath(`/app/calendar/${programId}`);
    return { ok: true, message: "Program updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update program.",
    };
  }
}

export async function deleteProgramAction(
  programId: string,
): Promise<ProgramActionResult> {
  try {
    await requireManager();
    const deleted = await deleteProgram(programId);
    if (!deleted) throw new Error("Program not found.");
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
      error: error instanceof Error ? error.message : "Could not delete program.",
    };
  }
}

export async function saveRsvpAction(
  programId: string,
  _prev: ProgramActionResult | null,
  formData: FormData,
): Promise<ProgramActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const program = await getProgram(programId);
    if (!program) throw new Error("Program not found.");

    const payload = rsvpInputFromForm(formData);
    await upsertRsvp({
      programId,
      userId: user.id,
      ...payload,
    });
    revalidatePath(`/app/calendar/${programId}`);
    revalidatePath("/app/calendar");
    return { ok: true, message: "RSVP saved. Visible to all members." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save RSVP.",
    };
  }
}
