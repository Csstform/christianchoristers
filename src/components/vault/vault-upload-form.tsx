"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function VaultUploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  return (
    <form
      className="form music-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setOk(null);
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const response = await fetch("/api/vault/files", {
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
      <label>
        Display name
        <input name="name" placeholder="Optional — defaults to filename" />
      </label>
      <label>
        File
        <input name="file" type="file" required />
      </label>
      <p className="muted">
        Allowed: PDF, images, audio, text/CSV, Office docs, ZIP (25MB max).
      </p>
      {ok ? <p className="form-ok">{ok}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload to vault"}
      </button>
    </form>
  );
}
