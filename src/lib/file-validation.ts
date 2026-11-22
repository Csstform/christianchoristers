export type SongAssetKind = "sheet_pdf" | "rehearsal_audio";

const AUDIO_EXT_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function maxUploadBytes(): number {
  return MAX_UPLOAD_BYTES;
}

function extensionOf(filename: string): string {
  const lower = filename.toLowerCase();
  const idx = lower.lastIndexOf(".");
  return idx >= 0 ? lower.slice(idx) : "";
}

function looksLikePdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

function looksLikeWav(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  );
}

function looksLikeId3OrMp3(buffer: Buffer): boolean {
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "ID3") {
    return true;
  }
  // MPEG frame sync
  return buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function looksLikeOgg(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS";
}

function looksLikeMp4Audio(buffer: Buffer): boolean {
  // ISO BMFF: size + 'ftyp'
  return (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp"
  );
}

export function validateAndCanonicalizeUpload(input: {
  kind: SongAssetKind;
  filename: string;
  /** Full file or a short magic-byte prefix when streaming to disk. */
  buffer: Buffer;
  /** Prefer file.size when `buffer` is only a header sample. */
  sizeBytes?: number;
}): { mimeType: string; safeFilename: string } {
  const size = input.sizeBytes ?? input.buffer.length;
  if (size === 0 || input.buffer.length === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (25MB max).");
  }

  const ext = extensionOf(input.filename);
  const safeFilename = input.filename
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  if (input.kind === "sheet_pdf") {
    if (ext !== ".pdf") {
      throw new Error("Sheet music must use a .pdf filename.");
    }
    if (!looksLikePdf(input.buffer)) {
      throw new Error("Sheet music file is not a valid PDF.");
    }
    return { mimeType: "application/pdf", safeFilename };
  }

  const mime = AUDIO_EXT_MIME[ext];
  if (!mime) {
    throw new Error("Rehearsal audio must be .mp3, .wav, .m4a, .aac, or .ogg.");
  }

  const magicOk =
    (ext === ".wav" && looksLikeWav(input.buffer)) ||
    (ext === ".mp3" && looksLikeId3OrMp3(input.buffer)) ||
    (ext === ".ogg" && looksLikeOgg(input.buffer)) ||
    ((ext === ".m4a" || ext === ".aac") && looksLikeMp4Audio(input.buffer)) ||
    // AAC ADTS often starts with 0xFFF sync; accept mpeg sync for .aac too
    (ext === ".aac" && looksLikeId3OrMp3(input.buffer));

  if (!magicOk) {
    throw new Error("Rehearsal audio contents do not match the file type.");
  }

  return { mimeType: mime, safeFilename };
}

export function contentTypeForAsset(input: {
  kind: string;
  storagePath: string;
  mimeType?: string | null;
}): string {
  if (input.kind === "sheet_pdf") return "application/pdf";
  const ext = extensionOf(input.storagePath);
  return AUDIO_EXT_MIME[ext] || "application/octet-stream";
}
