"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteSuggestionAction,
  setSuggestionStatusAction,
  type SuggestionActionResult,
} from "@/lib/suggestion-actions";
import type { SuggestionStatus } from "@/lib/suggestions";

const STATUSES: SuggestionStatus[] = [
  "submitted",
  "reviewing",
  "accepted",
  "declined",
];

export function SuggestionReviewActions({
  suggestionId,
  status,
  canReview,
  canDelete,
}: {
  suggestionId: string;
  status: SuggestionStatus;
  canReview: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<SuggestionActionResult | null>(null);

  function run(action: () => Promise<SuggestionActionResult>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="suggestion-actions">
      {canReview ? (
        <label className="suggestion-status">
          Status
          <select
            defaultValue={status}
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value as SuggestionStatus;
              run(() => setSuggestionStatusAction(suggestionId, next));
            }}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          className="btn btn-quiet"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this suggestion?")) return;
            run(() => deleteSuggestionAction(suggestionId));
          }}
        >
          Delete
        </button>
      ) : null}
      {message?.ok ? <p className="form-ok">{message.message}</p> : null}
      {message && !message.ok ? (
        <p className="form-error">{message.error}</p>
      ) : null}
    </div>
  );
}
