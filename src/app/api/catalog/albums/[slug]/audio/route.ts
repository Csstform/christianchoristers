import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import {
  albumBySlug,
  contentTypeForAlbumAudio,
  safeAlbumAudioPath,
} from "@/lib/catalog-audio";
import { streamLocalFile } from "@/lib/http-file";
import { absoluteUploadPath } from "@/lib/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const album = albumBySlug(slug);
  if (!album?.localAudioPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const safe = safeAlbumAudioPath(album.localAudioPath);
  if (!safe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolute = absoluteUploadPath(safe);
  let size = 0;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Missing file" }, { status: 404 });
    }
    size = info.size;
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }

  const filename = safe.split("/").pop() || "album.mp3";

  return streamLocalFile({
    absolutePath: absolute,
    size,
    contentType: contentTypeForAlbumAudio(safe),
    contentDisposition: `inline; filename="${filename}"`,
    cacheControl: "public, max-age=3600",
    rangeHeader: request.headers.get("range"),
  });
}
