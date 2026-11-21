import {
  formatConcertDateParts,
  formatConcertWhen,
  listUpcomingConcerts,
} from "@/lib/concerts";

export async function PublicProgramSchedule({ limit = 5 }: { limit?: number }) {
  const upcoming = (await listUpcomingConcerts()).slice(0, limit);

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
          {upcoming.map((concert) => {
            const date = formatConcertDateParts(concert.startsAt);
            return (
              <li key={concert.id} className="home-schedule__item">
                <time
                  className="home-schedule__date"
                  dateTime={concert.startsAt.toISOString()}
                  aria-label={formatConcertWhen(concert.startsAt, concert.endsAt)}
                >
                  <span className="home-schedule__month">{date.month}</span>
                  <span className="home-schedule__day">{date.day}</span>
                  <span className="home-schedule__weekday">{date.weekday}</span>
                </time>
                <div className="home-schedule__body">
                  <h3>{concert.title}</h3>
                  <p className="muted">
                    {formatConcertWhen(concert.startsAt, concert.endsAt)}
                    {concert.location ? ` · ${concert.location}` : ""}
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
