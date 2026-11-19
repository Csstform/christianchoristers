"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { getCurrentUser } from "@/lib/auth";
import {
  addSongAsset,
  createSong,
  deleteSong,
  deleteSongAsset,
  getSong,
  updateSongDetails,
  updateSongStatus,
  type SongAssetKind,
} from "@/lib/music";
import { canSetRepertoire, canUpload } from "@/lib/roles";
import { absoluteUploadPath, saveUpload } from "@/lib/storage";

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

export async function uploadSongAssetAction(
  songId: string,
  _prev: MusicActionResult | null,
  formData: FormData,
): Promise<MusicActionResult> {
  try {
    await requireUploader();
    const kindRaw = String(formData.get("kind") ?? "");
    const kind: SongAssetKind =
      kindRaw === "rehearsal_audio" ? "rehearsal_audio" : "sheet_pdf";
    const label = String(formData.get("label") ?? "");
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Choose a file to upload.");
    }

    if (kind === "sheet_pdf") {
      const okType =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!okType) throw new Error("Sheet music must be a PDF.");
    }

    if (kind === "rehearsal_audio") {
      const lower = file.name.toLowerCase();
      const okType =
        file.type.startsWith("audio/") ||
        [".mp3", ".wav", ".m4a", ".aac", ".ogg"].some((ext) =>
          lower.endsWith(ext),
        );
      if (!okType) throw new Error("Rehearsal audio must be an audio file.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload({
      category: "songs",
      originalName: file.name,
      data: buffer,
      mimeType: file.type || undefined,
    });

    await addSongAsset({
      songId,
      kind,
      label: label || file.name,
      storagePath: saved.storagePath,
      mimeType: file.type || undefined,
    });

    revalidatePath("/app/music");
    return { ok: true, message: "File uploaded." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
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
