import { MemberRowActions } from "@/components/admin/member-row-actions";
import type { ManagedUser } from "@/lib/users";

function formatJoined(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Detroit",
  }).format(date);
}

export function MemberList({
  members,
  currentUserId,
}: {
  members: ManagedUser[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return <p className="muted">No members yet.</p>;
  }

  return (
    <div className="rsvp-table-wrap">
      <div className="rsvp-table-scroll">
        <table className="rsvp-table members-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Joined</th>
              <th scope="col">Manage</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>{member.name}</strong>
                </td>
                <td>{member.email}</td>
                <td>
                  <span className={`member-pill member-pill--${member.role}`}>
                    {member.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`member-pill member-pill--${member.status}`}
                  >
                    {member.status}
                  </span>
                </td>
                <td>{formatJoined(member.createdAt)}</td>
                <td>
                  <MemberRowActions
                    member={{
                      id: member.id,
                      name: member.name,
                      role: member.role,
                      status: member.status,
                    }}
                    isSelf={member.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
