"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  createLiveRecording,
  deleteLiveRecording,
  updateLiveRecording,
} from "@/lib/live-recordings";
import { canUpload } from "@/lib/roles";

export type LiveRecordingActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canUpload(user.role)) {
    throw new Error("Managers and above can manage live recordings.");
  }
  return user;
}

function parseYear(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("Year must be a whole number between 1900 and 2100.");
  }
  return year;
}

export async function createLiveRecordingAction(
  _prev: LiveRecordingActionResult | null,
  formData: FormData,
): Promise<LiveRecordingActionResult> {
  try {
    await requireManager();
    await createLiveRecording({
      title: String(formData.get("title") ?? ""),
      location: String(formData.get("location") ?? ""),
      recordedYear: parseYear(String(formData.get("recordedYear") ?? "")),
      youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
      sortOrder: Number(String(formData.get("sortOrder") ?? "0")),
      published: String(formData.get("published") ?? "") === "on",
    });
    revalidatePath("/live-recordings");
    revalidatePath("/app/admin/live-recordings");
    return { ok: true, message: "Live recording added." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not create live recording.",
    };
  }
}

export async function updateLiveRecordingAction(
  recordingId: string,
  _prev: LiveRecordingActionResult | null,
  formData: FormData,
): Promise<LiveRecordingActionResult> {
  try {
    await requireManager();
    await updateLiveRecording(recordingId, {
      title: String(formData.get("title") ?? ""),
      location: String(formData.get("location") ?? ""),
      recordedYear: parseYear(String(formData.get("recordedYear") ?? "")),
      youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
      sortOrder: Number(String(formData.get("sortOrder") ?? "0")),
      published: String(formData.get("published") ?? "") === "on",
    });
    revalidatePath("/live-recordings");
    revalidatePath("/app/admin/live-recordings");
    return { ok: true, message: "Live recording updated." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not update live recording.",
    };
  }
}

export async function deleteLiveRecordingAction(
  recordingId: string,
): Promise<LiveRecordingActionResult> {
  try {
    await requireManager();
    const deleted = await deleteLiveRecording(recordingId);
    if (!deleted) throw new Error("Live recording not found.");
    revalidatePath("/live-recordings");
    revalidatePath("/app/admin/live-recordings");
    return { ok: true, message: "Live recording deleted." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not delete live recording.",
    };
  }
}
