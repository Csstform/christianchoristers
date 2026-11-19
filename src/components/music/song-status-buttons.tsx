"use client";

import { useState, useTransition } from "react";
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

  if (!canArchive) return null;

  function run(action: () => Promise<MusicActionResult>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result);
    });
  }

  return (
    <div className="music-actions">
      {status === "active" ? (
        <button
          type="button"
          className="btn btn-quiet"
          disabled={pending}
          onClick={() => run(() => setSongStatusAction(songId, "archive"))}
        >
          Move to archive
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-quiet"
          disabled={pending}
          onClick={() => run(() => setSongStatusAction(songId, "active"))}
        >
          Restore to active
        </button>
      )}
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this song and its files from the library?")) {
            return;
          }
          run(() => deleteSongAction(songId));
        }}
      >
        Delete
      </button>
      {message?.ok ? <p className="form-ok">{message.message}</p> : null}
      {message && !message.ok ? (
        <p className="form-error">{message.error}</p>
      ) : null}
    </div>
  );
}
