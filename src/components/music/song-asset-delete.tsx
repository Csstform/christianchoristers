"use client";

import { useState, useTransition } from "react";
import {
  deleteSongAssetAction,
  type MusicActionResult,
} from "@/lib/music-actions";

export function SongAssetDelete({ assetId }: { assetId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<MusicActionResult | null>(null);

  return (
    <span className="music-asset-delete">
      <button
        type="button"
        className="btn btn-quiet"
        disabled={pending}
        onClick={() => {
          if (!confirm("Remove this file?")) return;
          startTransition(async () => {
            setMessage(await deleteSongAssetAction(assetId));
          });
        }}
      >
        Remove
      </button>
      {message && !message.ok ? (
        <span className="form-error">{message.error}</span>
      ) : null}
    </span>
  );
}
