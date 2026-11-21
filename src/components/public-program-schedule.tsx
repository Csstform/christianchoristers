import {
  formatProgramDateParts,
  formatProgramWhen,
  listUpcomingPrograms,
} from "@/lib/programs";

export async function PublicProgramSchedule({ limit = 5 }: { limit?: number }) {
  const upcoming = (await listUpcomingPrograms()).slice(0, limit);

  return (
    <section
      id="program-schedule"
      className="section home-schedule"
      aria-labelledby="program-schedule-heading"
    >
      <h2 id="program-schedule-heading">Program schedule</h2>

      {upcoming.length === 0 ? (
        <p className="muted home-schedule__empty">
          No upcoming programs announced yet. Check back soon.
        </p>
      ) : (
        <ul className="home-schedule__list">
          {upcoming.map((program) => {
            const date = formatProgramDateParts(program.startsAt);
            return (
              <li key={program.id} className="home-schedule__item">
                <time
                  className="home-schedule__date"
                  dateTime={program.startsAt.toISOString()}
                  aria-label={formatProgramWhen(program.startsAt, program.endsAt)}
                >
                  <span className="home-schedule__month">{date.month}</span>
                  <span className="home-schedule__day">{date.day}</span>
                  <span className="home-schedule__weekday">{date.weekday}</span>
                </time>
                <div className="home-schedule__body">
                  <h3>{program.title}</h3>
                  <p className="muted">
                    {formatProgramWhen(program.startsAt, program.endsAt)}
                    {program.location ? ` · ${program.location}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
