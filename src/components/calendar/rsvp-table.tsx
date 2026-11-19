type RsvpRow = {
  id: string;
  userName: string;
  coming: "yes" | "no";
  practiceSaturday: "yes" | "no";
  programSaturday: "yes" | "no";
  programSunday: "yes" | "no";
  needHousing: "yes" | "no";
  housingDays: string | null;
  housingPeople: number | null;
  notes: string | null;
};

function yn(value: "yes" | "no") {
  return value === "yes" ? "Yes" : "No";
}

export function RsvpTable({ rows }: { rows: RsvpRow[] }) {
  if (rows.length === 0) {
    return <p className="muted">No RSVPs yet.</p>;
  }

  const comingCount = rows.filter((r) => r.coming === "yes").length;

  return (
    <div className="rsvp-table-wrap">
      <p className="muted">
        {comingCount} coming · {rows.length} response{rows.length === 1 ? "" : "s"}{" "}
        (visible to all members)
      </p>
      <div className="rsvp-table-scroll">
        <table className="rsvp-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Coming</th>
              <th>Practice Sat</th>
              <th>Program Sat</th>
              <th>Program Sun</th>
              <th>Housing</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.userName}</td>
                <td>{yn(row.coming)}</td>
                <td>{yn(row.practiceSaturday)}</td>
                <td>{yn(row.programSaturday)}</td>
                <td>{yn(row.programSunday)}</td>
                <td>
                  {row.needHousing === "yes"
                    ? `Yes · ${row.housingDays ?? "—"} · ${row.housingPeople ?? "—"} ppl`
                    : "No"}
                </td>
                <td>{row.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
