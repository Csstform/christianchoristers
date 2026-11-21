import { stat } from "fs/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCurrentUserFromCookie,
  sessionCookieName,
} from "@/lib/auth";
import { contentTypeForAsset } from "@/lib/file-validation";
import { sendLocalFile } from "@/lib/http-file";
import { getSongAsset } from "@/lib/music";
import { absoluteUploadPath } from "@/lib/storage";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await getCurrentUserFromCookie(
    req.cookies[sessionCookieName],
  );
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = String(req.query.id ?? "");
  const asset = await getSongAsset(id);
  if (!asset) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const absolute = absoluteUploadPath(asset.storagePath);
  let size = 0;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      res.status(404).json({ error: "Missing file" });
      return;
    }
    size = info.size;
  } catch {
    res.status(404).json({ error: "Missing file" });
    return;
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

  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Accept-Ranges": "bytes",
      "Content-Length": size,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    });
    res.end();
    return;
  }

  sendLocalFile(req, res, {
    absolutePath: absolute,
    size,
    contentType,
    contentDisposition: `inline; filename="${filename}"`,
    cacheControl: "private, max-age=3600",
  });
}
