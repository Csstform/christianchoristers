import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProgramCreateForm } from "@/components/calendar/program-create-form";
import { getCurrentUser } from "@/lib/auth";
import {
  formatProgramWhen,
  listPastPrograms,
  listUpcomingPrograms,
} from "@/lib/programs";
import { canManagePrograms } from "@/lib/roles";

function ProgramList({
  title,
  programs,
}: {
  title: string;
  programs: Awaited<ReturnType<typeof listUpcomingPrograms>>;
}) {
  return (
    <section className="calendar-section">
      <h3>{title}</h3>
      {programs.length === 0 ? (
        <p className="muted">None yet.</p>
      ) : (
        <div className="song-list">
          {programs.map((program) => (
            <article key={program.id} className="song-card">
              <div className="song-card__header">
                <div>
                  <h3>
                    <Link href={`/app/calendar/${program.id}`}>{program.title}</Link>
                  </h3>
                  <p className="muted">
                    {formatProgramWhen(program.startsAt, program.endsAt)}
                    {program.location ? ` · ${program.location}` : ""}
                    {program.isPublic ? " · Public schedule" : ""}
                  </p>
                </div>
                <Link className="btn btn-quiet" href={`/app/calendar/${program.id}`}>
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

  const upcoming = await listUpcomingPrograms();
  const past = await listPastPrograms();
  const manager = canManagePrograms(user.role);

  return (
    <>
      <AppNav user={user} current="/app/calendar" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Program calendar</h2>
            <p className="muted">
              RSVP for each program. Responses are visible to every member.
            </p>
          </div>
        </div>

        {manager ? (
          <details className="music-details" open={upcoming.length === 0}>
            <summary>Add a program</summary>
            <ProgramCreateForm />
          </details>
        ) : null}

        <ProgramList title="Upcoming" programs={upcoming} />
        <ProgramList title="Past" programs={past} />
      </section>
    </>
  );
}
