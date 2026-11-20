import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ConcertCreateForm } from "@/components/calendar/concert-create-form";
import { getCurrentUser } from "@/lib/auth";
import {
  formatConcertWhen,
  listPastConcerts,
  listUpcomingConcerts,
} from "@/lib/concerts";
import { canManageConcerts } from "@/lib/roles";

function ConcertList({
  title,
  concerts,
}: {
  title: string;
  concerts: Awaited<ReturnType<typeof listUpcomingConcerts>>;
}) {
  return (
    <section className="calendar-section">
      <h3>{title}</h3>
      {concerts.length === 0 ? (
        <p className="muted">None yet.</p>
      ) : (
        <div className="song-list">
          {concerts.map((concert) => (
            <article key={concert.id} className="song-card">
              <div className="song-card__header">
                <div>
                  <h3>
                    <Link href={`/app/calendar/${concert.id}`}>{concert.title}</Link>
                  </h3>
                  <p className="muted">
                    {formatConcertWhen(concert.startsAt, concert.endsAt)}
                    {concert.location ? ` · ${concert.location}` : ""}
                  </p>
                </div>
                <Link className="btn btn-quiet" href={`/app/calendar/${concert.id}`}>
                  RSVP / details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AppCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const upcoming = await listUpcomingConcerts();
  const past = await listPastConcerts();
  const manager = canManageConcerts(user.role);

  return (
    <>
      <AppNav user={user} current="/app/calendar" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Concert calendar</h2>
            <p className="muted">
              RSVP for each concert. Responses are visible to every member.
            </p>
          </div>
        </div>

        {manager ? (
          <details className="music-details" open={upcoming.length === 0}>
            <summary>Add a concert</summary>
            <ConcertCreateForm />
          </details>
        ) : null}

        <ConcertList title="Upcoming" concerts={upcoming} />
        <ConcertList title="Past" concerts={past} />
      </section>
    </>
  );
}
