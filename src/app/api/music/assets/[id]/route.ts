import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { contentTypeForAsset } from "@/lib/file-validation";
import { streamLocalFile } from "@/lib/http-file";
import { getSongAsset } from "@/lib/music";
import { absoluteUploadPath } from "@/lib/storage";

export async function GET(
  request: Request,
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

  const filename =
    asset.label?.replace(/[^\w.\- ]+/g, "") ||
    asset.storagePath.split("/").pop() ||
    "download";

  const contentType = contentTypeForAsset({
    kind: asset.kind,
    storagePath: asset.storagePath,
    mimeType: asset.mimeType,
  });

  return streamLocalFile({
    absolutePath: absolute,
    size,
    contentType,
    contentDisposition: `inline; filename="${filename}"`,
    cacheControl: "private, max-age=3600",
    rangeHeader: request.headers.get("range"),
  });
}
