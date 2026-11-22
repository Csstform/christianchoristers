"use client";

import { useActionState } from "react";
import {
  createProgramAction,
  type ProgramActionResult,
} from "@/lib/program-actions";

export function ProgramCreateForm() {
  const [state, formAction, pending] = useActionState<
    ProgramActionResult | null,
    FormData
  >(createProgramAction, null);

  return (
    <form className="form music-form" action={formAction}>
      <label>
        Title
        <input name="title" required placeholder="Program or weekend title" />
      </label>
      <label>
        Location
        <input name="location" placeholder="City, church, etc." />
      </label>
      <div className="music-form__row">
        <label>
          Starts
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          Ends (optional)
          <input name="endsAt" type="datetime-local" />
        </label>
      </div>
      <label>
        Details
        <textarea name="details" rows={3} placeholder="Schedule notes, hosts, etc." />
      </label>
      <label className="catalog-album-card__check">
        <input type="checkbox" name="isPublic" />
        Show on public home schedule
      </label>
      <p className="muted">
        Leave unchecked for internal weekends. Only checked programs appear on
        the public home page.
      </p>
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create program"}
      </button>
    </form>
  );
}
