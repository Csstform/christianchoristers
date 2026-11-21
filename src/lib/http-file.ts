import { createReadStream } from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

export function parseByteRange(
  rangeHeader: string | null | undefined,
  size: number,
): { start: number; end: number } | "invalid" | null {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return "invalid";

  const rawStart = match[1];
  const rawEnd = match[2];
  if (!rawStart && !rawEnd) return "invalid";

  let start: number;
  let end: number;

  if (!rawStart) {
    // suffix: bytes=-N
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return "invalid";
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "invalid";
    if (start >= size) return "invalid";
    end = Math.min(end, size - 1);
    if (start > end) return "invalid";
  }

  return { start, end };
}

type SendLocalFileInput = {
  absolutePath: string;
  size: number;
  contentType: string;
  contentDisposition: string;
  cacheControl: string;
};

/**
 * Stream a local file through a Pages API Node response with Content-Length
 * and Accept-Ranges. App Router Route Handlers strip Content-Length and force
 * chunked transfer, which breaks HTML5 audio duration/seek/progress.
 */
export function sendLocalFile(
  req: NextApiRequest,
  res: NextApiResponse,
  input: SendLocalFileInput,
): void {
  const common = {
    "Content-Type": input.contentType,
    "Content-Disposition": input.contentDisposition,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": input.cacheControl,
  };

  const rangeHeader = Array.isArray(req.headers.range)
    ? req.headers.range[0]
    : req.headers.range;
  const parsed = parseByteRange(rangeHeader, input.size);

  if (parsed === "invalid") {
    res.writeHead(416, {
      ...common,
      "Content-Range": `bytes */${input.size}`,
    });
    res.end();
    return;
  }

  if (!parsed) {
    res.writeHead(200, {
      ...common,
      "Content-Length": input.size,
    });
    createReadStream(input.absolutePath).pipe(res);
    return;
  }

  const { start, end } = parsed;
  const chunkSize = end - start + 1;
  res.writeHead(206, {
    ...common,
    "Content-Length": chunkSize,
    "Content-Range": `bytes ${start}-${end}/${input.size}`,
  });
  createReadStream(input.absolutePath, { start, end }).pipe(res);
}
