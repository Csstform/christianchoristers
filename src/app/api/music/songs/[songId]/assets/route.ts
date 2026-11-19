import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  maxUploadBytes,
  validateAndCanonicalizeUpload,
} from "@/lib/file-validation";
import { addSongAsset, getSong, type SongAssetKind } from "@/lib/music";
import { canUpload } from "@/lib/roles";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ songId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUpload(user.role)) {
    return NextResponse.json(
      { error: "Managers and above can upload music files." },
      { status: 403 },
    );
  }

  const { songId } = await context.params;
  const song = await getSong(songId);
  if (!song) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  // multipart overhead; reject clearly oversized requests early
  if (contentLength > maxUploadBytes() + 1024 * 1024) {
    return NextResponse.json(
      { error: "File is too large (25MB max)." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const kindRaw = String(formData.get("kind") ?? "");
  const kind: SongAssetKind =
    kindRaw === "rehearsal_audio" ? "rehearsal_audio" : "sheet_pdf";
  const label = String(formData.get("label") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { mimeType, safeFilename } = validateAndCanonicalizeUpload({
      kind,
      filename: file.name,
      buffer,
    });

    const saved = await saveUpload({
      category: "songs",
      originalName: safeFilename,
      data: buffer,
      mimeType,
    });

    const asset = await addSongAsset({
      songId,
      kind,
      label: label || file.name,
      storagePath: saved.storagePath,
      mimeType,
    });

    revalidatePath("/app/music");
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
