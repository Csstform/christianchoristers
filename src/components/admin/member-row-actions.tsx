"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions";
import type { UserRole } from "@/db/schema";
import {
  resendMemberInviteAction,
  updateMemberRoleAction,
  updateMemberStatusAction,
} from "@/lib/user-actions";

type MemberActionTarget = {
  id: string;
  name: string;
  role: UserRole;
  status: "invited" | "active" | "disabled";
};

function ActionFeedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) {
    return state.message ? <p className="form-ok">{state.message}</p> : null;
  }
  return <p className="form-error">{state.error}</p>;
}

export function MemberRowActions({
  member,
  isSelf,
}: {
  member: MemberActionTarget;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState<
    ActionResult | null,
    FormData
  >(updateMemberRoleAction, null);
  const [statusState, statusAction, statusPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateMemberStatusAction, null);
  const [inviteState, inviteAction, invitePending] = useActionState<
    ActionResult | null,
    FormData
  >(resendMemberInviteAction, null);

  if (isSelf) {
    return <p className="muted member-self-note">This is you</p>;
  }

  return (
    <div className="member-actions">
      <form className="member-inline-form" action={roleAction}>
        <input type="hidden" name="userId" value={member.id} />
        <label className="sr-only" htmlFor={`role-${member.id}`}>
          Role for {member.name}
        </label>
        <select
          id={`role-${member.id}`}
          name="role"
          defaultValue={member.role}
          disabled={rolePending}
        >
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="director">Director</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-quiet" type="submit" disabled={rolePending}>
          {rolePending ? "Saving…" : "Save role"}
        </button>
      </form>
      <ActionFeedback state={roleState} />

      <form className="member-inline-form" action={statusAction}>
        <input type="hidden" name="userId" value={member.id} />
        <label className="sr-only" htmlFor={`status-${member.id}`}>
          Status for {member.name}
        </label>
        <select
          id={`status-${member.id}`}
          name="status"
          defaultValue={member.status}
          disabled={statusPending}
        >
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <button className="btn-quiet" type="submit" disabled={statusPending}>
          {statusPending ? "Saving…" : "Save status"}
        </button>
      </form>
      <ActionFeedback state={statusState} />

      {member.status !== "active" ? (
        <>
          <form action={inviteAction}>
            <input type="hidden" name="userId" value={member.id} />
            <button
              className="btn-quiet"
              type="submit"
              disabled={invitePending}
            >
              {invitePending ? "Sending…" : "Resend invite"}
            </button>
          </form>
          <ActionFeedback state={inviteState} />
        </>
      ) : null}
    </div>
  );
}
