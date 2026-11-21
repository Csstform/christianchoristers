import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { ProgramEditForm } from "@/components/calendar/program-edit-form";
import { RsvpForm } from "@/components/calendar/rsvp-form";
import { RsvpTable } from "@/components/calendar/rsvp-table";
import { getCurrentUser } from "@/lib/auth";
import {
  formatProgramWhen,
  getProgram,
  getUserRsvp,
  listRsvpsForProgram,
  toDatetimeLocalValue,
} from "@/lib/programs";
import { canManagePrograms } from "@/lib/roles";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const program = await getProgram(id);
  if (!program) notFound();

  const [mine, all] = await Promise.all([
    getUserRsvp(program.id, user.id),
    listRsvpsForProgram(program.id),
  ]);
  const manager = canManagePrograms(user.role);

  return (
    <>
      <AppNav user={user} current="/app/calendar" />
      <section className="app-card music-library">
        <p className="muted">
          <Link href="/app/calendar">← Back to calendar</Link>
        </p>
        <div className="music-library__intro">
          <div>
            <h2>{program.title}</h2>
            <p className="muted">
              {formatProgramWhen(program.startsAt, program.endsAt)}
              {program.location ? ` · ${program.location}` : ""}
            </p>
            {program.details ? <p>{program.details}</p> : null}
          </div>
        </div>

        <section className="calendar-section">
          <h3>Your RSVP</h3>
          <RsvpForm
            key={mine?.updatedAt?.toISOString() ?? "new-rsvp"}
            programId={program.id}
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
            <summary>Edit program</summary>
            <ProgramEditForm
              programId={program.id}
              defaults={{
                title: program.title,
                location: program.location ?? "",
                startsAt: toDatetimeLocalValue(program.startsAt),
                endsAt: program.endsAt
                  ? toDatetimeLocalValue(program.endsAt)
                  : "",
                details: program.details ?? "",
              }}
            />
          </details>
        ) : null}
      </section>
    </>
  );
}
