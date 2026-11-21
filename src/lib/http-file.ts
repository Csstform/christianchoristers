import { open, readFile } from "fs/promises";
import { NextResponse } from "next/server";

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

async function readFileSlice(
  absolutePath: string,
  start: number,
  end: number,
): Promise<Uint8Array> {
  const length = end - start + 1;
  const handle = await open(absolutePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, start);
    return bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Serve a local file with Content-Length + Accept-Ranges so media players can
 * seek and track position. Uses buffered bodies (not Node streams) because
 * Next.js drops Content-Length on streamed responses and falls back to chunked
 * transfer, which breaks HTML5 audio progress/seek.
 */
export async function streamLocalFile(input: {
  absolutePath: string;
  size: number;
  contentType: string;
  contentDisposition: string;
  cacheControl: string;
  rangeHeader?: string | null;
}): Promise<NextResponse> {
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
    const body = await readFile(input.absolutePath);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        ...common,
        "Content-Length": String(body.byteLength),
      },
    });
  }

  const { start, end } = parsed;
  const body = await readFileSlice(input.absolutePath, start, end);

  return new NextResponse(new Uint8Array(body), {
    status: 206,
    headers: {
      ...common,
      "Content-Length": String(body.byteLength),
      "Content-Range": `bytes ${start}-${end}/${input.size}`,
    },
  });
}
