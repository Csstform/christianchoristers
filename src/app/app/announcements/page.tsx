import { redirect } from "next/navigation";
import { AnnouncementCreateForm } from "@/components/announcements/announcement-create-form";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { AppNav } from "@/components/app-nav";
import { listAnnouncements } from "@/lib/announcements";
import { getCurrentUser } from "@/lib/auth";
import { canPostAnnouncements } from "@/lib/roles";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await listAnnouncements();
  const canPost = canPostAnnouncements(user.role);

  return (
    <>
      <AppNav user={user} current="/app/announcements" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Announcements</h2>
            <p className="muted">
              Member updates from managers and directors. Optional email goes to
              all active members.
            </p>
          </div>
        </div>

        {canPost ? (
          <details className="music-details" open={items.length === 0}>
            <summary>Post an announcement</summary>
            <AnnouncementCreateForm />
          </details>
        ) : null}

        <AnnouncementList items={items} canModerate={canPost} />
      </section>
    </>
  );
}
