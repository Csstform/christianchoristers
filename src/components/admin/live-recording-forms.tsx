"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createLiveRecordingAction,
  deleteLiveRecordingAction,
  updateLiveRecordingAction,
  type LiveRecordingActionResult,
} from "@/lib/live-recording-actions";
import type { LiveRecordingRow } from "@/lib/live-recordings";

export function LiveRecordingCreateForm() {
  const [state, formAction, pending] = useActionState<
    LiveRecordingActionResult | null,
    FormData
  >(createLiveRecordingAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form className="form music-form" action={formAction}>
      <label>
        Title
        <input name="title" required placeholder="Service or reunion title" />
      </label>
      <div className="music-form__row">
        <label>
          Location
          <input name="location" placeholder="City, state" />
        </label>
        <label>
          Year
          <input name="recordedYear" type="number" min={1900} max={2100} />
        </label>
      </div>
      <div className="music-form__row">
        <label>
          Sort order
          <input name="sortOrder" type="number" step={1} defaultValue={0} />
        </label>
        <label className="catalog-album-card__check">
          <input type="checkbox" name="published" defaultChecked />
          Published
        </label>
      </div>
      <label>
        YouTube URL
        <input
          name="youtubeUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=… or playlist"
        />
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add live recording"}
      </button>
    </form>
  );
}

export function LiveRecordingEditForm({
  recording,
}: {
  recording: LiveRecordingRow;
}) {
  const router = useRouter();
  const action = updateLiveRecordingAction.bind(null, recording.id);
  const [state, formAction, pending] = useActionState<
    LiveRecordingActionResult | null,
    FormData
  >(action, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  return (
    <article className="song-card catalog-album-card">
      <div className="song-card__header">
        <div>
          <h3>{recording.title}</h3>
          <p className="muted">
            {recording.location}
            {recording.recordedYear ? ` · ${recording.recordedYear}` : ""}
            {recording.published ? " · Published" : " · Hidden"}
          </p>
        </div>
      </div>
      <form className="form music-form" action={formAction}>
        <label>
          Title
          <input name="title" required defaultValue={recording.title} />
        </label>
        <div className="music-form__row">
          <label>
            Location
            <input name="location" defaultValue={recording.location ?? ""} />
          </label>
          <label>
            Year
            <input
              name="recordedYear"
              type="number"
              min={1900}
              max={2100}
              defaultValue={recording.recordedYear ?? ""}
            />
          </label>
        </div>
        <div className="music-form__row">
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              step={1}
              defaultValue={recording.sortOrder}
            />
          </label>
          <label className="catalog-album-card__check">
            <input
              type="checkbox"
              name="published"
              defaultChecked={recording.published}
            />
            Published
          </label>
        </div>
        <label>
          YouTube URL
          <input
            name="youtubeUrl"
            type="url"
            defaultValue={recording.youtubeUrl ?? ""}
          />
        </label>
        {state?.ok ? <p className="form-ok">{state.message}</p> : null}
        {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
        <button className="btn btn-dark" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save recording"}
        </button>
      </form>
      <button
        type="button"
        className={confirmDelete ? "btn btn-danger is-confirming" : "btn btn-danger"}
        disabled={deleting}
        onClick={() => {
          if (!confirmDelete) {
            setConfirmDelete(true);
            setDeleteError(null);
            return;
          }
          startDelete(async () => {
            const result = await deleteLiveRecordingAction(recording.id);
            if (!result.ok) {
              setDeleteError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {deleting
          ? "Deleting…"
          : confirmDelete
            ? "Press again to confirm"
            : "Delete recording"}
      </button>
      {deleteError ? <p className="form-error">{deleteError}</p> : null}
    </article>
  );
}
