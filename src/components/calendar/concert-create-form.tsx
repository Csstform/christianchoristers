"use client";

import { useActionState } from "react";
import {
  createConcertAction,
  type ConcertActionResult,
} from "@/lib/concert-actions";

export function ConcertCreateForm() {
  const [state, formAction, pending] = useActionState<
    ConcertActionResult | null,
    FormData
  >(createConcertAction, null);

  return (
    <form className="form music-form" action={formAction}>
      <label>
        Title
        <input name="title" required placeholder="Concert or weekend title" />
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
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create concert"}
      </button>
    </form>
  );
}
