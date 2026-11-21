import { stat } from "fs/promises";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  albumBySlug,
  contentTypeForAlbumAudio,
  safeAlbumAudioPath,
} from "@/lib/catalog-audio";
import { sendLocalFile } from "@/lib/http-file";
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

  const slug = String(req.query.slug ?? "");
  const album = albumBySlug(slug);
  if (!album?.localAudioPath) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const safe = safeAlbumAudioPath(album.localAudioPath);
  if (!safe) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const absolute = absoluteUploadPath(safe);
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

  const filename = safe.split("/").pop() || "album.mp3";
  const contentType = contentTypeForAlbumAudio(safe);

  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Accept-Ranges": "bytes",
      "Content-Length": size,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    });
    res.end();
    return;
  }

  sendLocalFile(req, res, {
    absolutePath: absolute,
    size,
    contentType,
    contentDisposition: `inline; filename="${filename}"`,
    cacheControl: "public, max-age=3600",
  });
}
