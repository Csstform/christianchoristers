"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SuggestionSubmitForm() {
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
          const response = await fetch("/api/suggestions", {
            method: "POST",
            body: data,
          });
          const payload = (await response.json().catch(() => null)) as
            | { ok?: boolean; error?: string }
            | null;
          if (!response.ok) {
            setError(payload?.error || "Could not submit suggestion.");
            return;
          }
          setOk("Suggestion submitted.");
          form.reset();
          router.refresh();
        });
      }}
    >
      <label>
        Song title
        <input name="title" required maxLength={255} placeholder="Proposed song" />
      </label>
      <label>
        Notes
        <textarea
          name="notes"
          rows={3}
          placeholder="Why this song? Arranger, key, etc."
        />
      </label>
      <label>
        Link (optional)
        <input
          name="link"
          type="url"
          placeholder="https://…"
        />
      </label>
      <label>
        Or attach a file (optional)
        <input name="file" type="file" />
      </label>
      <p className="muted">
        Provide a link or a file, not both. Allowed files match the vault types.
      </p>
      {ok ? <p className="form-ok">{ok}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}
