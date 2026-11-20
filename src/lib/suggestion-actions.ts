"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canReviewSuggestions } from "@/lib/roles";
import {
  deleteSuggestion,
  getSuggestion,
  isStoredSuggestionFile,
  type SuggestionStatus,
  updateSuggestionStatus,
} from "@/lib/suggestions";
import { absoluteUploadPath } from "@/lib/storage";
import { unlink } from "fs/promises";

export type SuggestionActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function setSuggestionStatusAction(
  suggestionId: string,
  status: SuggestionStatus,
): Promise<SuggestionActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (!canReviewSuggestions(user.role)) {
      throw new Error("Directors and above can review suggestions.");
    }

    await updateSuggestionStatus({
      id: suggestionId,
      status,
      reviewedById: user.id,
    });
    revalidatePath("/app/suggestions");
    return { ok: true, message: `Marked as ${status}.` };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not update suggestion.",
    };
  }
}

export async function deleteSuggestionAction(
  suggestionId: string,
): Promise<SuggestionActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const existing = await getSuggestion(suggestionId);
    if (!existing) throw new Error("Suggestion not found.");

    const isOwner = existing.submittedById === user.id;
    const canReview = canReviewSuggestions(user.role);
    if (!isOwner && !canReview) {
      throw new Error("You can only delete your own suggestions.");
    }
    if (
      !canReview &&
      existing.status !== "submitted" &&
      existing.status !== "reviewing"
    ) {
      throw new Error("Reviewed suggestions can only be removed by directors.");
    }

    const deleted = await deleteSuggestion(suggestionId);
    if (!deleted) throw new Error("Suggestion not found.");

    if (isStoredSuggestionFile(deleted.linkOrPath) && deleted.linkOrPath) {
      try {
        await unlink(absoluteUploadPath(deleted.linkOrPath));
      } catch {
        // Ignore missing on-disk files.
      }
    }

    revalidatePath("/app/suggestions");
    return { ok: true, message: "Suggestion deleted." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not delete suggestion.",
    };
  }
}
