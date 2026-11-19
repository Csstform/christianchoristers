"use client";

import { useActionState } from "react";
import { inviteUserAction, type ActionResult } from "@/lib/actions";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    inviteUserAction,
    null,
  );

  return (
    <form className="form" action={formAction}>
      <label>
        Name
        <input name="name" required />
      </label>
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <label>
        Role
        <select name="role" defaultValue="member">
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="director">Director</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
