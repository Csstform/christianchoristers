"use client";

import { useActionState } from "react";
import { useParams } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { acceptInviteAction, type ActionResult } from "@/lib/actions";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const boundAction = acceptInviteAction.bind(null, token);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  );

  return (
    <PublicShell solidHeader>
      <div className="auth-panel">
        <h1>Set your password</h1>
        <p className="muted">Accept your invite to open the member app.</p>
        <form className="form" action={formAction}>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              name="confirm"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </label>
          {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
          <button className="btn btn-dark" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Activate account"}
          </button>
        </form>
      </div>
    </PublicShell>
  );
}
