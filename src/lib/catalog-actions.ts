"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateAlbumStreaming } from "@/lib/catalog";
import { canUpload } from "@/lib/roles";

export type CatalogActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireUploader() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canUpload(user.role)) {
    throw new Error("Managers and above can manage public music streaming.");
  }
  return user;
}

export async function updateAlbumStreamingAction(
  albumId: string,
  _prev: CatalogActionResult | null,
  formData: FormData,
): Promise<CatalogActionResult> {
  try {
    await requireUploader();
    const title = String(formData.get("title") ?? "");
    const spotifyUrl = String(formData.get("spotifyUrl") ?? "");
    const cdUrl = String(formData.get("cdUrl") ?? "");
    const sortOrder = Number(String(formData.get("sortOrder") ?? "0"));
    const published = String(formData.get("published") ?? "") === "on";
    const clearLocalAudio = String(formData.get("clearLocalAudio") ?? "") === "on";

    await updateAlbumStreaming(albumId, {
      title,
      spotifyUrl,
      cdUrl,
      sortOrder,
      published,
      clearLocalAudio,
    });

    revalidatePath("/music");
    revalidatePath("/app/admin/music");
    return { ok: true, message: "Album streaming updated." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not update album streaming.",
    };
  }
}
