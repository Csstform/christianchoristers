"use client";

import { useState, useTransition } from "react";
import {
  deleteVaultFileAction,
  type VaultActionResult,
} from "@/lib/vault-actions";

export function VaultFileDelete({ fileId }: { fileId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<VaultActionResult | null>(null);

  return (
    <span className="music-asset-delete">
      <button
        type="button"
        className="btn btn-quiet"
        disabled={pending}
        onClick={() => {
          if (!confirm("Remove this file from the vault?")) return;
          startTransition(async () => {
            setMessage(await deleteVaultFileAction(fileId));
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
