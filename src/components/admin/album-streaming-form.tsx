"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateAlbumStreamingAction,
  type CatalogActionResult,
} from "@/lib/catalog-actions";
import type { PublicAlbum } from "@/lib/catalog";

export function AlbumStreamingForm({
  album,
  hasLocalAudio,
}: {
  album: PublicAlbum;
  hasLocalAudio: boolean;
}) {
  const router = useRouter();
  const updateAction = updateAlbumStreamingAction.bind(null, album.id);

  const [updateState, updateFormAction, updatePending] = useActionState<
    CatalogActionResult | null,
    FormData
  >(updateAction, null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  useEffect(() => {
    if (updateState?.ok) {
      router.refresh();
    }
  }, [updateState, router]);

  return (
    <article className="song-card catalog-album-card">
      <div className="song-card__header">
        <div>
          <h3>{album.title}</h3>
          <p className="muted">
            <code>{album.slug}</code>
            {album.published ? " · Published" : " · Hidden"}
            {hasLocalAudio ? " · Local audio on server" : ""}
          </p>
        </div>
      </div>

      <form className="form music-form" action={updateFormAction}>
        <label>
          Title
          <input name="title" required defaultValue={album.title} />
        </label>
        <div className="music-form__row">
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              step={1}
              required
              defaultValue={album.sortOrder}
            />
          </label>
          <label className="catalog-album-card__check">
            <input
              type="checkbox"
              name="published"
              defaultChecked={album.published}
            />
            Show on public /music
          </label>
        </div>
        <label>
          Spotify album URL
          <input
            name="spotifyUrl"
            type="url"
            placeholder="https://open.spotify.com/album/…"
            defaultValue={album.spotifyUrl ?? ""}
          />
        </label>
        <label>
          Buy CD / MP3 URL
          <input
            name="cdUrl"
            type="url"
            placeholder="https://melttheheart.com/…"
            defaultValue={album.cdUrl ?? ""}
          />
        </label>
        {hasLocalAudio || album.localAudioPath ? (
          <label className="catalog-album-card__check">
            <input type="checkbox" name="clearLocalAudio" />
            Remove local streaming audio
          </label>
        ) : null}
        {updateState?.ok ? (
          <p className="form-ok">{updateState.message}</p>
        ) : null}
        {updateState && !updateState.ok ? (
          <p className="form-error">{updateState.error}</p>
        ) : null}
        <button className="btn btn-dark" type="submit" disabled={updatePending}>
          {updatePending ? "Saving…" : "Save streaming links"}
        </button>
      </form>

      <form
        className="form music-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setUploadError(null);
          setUploadOk(null);
          startUpload(async () => {
            try {
              const response = await fetch(
                `/api/admin/catalog/albums/${album.id}/audio`,
                {
                  method: "POST",
                  body: data,
                  credentials: "same-origin",
                },
              );
              const payload = (await response.json().catch(() => null)) as
                | { ok?: boolean; error?: string }
                | null;
              if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || "Upload failed.");
              }
              form.reset();
              setUploadOk("Local streaming audio saved.");
              router.refresh();
            } catch (error) {
              setUploadError(
                error instanceof Error ? error.message : "Upload failed.",
              );
            }
          });
        }}
      >
        <label>
          Local streaming audio (optional)
          <input
            name="file"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
            required
          />
        </label>
        <p className="muted">
          Used when Spotify is empty. Replaces any existing local file for this
          album.
        </p>
        {uploadOk ? <p className="form-ok">{uploadOk}</p> : null}
        {uploadError ? <p className="form-error">{uploadError}</p> : null}
        <button className="btn btn-quiet" type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload local audio"}
        </button>
      </form>
    </article>
  );
}
