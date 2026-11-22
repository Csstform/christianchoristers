import { createWriteStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { nanoid } from "nanoid";

export function uploadsRoot(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}

export async function ensureUploadsRoot(): Promise<string> {
  const root = uploadsRoot();
  await mkdir(root, { recursive: true });
  return root;
}

function safeUploadName(originalName: string): string {
  const safeBase = originalName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return `${nanoid(10)}-${safeBase}`;
}

export async function saveUpload(input: {
  category: "vault" | "songs" | "covers" | "suggestions" | "albums";
  originalName: string;
  data: Buffer;
  mimeType?: string;
}): Promise<{ storagePath: string; absolutePath: string }> {
  const root = await ensureUploadsRoot();
  const filename = safeUploadName(input.originalName);
  const relative = path.join(input.category, filename);
  const absolutePath = path.join(root, relative);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, input.data);
  return { storagePath: relative.replace(/\\/g, "/"), absolutePath };
}

/** Stream a browser/File body to disk without buffering the whole payload. */
export async function saveUploadStream(input: {
  category: "vault" | "songs" | "covers" | "suggestions" | "albums";
  originalName: string;
  stream: ReadableStream<Uint8Array>;
  mimeType?: string;
}): Promise<{ storagePath: string; absolutePath: string }> {
  const root = await ensureUploadsRoot();
  const filename = safeUploadName(input.originalName);
  const relative = path.join(input.category, filename);
  const absolutePath = path.join(root, relative);
  await mkdir(path.dirname(absolutePath), { recursive: true });

  const nodeStream = Readable.fromWeb(
    input.stream as import("stream/web").ReadableStream,
  );
  await pipeline(nodeStream, createWriteStream(absolutePath));

  return { storagePath: relative.replace(/\\/g, "/"), absolutePath };
}

export function absoluteUploadPath(storagePath: string): string {
  return path.join(uploadsRoot(), storagePath);
}

/** Read a small prefix for magic-byte checks without loading the whole file. */
export async function readFileHeader(
  file: File,
  bytes = 64,
): Promise<Buffer> {
  const slice = file.slice(0, bytes);
  return Buffer.from(await slice.arrayBuffer());
}
