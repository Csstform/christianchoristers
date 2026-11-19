import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth";
import { contentTypeForAsset } from "@/lib/file-validation";
import { getSongAsset } from "@/lib/music";
import { absoluteUploadPath } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const asset = await getSongAsset(id);
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolute = absoluteUploadPath(asset.storagePath);
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Missing file" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }

  const filename =
    asset.label?.replace(/[^\w.\- ]+/g, "") ||
    asset.storagePath.split("/").pop() ||
    "download";

  const contentType = contentTypeForAsset({
    kind: asset.kind,
    storagePath: asset.storagePath,
    mimeType: asset.mimeType,
  });

  // PDFs can render inline safely with a forced type + nosniff.
  // Never trust uploader-controlled mime types for execution.
  const disposition =
    asset.kind === "sheet_pdf"
      ? `inline; filename="${filename}"`
      : `inline; filename="${filename}"`;

  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
