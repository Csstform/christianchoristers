"use client";

import { useState, useTransition } from "react";
import {
  deleteAnnouncementAction,
  type AnnouncementActionResult,
} from "@/lib/announcement-actions";

export function AnnouncementDelete({ announcementId }: { announcementId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<AnnouncementActionResult | null>(null);

  return (
    <span className="music-asset-delete">
      <button
        type="button"
        className="btn btn-quiet"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this announcement?")) return;
          startTransition(async () => {
            setMessage(await deleteAnnouncementAction(announcementId));
          });
        }}
      >
        Delete
      </button>
      {message && !message.ok ? (
        <span className="form-error">{message.error}</span>
      ) : null}
    </span>
  );
}
