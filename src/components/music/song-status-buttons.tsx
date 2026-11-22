"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deleteSongAction,
  setSongStatusAction,
  type MusicActionResult,
} from "@/lib/music-actions";

export function SongStatusButtons({
  songId,
  status,
  canArchive,
}: {
  songId: string;
  status: "active" | "archive";
  canArchive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<MusicActionResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  if (!canArchive) return null;

  function run(action: () => Promise<MusicActionResult>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result);
      if (result.ok) {
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="music-actions">
      {status === "active" ? (
        <button
          type="button"
          className="btn btn-quiet"
          disabled={pending}
          onClick={() => {
            setConfirmDelete(false);
            run(() => setSongStatusAction(songId, "archive"));
          }}
        >
          Move to archive
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-quiet"
          disabled={pending}
          onClick={() => {
            setConfirmDelete(false);
            run(() => setSongStatusAction(songId, "active"));
          }}
        >
          Restore to active
        </button>
      )}
      <button
        type="button"
        className={confirmDelete ? "btn btn-danger is-confirming" : "btn btn-danger"}
        disabled={pending}
        aria-pressed={confirmDelete}
        onClick={() => {
          if (!confirmDelete) {
            setConfirmDelete(true);
            setMessage(null);
            return;
          }
          run(() => deleteSongAction(songId));
        }}
      >
        {pending && confirmDelete
          ? "Deleting…"
          : confirmDelete
            ? "Press again to confirm"
            : "Delete"}
      </button>
      {message?.ok ? <p className="form-ok">{message.message}</p> : null}
      {message && !message.ok ? (
        <p className="form-error">{message.error}</p>
      ) : null}
    </div>
  );
}
