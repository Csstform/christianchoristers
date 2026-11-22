"use client";

import { useActionState } from "react";
import {
  updateAlbumSetUrlAction,
  updateStreamingLinksAction,
  type SiteSettingsActionResult,
} from "@/lib/site-settings-actions";
import type { StreamingLink } from "@/lib/site-settings";

export function StreamingLinksForm({ links }: { links: StreamingLink[] }) {
  const [state, formAction, pending] = useActionState<
    SiteSettingsActionResult | null,
    FormData
  >(updateStreamingLinksAction, null);

  const rows = links.length > 0 ? links : [{ label: "", href: "" }];

  return (
    <form className="form music-form" action={formAction}>
      {rows.map((link, index) => (
        <div className="music-form__row" key={`${link.label}-${index}`}>
          <label>
            Label
            <input
              name="label"
              required
              defaultValue={link.label}
              placeholder="Spotify"
            />
          </label>
          <label>
            URL
            <input
              name="href"
              type="url"
              required
              defaultValue={link.href}
              placeholder="https://…"
            />
          </label>
        </div>
      ))}
      <p className="muted">
        To add another link, save once, then ask an admin to insert a blank row
        by clearing and re-saving with an extra pair—or edit the three common
        destinations in place.
      </p>
      {/* Extra blank row for adding one more link */}
      <div className="music-form__row">
        <label>
          Label (optional new)
          <input name="label" placeholder="New service" />
        </label>
        <label>
          URL (optional new)
          <input name="href" type="url" placeholder="https://…" />
        </label>
      </div>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save streaming links"}
      </button>
    </form>
  );
}

export function AlbumSetUrlForm({ albumSetUrl }: { albumSetUrl: string }) {
  const [state, formAction, pending] = useActionState<
    SiteSettingsActionResult | null,
    FormData
  >(updateAlbumSetUrlAction, null);

  return (
    <form className="form music-form" action={formAction}>
      <label>
        Set of 8 CDs URL
        <input
          name="albumSetUrl"
          type="url"
          required
          defaultValue={albumSetUrl}
        />
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save album set URL"}
      </button>
    </form>
  );
}
