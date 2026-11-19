"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SongAssetUpload({ songId }: { songId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  return (
    <form
      className="form music-upload"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setOk(null);
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const response = await fetch(`/api/music/songs/${songId}/assets`, {
            method: "POST",
            body: data,
          });
          const payload = (await response.json().catch(() => null)) as
            | { ok?: boolean; error?: string }
            | null;
          if (!response.ok) {
            setError(payload?.error || "Upload failed.");
            return;
          }
          setOk("File uploaded.");
          form.reset();
          router.refresh();
        });
      }}
    >
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
      {ok ? <p className="form-ok">{ok}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
