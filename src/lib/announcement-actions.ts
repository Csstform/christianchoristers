"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  createAnnouncement,
  deleteAnnouncement,
  listActiveMemberEmails,
  markAnnouncementEmailed,
} from "@/lib/announcements";
import { sendAnnouncementEmails } from "@/lib/mail";
import { canPostAnnouncements } from "@/lib/roles";

export type AnnouncementActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requirePoster() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (!canPostAnnouncements(user.role)) {
    throw new Error("Managers and above can post announcements.");
  }
  return user;
}

export async function createAnnouncementAction(
  _prev: AnnouncementActionResult | null,
  formData: FormData,
): Promise<AnnouncementActionResult> {
  try {
    const user = await requirePoster();
    const title = String(formData.get("title") ?? "");
    const body = String(formData.get("body") ?? "");
    const sendEmail = String(formData.get("sendEmail") ?? "") === "on";

    const announcement = await createAnnouncement({
      title,
      body,
      authorId: user.id,
    });

    let message = "Announcement posted.";
    if (sendEmail) {
      const recipients = await listActiveMemberEmails();
      if (recipients.length === 0) {
        message = "Announcement posted. No active members to email.";
      } else {
        message = `Announcement posted. Emailing ${recipients.length} member${recipients.length === 1 ? "" : "s"} in the background.`;
        after(async () => {
          try {
            const result = await sendAnnouncementEmails({
              title: announcement.title,
              body: announcement.body,
              authorName: user.name,
              recipients,
            });
            if (result.skipped) {
              console.info(
                "[announcements] email skipped (SMTP not configured)",
                announcement.id,
              );
              return;
            }
            if (result.sent > 0) {
              await markAnnouncementEmailed(announcement.id);
            }
            console.info("[announcements] email batch finished", {
              id: announcement.id,
              sent: result.sent,
              failed: result.failed,
            });
          } catch (error) {
            console.error(
              "[announcements] background email failed",
              announcement.id,
              error,
            );
          }
        });
      }
    }

    revalidatePath("/app");
    revalidatePath("/app/announcements");
    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not post announcement.",
    };
  }
}

export async function deleteAnnouncementAction(
  announcementId: string,
): Promise<AnnouncementActionResult> {
  try {
    await requirePoster();
    const deleted = await deleteAnnouncement(announcementId);
    if (!deleted) throw new Error("Announcement not found.");
    revalidatePath("/app");
    revalidatePath("/app/announcements");
    return { ok: true, message: "Announcement deleted." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not delete announcement.",
    };
  }
}
