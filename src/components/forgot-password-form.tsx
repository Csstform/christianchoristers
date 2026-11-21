"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type ActionResult,
} from "@/lib/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(requestPasswordResetAction, null);

  return (
    <>
      <h1>Reset password</h1>
      <p className="muted">
        Enter the email for your member account and we&apos;ll send a reset
        link if it matches an active account.
      </p>
      <form className="form" action={formAction}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
        {state?.ok ? <p className="form-ok">{state.message}</p> : null}
        <button className="btn btn-dark" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link href="/login">Back to login</Link>
      </p>
    </>
  );
}
