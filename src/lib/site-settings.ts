import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import {
  albumSetUrl as seedAlbumSetUrl,
} from "@/data/public-catalog";
import { streamingLinks as seedStreamingLinks } from "@/data/streaming-links";

export const SITE_SETTING_KEYS = {
  streamingLinks: "streaming_links",
  albumSetUrl: "album_set_url",
} as const;

export type StreamingLink = {
  label: string;
  href: string;
};

const DEFAULT_STREAMING_LINKS: StreamingLink[] = seedStreamingLinks.map(
  (link) => ({ label: link.label, href: link.href }),
);

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getStreamingLinks(): Promise<StreamingLink[]> {
  const raw = await getSetting(SITE_SETTING_KEYS.streamingLinks);
  if (!raw) return DEFAULT_STREAMING_LINKS;
  try {
    const parsed = JSON.parse(raw) as StreamingLink[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_STREAMING_LINKS;
    }
    return parsed
      .map((item) => ({
        label: String(item.label ?? "").trim(),
        href: String(item.href ?? "").trim(),
      }))
      .filter((item) => item.label && item.href);
  } catch {
    return DEFAULT_STREAMING_LINKS;
  }
}

export async function getAlbumSetUrl(): Promise<string> {
  const raw = await getSetting(SITE_SETTING_KEYS.albumSetUrl);
  const trimmed = raw?.trim();
  return trimmed || seedAlbumSetUrl;
}

export async function updateStreamingLinks(
  links: StreamingLink[],
): Promise<StreamingLink[]> {
  const cleaned = links
    .map((item) => ({
      label: item.label.trim(),
      href: item.href.trim(),
    }))
    .filter((item) => item.label && item.href);

  for (const link of cleaned) {
    let parsed: URL;
    try {
      parsed = new URL(link.href);
    } catch {
      throw new Error(`Invalid URL for “${link.label}”.`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`URL for “${link.label}” must use http or https.`);
    }
  }

  if (cleaned.length === 0) {
    throw new Error("Add at least one streaming link.");
  }

  await setSetting(SITE_SETTING_KEYS.streamingLinks, JSON.stringify(cleaned));
  return cleaned;
}

export async function updateAlbumSetUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("Album set URL is required.");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Album set URL must be a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Album set URL must use http or https.");
  }
  await setSetting(SITE_SETTING_KEYS.albumSetUrl, parsed.toString());
  return parsed.toString();
}
