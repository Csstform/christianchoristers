import Link from "next/link";
import { redirect } from "next/navigation";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { AppNav } from "@/components/app-nav";
import { listAnnouncements } from "@/lib/announcements";
import { getCurrentUser } from "@/lib/auth";
import {
  formatConcertWhen,
  listUpcomingConcerts,
} from "@/lib/concerts";
import { canPostAnnouncements } from "@/lib/roles";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [announcements, upcoming] = await Promise.all([
    listAnnouncements(5),
    listUpcomingConcerts(),
  ]);
  const canPost = canPostAnnouncements(user.role);
  const nextConcerts = upcoming.slice(0, 3);

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
            <h2>Upcoming concerts</h2>
            <Link href="/app/calendar">Calendar</Link>
          </div>
          {nextConcerts.length === 0 ? (
            <p className="muted">No upcoming concerts yet.</p>
          ) : (
            <div className="song-list">
              {nextConcerts.map((concert) => (
                <article key={concert.id} className="home-concert">
                  <h3>
                    <Link href={`/app/calendar/${concert.id}`}>
                      {concert.title}
                    </Link>
                  </h3>
                  <p className="muted">
                    {formatConcertWhen(concert.startsAt, concert.endsAt)}
                    {concert.location ? ` · ${concert.location}` : ""}
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
