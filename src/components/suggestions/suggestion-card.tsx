import { SuggestionReviewActions } from "@/components/suggestions/suggestion-review-actions";
import {
  isStoredSuggestionFile,
  type SuggestionStatus,
} from "@/lib/suggestions";

type Item = {
  id: string;
  title: string;
  notes: string | null;
  linkOrPath: string | null;
  status: SuggestionStatus;
  submitterName: string;
  submittedById: string;
  createdAt: Date;
  updatedAt: Date;
};

export function SuggestionCard({
  item,
  currentUserId,
  canReview,
}: {
  item: Item;
  currentUserId: string;
  canReview: boolean;
}) {
  const canDelete =
    canReview ||
    (item.submittedById === currentUserId &&
      (item.status === "submitted" || item.status === "reviewing"));

  return (
    <article className="song-card">
      <div className="song-card__header">
        <div>
          <h3>{item.title}</h3>
          <p className="muted">
            Suggested by {item.submitterName} ·{" "}
            {item.createdAt.toLocaleString("en-US", {
              timeZone: "America/Detroit",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`song-pill song-pill--${item.status}`}>
          {item.status}
        </span>
      </div>

      {item.notes ? <p className="announcement-body">{item.notes}</p> : null}

      {item.linkOrPath ? (
        <p className="suggestion-link">
          {isStoredSuggestionFile(item.linkOrPath) ? (
            <a href={`/api/suggestions/${item.id}/file`}>Download attached file</a>
          ) : (
            <a href={item.linkOrPath} target="_blank" rel="noreferrer">
              Open link
            </a>
          )}
        </p>
      ) : null}

      <SuggestionReviewActions
        key={`${item.id}-${item.status}-${item.updatedAt.toISOString()}`}
        suggestionId={item.id}
        status={item.status}
        canReview={canReview}
        canDelete={canDelete}
      />
    </article>
  );
}
