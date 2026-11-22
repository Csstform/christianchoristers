import { maxUploadBytes } from "@/lib/file-validation";

const EXT_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

const INLINE_SAFE = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".txt",
]);

function extensionOf(filename: string): string {
  const lower = filename.toLowerCase();
  const idx = lower.lastIndexOf(".");
  return idx >= 0 ? lower.slice(idx) : "";
}

function startsWith(buffer: Buffer, ascii: string, offset = 0): boolean {
  return (
    buffer.length >= offset + ascii.length &&
    buffer.subarray(offset, offset + ascii.length).toString("ascii") === ascii
  );
}

function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

function looksLikePng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    startsWith(buffer, "PNG", 1)
  );
}

function looksLikeJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function looksLikeGif(buffer: Buffer): boolean {
  return startsWith(buffer, "GIF87a") || startsWith(buffer, "GIF89a");
}

function looksLikeWebp(buffer: Buffer): boolean {
  return startsWith(buffer, "RIFF") && startsWith(buffer, "WEBP", 8);
}

function looksLikeWav(buffer: Buffer): boolean {
  return startsWith(buffer, "RIFF") && startsWith(buffer, "WAVE", 8);
}

function looksLikeId3OrMp3(buffer: Buffer): boolean {
  if (buffer.length >= 3 && startsWith(buffer, "ID3")) return true;
  return buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function looksLikeOgg(buffer: Buffer): boolean {
  return startsWith(buffer, "OggS");
}

function looksLikeMp4(buffer: Buffer): boolean {
  return buffer.length >= 12 && startsWith(buffer, "ftyp", 4);
}

function looksLikeZip(buffer: Buffer): boolean {
  // ZIP / OOXML containers
  return startsWith(buffer, "PK\u0003\u0004") || startsWith(buffer, "PK\u0005\u0006");
}

function looksLikeOle(buffer: Buffer): boolean {
  // Legacy MS Office compound file
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  // Reject NUL bytes and common HTML/script openings for "text" uploads
  if (sample.includes(0)) return false;
  const asText = sample.toString("utf8").toLowerCase();
  if (
    asText.includes("<script") ||
    asText.includes("<!doctype html") ||
    asText.includes("<html")
  ) {
    return false;
  }
  return true;
}

function magicMatches(ext: string, buffer: Buffer): boolean {
  switch (ext) {
    case ".pdf":
      return looksLikePdf(buffer);
    case ".png":
      return looksLikePng(buffer);
    case ".jpg":
    case ".jpeg":
      return looksLikeJpeg(buffer);
    case ".gif":
      return looksLikeGif(buffer);
    case ".webp":
      return looksLikeWebp(buffer);
    case ".wav":
      return looksLikeWav(buffer);
    case ".mp3":
      return looksLikeId3OrMp3(buffer);
    case ".ogg":
      return looksLikeOgg(buffer);
    case ".m4a":
      return looksLikeMp4(buffer);
    case ".aac":
      return looksLikeMp4(buffer) || looksLikeId3OrMp3(buffer);
    case ".txt":
    case ".csv":
      return looksLikeText(buffer);
    case ".zip":
    case ".docx":
    case ".xlsx":
    case ".pptx":
      return looksLikeZip(buffer);
    case ".doc":
    case ".xls":
    case ".ppt":
      return looksLikeOle(buffer);
    default:
      return false;
  }
}

export function validateVaultUpload(input: {
  filename: string;
  /** Full file or a short magic-byte prefix when streaming to disk. */
  buffer: Buffer;
  /** Prefer file.size when `buffer` is only a header sample. */
  sizeBytes?: number;
}): { mimeType: string; safeFilename: string; extension: string } {
  const size = input.sizeBytes ?? input.buffer.length;
  if (size === 0 || input.buffer.length === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (size > maxUploadBytes()) {
    throw new Error("File is too large (25MB max).");
  }

  const extension = extensionOf(input.filename);
  const mimeType = EXT_MIME[extension];
  if (!mimeType) {
    throw new Error(
      "Unsupported file type. Allowed: PDF, images, audio, text/CSV, Office docs, ZIP.",
    );
  }
  if (!magicMatches(extension, input.buffer)) {
    throw new Error("File contents do not match the file type.");
  }

  const safeFilename = input.filename
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  return { mimeType, safeFilename, extension };
}

export function contentTypeForVaultFile(input: {
  storagePath: string;
  mimeType?: string | null;
}): string {
  const ext = extensionOf(input.storagePath);
  return EXT_MIME[ext] || "application/octet-stream";
}

export function dispositionForVaultFile(input: {
  storagePath: string;
  filename: string;
}): string {
  const ext = extensionOf(input.storagePath);
  const safe = input.filename.replace(/[^\w.\- ]+/g, "") || "download";
  const mode = INLINE_SAFE.has(ext) ? "inline" : "attachment";
  return `${mode}; filename="${safe}"`;
}
