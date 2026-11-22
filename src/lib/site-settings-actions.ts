"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { canUpload } from "@/lib/roles";
import {
  updateAlbumSetUrl,
  updateStreamingLinks,
  type StreamingLink,
} from "@/lib/site-settings";

export type SiteSettingsActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireManager() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canUpload(user.role)) {
    throw new Error("Managers and above can manage site settings.");
  }
  return user;
}

export async function updateStreamingLinksAction(
  _prev: SiteSettingsActionResult | null,
  formData: FormData,
): Promise<SiteSettingsActionResult> {
  try {
    await requireManager();
    const labels = formData.getAll("label").map(String);
    const hrefs = formData.getAll("href").map(String);
    const links: StreamingLink[] = labels.map((label, index) => ({
      label,
      href: hrefs[index] ?? "",
    }));
    await updateStreamingLinks(links);
    revalidatePath("/");
    revalidatePath("/app/admin/settings");
    return { ok: true, message: "Streaming links saved." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not save streaming links.",
    };
  }
}

export async function updateAlbumSetUrlAction(
  _prev: SiteSettingsActionResult | null,
  formData: FormData,
): Promise<SiteSettingsActionResult> {
  try {
    await requireManager();
    await updateAlbumSetUrl(String(formData.get("albumSetUrl") ?? ""));
    revalidatePath("/music");
    revalidatePath("/app/admin/settings");
    return { ok: true, message: "Album set URL saved." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not save album set URL.",
    };
  }
}
