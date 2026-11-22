"use client";

import { useActionState, useTransition } from "react";
import {
  deleteProgramAction,
  updateProgramAction,
  type ProgramActionResult,
} from "@/lib/program-actions";

export function ProgramEditForm({
  programId,
  defaults,
}: {
  programId: string;
  defaults: {
    title: string;
    location: string;
    startsAt: string;
    endsAt: string;
    details: string;
    isPublic: boolean;
  };
}) {
  const action = updateProgramAction.bind(null, programId);
  const [state, formAction, pending] = useActionState<
    ProgramActionResult | null,
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
        <label className="catalog-album-card__check">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={defaults.isPublic}
          />
          Show on public home schedule
        </label>
        {state?.ok ? <p className="form-ok">{state.message}</p> : null}
        {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
        <button className="btn btn-dark" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save program"}
        </button>
      </form>
      <div className="music-actions">
        <button
          type="button"
          className="btn btn-danger"
          disabled={deleting}
          onClick={() => {
            if (!confirm("Delete this program and all RSVPs?")) return;
            startDelete(async () => {
              await deleteProgramAction(programId);
            });
          }}
        >
          {deleting ? "Deleting…" : "Delete program"}
        </button>
      </div>
    </div>
  );
}
