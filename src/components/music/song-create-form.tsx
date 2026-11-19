"use client";

import { useActionState } from "react";
import {
  createSongAction,
  type MusicActionResult,
} from "@/lib/music-actions";

export function SongCreateForm() {
  const [state, formAction, pending] = useActionState<
    MusicActionResult | null,
    FormData
  >(createSongAction, null);

  return (
    <form className="form music-form" action={formAction}>
      <div className="music-form__row">
        <label>
          Title
          <input name="title" required placeholder="Song title" />
        </label>
        <label>
          Status
          <select name="status" defaultValue="active">
            <option value="active">Active</option>
            <option value="archive">Archive</option>
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea name="notes" rows={2} placeholder="Optional notes" />
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add song"}
      </button>
    </form>
  );
}
