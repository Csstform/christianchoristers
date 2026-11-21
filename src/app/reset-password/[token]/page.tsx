"use client";

import { useActionState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { resetPasswordAction, type ActionResult } from "@/lib/actions";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const boundAction = resetPasswordAction.bind(null, token);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(boundAction, null);

  return (
    <PublicShell solidHeader>
      <div className="auth-panel">
        <h1>Choose a new password</h1>
        <p className="muted">Use at least 10 characters.</p>
        <form className="form" action={formAction}>
          <label>
            New password
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
          {state && !state.ok ? (
            <p className="form-error">{state.error}</p>
          ) : null}
          <button className="btn btn-dark" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1.5rem" }}>
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </PublicShell>
  );
}
