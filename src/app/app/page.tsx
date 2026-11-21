import Link from "next/link";
import { redirect } from "next/navigation";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { AppNav } from "@/components/app-nav";
import { listAnnouncements } from "@/lib/announcements";
import { getCurrentUser } from "@/lib/auth";
import {
  formatProgramWhen,
  listUpcomingPrograms,
} from "@/lib/programs";
import { canPostAnnouncements } from "@/lib/roles";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [announcements, upcoming] = await Promise.all([
    listAnnouncements(5),
    listUpcomingPrograms(),
  ]);
  const canPost = canPostAnnouncements(user.role);
  const nextPrograms = upcoming.slice(0, 3);

  return (
    <>
      <AppNav user={user} current="/app" />
      <div className="app-card-grid">
        <section className="app-card">
          <div className="home-card-head">
            <h2>Announcements</h2>
            <Link href="/app/announcements">View all</Link>
          </div>
          <AnnouncementList items={announcements} canModerate={canPost} />
          {canPost ? (
            <p className="muted" style={{ marginTop: "1rem" }}>
              <Link href="/app/announcements">Post a new announcement →</Link>
            </p>
          ) : null}
        </section>
        <section className="app-card">
          <div className="home-card-head">
            <h2>Upcoming programs</h2>
            <Link href="/app/calendar">Calendar</Link>
          </div>
          {nextPrograms.length === 0 ? (
            <p className="muted">No upcoming programs yet.</p>
          ) : (
            <div className="song-list">
              {nextPrograms.map((program) => (
                <article key={program.id} className="home-program">
                  <h3>
                    <Link href={`/app/calendar/${program.id}`}>
                      {program.title}
                    </Link>
                  </h3>
                  <p className="muted">
                    {formatProgramWhen(program.startsAt, program.endsAt)}
                    {program.location ? ` · ${program.location}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
