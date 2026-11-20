"use client";

import { useActionState, useTransition } from "react";
import {
  deleteConcertAction,
  updateConcertAction,
  type ConcertActionResult,
} from "@/lib/concert-actions";

export function ConcertEditForm({
  concertId,
  defaults,
}: {
  concertId: string;
  defaults: {
    title: string;
    location: string;
    startsAt: string;
    endsAt: string;
    details: string;
  };
}) {
  const action = updateConcertAction.bind(null, concertId);
  const [state, formAction, pending] = useActionState<
    ConcertActionResult | null,
    FormData
  >(action, null);
  const [deleting, startDelete] = useTransition();

  return (
    <div>
      <form className="form music-form" action={formAction}>
        <label>
          Title
          <input name="title" required defaultValue={defaults.title} />
        </label>
        <label>
          Location
          <input name="location" defaultValue={defaults.location} />
        </label>
        <div className="music-form__row">
          <label>
            Starts
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={defaults.startsAt}
            />
          </label>
          <label>
            Ends (optional)
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={defaults.endsAt}
            />
          </label>
        </div>
        <label>
          Details
          <textarea name="details" rows={3} defaultValue={defaults.details} />
        </label>
        {state?.ok ? <p className="form-ok">{state.message}</p> : null}
        {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
        <button className="btn btn-dark" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save concert"}
        </button>
      </form>
      <div className="music-actions">
        <button
          type="button"
          className="btn btn-danger"
          disabled={deleting}
          onClick={() => {
            if (!confirm("Delete this concert and all RSVPs?")) return;
            startDelete(async () => {
              await deleteConcertAction(concertId);
            });
          }}
        >
          {deleting ? "Deleting…" : "Delete concert"}
        </button>
      </div>
    </div>
  );
}
