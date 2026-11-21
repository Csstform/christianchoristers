import { createReadStream } from "fs";
import { NextResponse } from "next/server";
import { Readable } from "stream";

function parseByteRange(
  rangeHeader: string | null,
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

/** Stream a local file with Content-Length + Accept-Ranges for media seeking. */
export function streamLocalFile(input: {
  absolutePath: string;
  size: number;
  contentType: string;
  contentDisposition: string;
  cacheControl: string;
  rangeHeader?: string | null;
}): NextResponse {
  const common = {
    "Content-Type": input.contentType,
    "Content-Disposition": input.contentDisposition,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": input.cacheControl,
  };

  const parsed = parseByteRange(input.rangeHeader ?? null, input.size);
  if (parsed === "invalid") {
    return new NextResponse(null, {
      status: 416,
      headers: {
        ...common,
        "Content-Range": `bytes */${input.size}`,
      },
    });
  }

  if (!parsed) {
    const nodeStream = createReadStream(input.absolutePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...common,
        "Content-Length": String(input.size),
      },
    });
  }

  const { start, end } = parsed;
  const chunkSize = end - start + 1;
  const nodeStream = createReadStream(input.absolutePath, { start, end });
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    status: 206,
    headers: {
      ...common,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${input.size}`,
    },
  });
}
