import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ConcertEditForm } from "@/components/calendar/concert-edit-form";
import { RsvpForm } from "@/components/calendar/rsvp-form";
import { RsvpTable } from "@/components/calendar/rsvp-table";
import { getCurrentUser } from "@/lib/auth";
import {
  formatConcertWhen,
  getConcert,
  getUserRsvp,
  listRsvpsForConcert,
  toDatetimeLocalValue,
} from "@/lib/concerts";
import { canManageConcerts } from "@/lib/roles";

export default async function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const concert = await getConcert(id);
  if (!concert) notFound();

  const [mine, all] = await Promise.all([
    getUserRsvp(concert.id, user.id),
    listRsvpsForConcert(concert.id),
  ]);
  const manager = canManageConcerts(user.role);

  return (
    <>
      <AppNav user={user} current="/app/calendar" />
      <section className="app-card music-library">
        <p className="muted">
          <Link href="/app/calendar">← Back to calendar</Link>
        </p>
        <div className="music-library__intro">
          <div>
            <h2>{concert.title}</h2>
            <p className="muted">
              {formatConcertWhen(concert.startsAt, concert.endsAt)}
              {concert.location ? ` · ${concert.location}` : ""}
            </p>
            {concert.details ? <p>{concert.details}</p> : null}
          </div>
        </div>

        <section className="calendar-section">
          <h3>Your RSVP</h3>
          <RsvpForm
            key={mine?.updatedAt?.toISOString() ?? "new-rsvp"}
            concertId={concert.id}
            defaults={{
              coming: mine?.coming ?? "no",
              practiceSaturday: mine?.practiceSaturday ?? "no",
              programSaturday: mine?.programSaturday ?? "no",
              programSunday: mine?.programSunday ?? "no",
              needHousing: mine?.needHousing ?? "no",
              housingDays: mine?.housingDays ?? "",
              housingPeople:
                mine?.housingPeople != null ? String(mine.housingPeople) : "",
              notes: mine?.notes ?? "",
            }}
          />
        </section>

        <section className="calendar-section">
          <h3>All RSVPs</h3>
          <RsvpTable rows={all} />
        </section>

        {manager ? (
          <details className="music-details">
            <summary>Edit concert</summary>
            <ConcertEditForm
              concertId={concert.id}
              defaults={{
                title: concert.title,
                location: concert.location ?? "",
                startsAt: toDatetimeLocalValue(concert.startsAt),
                endsAt: concert.endsAt
                  ? toDatetimeLocalValue(concert.endsAt)
                  : "",
                details: concert.details ?? "",
              }}
            />
          </details>
        ) : null}
      </section>
    </>
  );
}
