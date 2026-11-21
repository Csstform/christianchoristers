"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionResult } from "@/lib/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null,
  );

  return (
    <>
      <h1>Member login</h1>
      <p className="muted">Invite-only access for Christian Choristers members.</p>
      <form className="form" action={formAction}>
        <input type="hidden" name="next" value={next} />
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
        <button className="btn btn-dark" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Need an account? Ask an admin for an invite.{" "}
        <Link href="/">Back home</Link>
      </p>
    </>
  );
}
