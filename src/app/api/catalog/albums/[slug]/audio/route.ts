import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import {
  albumBySlug,
  contentTypeForAlbumAudio,
  safeAlbumAudioPath,
} from "@/lib/catalog-audio";
import { absoluteUploadPath } from "@/lib/storage";

export async function GET(
  _request: Request,
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
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Missing file" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }

  const filename = safe.split("/").pop() || "album.mp3";
  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentTypeForAlbumAudio(safe),
      "Content-Disposition": `inline; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
