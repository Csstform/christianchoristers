import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAlbumById, saveAlbumLocalAudio } from "@/lib/catalog";
import { maxUploadBytes } from "@/lib/file-validation";
import { canUpload } from "@/lib/roles";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUpload(user.role)) {
    return NextResponse.json(
      { error: "Managers and above can manage public music streaming." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const album = await getAlbumById(id);
  if (!album) {
    return NextResponse.json({ error: "Album not found." }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
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
    return NextResponse.json(
      { error: "Invalid upload payload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose an audio file to upload." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const updated = await saveAlbumLocalAudio({
      albumId: id,
      filename: file.name,
      buffer,
    });

    revalidatePath("/music");
    revalidatePath("/app/admin/music");
    return NextResponse.json({ ok: true, album: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
