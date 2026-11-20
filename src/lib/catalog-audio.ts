import { access } from "fs/promises";
import path from "path";
import { albums, type Album } from "@/data/public-catalog";
import { absoluteUploadPath } from "@/lib/storage";

const AUDIO_EXT_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

/** Reject path traversal; only allow files under the albums/ uploads prefix. */
export function safeAlbumAudioPath(relative: string): string | null {
  const normalized = relative.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("albums/")) return null;
  if (normalized.includes("..") || path.isAbsolute(normalized)) return null;
  const ext = path.extname(normalized).toLowerCase();
  if (!AUDIO_EXT_MIME[ext]) return null;
  return normalized;
}

export function contentTypeForAlbumAudio(storagePath: string): string {
  return AUDIO_EXT_MIME[path.extname(storagePath).toLowerCase()] || "application/octet-stream";
}

export function albumBySlug(slug: string): Album | undefined {
  return albums.find((album) => album.slug === slug);
}

export async function localAlbumAudioAvailable(album: Album): Promise<boolean> {
  if (!album.localAudioPath) return false;
  const safe = safeAlbumAudioPath(album.localAudioPath);
  if (!safe) return false;
  try {
    await access(absoluteUploadPath(safe));
    return true;
  } catch {
    return false;
  }
}
