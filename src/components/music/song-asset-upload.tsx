"use client";

import { useActionState } from "react";
import {
  uploadSongAssetAction,
  type MusicActionResult,
} from "@/lib/music-actions";

export function SongAssetUpload({ songId }: { songId: string }) {
  const action = uploadSongAssetAction.bind(null, songId);
  const [state, formAction, pending] = useActionState<
    MusicActionResult | null,
    FormData
  >(action, null);

  return (
    <form className="form music-upload" action={formAction}>
      <div className="music-form__row">
        <label>
          Type
          <select name="kind" defaultValue="sheet_pdf">
            <option value="sheet_pdf">Sheet music (PDF)</option>
            <option value="rehearsal_audio">Rehearsal audio</option>
          </select>
        </label>
        <label>
          Label
          <input name="label" placeholder="Optional label" />
        </label>
      </div>
      <label>
        File
        <input name="file" type="file" required />
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
