"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { getCurrentUser } from "@/lib/auth";
import {
  createSong,
  deleteSong,
  deleteSongAsset,
  getSong,
  updateSongDetails,
  updateSongStatus,
} from "@/lib/music";
import { canSetRepertoire, canUpload } from "@/lib/roles";
import { absoluteUploadPath } from "@/lib/storage";

export type MusicActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireUploader() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canUpload(user.role)) {
    throw new Error("Managers and above can upload music files.");
  }
  return user;
}

async function requireDirector() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canSetRepertoire(user.role)) {
    throw new Error("Directors and above can change repertoire status.");
  }
  return user;
}

export async function createSongAction(
  _prev: MusicActionResult | null,
  formData: FormData,
): Promise<MusicActionResult> {
  try {
    await requireUploader();
    const title = String(formData.get("title") ?? "");
    const notes = String(formData.get("notes") ?? "");
    const status =
      String(formData.get("status") ?? "active") === "archive"
        ? "archive"
        : "active";
    await createSong({ title, notes, status });
    revalidatePath("/app/music");
    return { ok: true, message: "Song added." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not add song.",
    };
  }
}

export async function updateSongAction(
  songId: string,
  _prev: MusicActionResult | null,
  formData: FormData,
): Promise<MusicActionResult> {
  try {
    await requireUploader();
    const title = String(formData.get("title") ?? "");
    const notes = String(formData.get("notes") ?? "");
    await updateSongDetails(songId, { title, notes });
    revalidatePath("/app/music");
    return { ok: true, message: "Song updated." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update song.",
    };
  }
}

export async function setSongStatusAction(
  songId: string,
  status: "active" | "archive",
): Promise<MusicActionResult> {
  try {
    await requireDirector();
    await updateSongStatus(songId, status);
    revalidatePath("/app/music");
    return {
      ok: true,
      message: status === "active" ? "Moved to active." : "Moved to archive.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update status.",
    };
  }
}

export async function deleteSongAction(songId: string): Promise<MusicActionResult> {
  try {
    await requireDirector();
    const existing = await getSong(songId);
    if (!existing) throw new Error("Song not found.");
    for (const asset of existing.assets) {
      try {
        await unlink(absoluteUploadPath(asset.storagePath));
      } catch {
        // Ignore missing files on disk.
      }
    }
    await deleteSong(songId);
    revalidatePath("/app/music");
    return { ok: true, message: "Song deleted." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete song.",
    };
  }
}

export async function deleteSongAssetAction(
  assetId: string,
): Promise<MusicActionResult> {
  try {
    await requireUploader();
    const asset = await deleteSongAsset(assetId);
    if (!asset) throw new Error("File not found.");
    try {
      await unlink(absoluteUploadPath(asset.storagePath));
    } catch {
      // File may already be missing on disk; DB row is the source of truth for UI.
    }
    revalidatePath("/app/music");
    return { ok: true, message: "File removed." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not remove file.",
    };
  }
}
