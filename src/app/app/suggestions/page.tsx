import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";
import { SuggestionSubmitForm } from "@/components/suggestions/suggestion-submit-form";
import { getCurrentUser } from "@/lib/auth";
import { canReviewSuggestions } from "@/lib/roles";
import { listSuggestions } from "@/lib/suggestions";

export default async function AppSuggestionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await listSuggestions();
  const canReview = canReviewSuggestions(user.role);
  const open = items.filter(
    (item) => item.status === "submitted" || item.status === "reviewing",
  );
  const closed = items.filter(
    (item) => item.status === "accepted" || item.status === "declined",
  );

  return (
    <>
      <AppNav user={user} current="/app/suggestions" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Song suggestions</h2>
            <p className="muted">
              Propose songs for future repertoire. Directors review:
              submitted → reviewing → accepted / declined.
            </p>
          </div>
        </div>

        <details className="music-details" open>
          <summary>Suggest a song</summary>
          <SuggestionSubmitForm />
        </details>

        <section className="calendar-section">
          <h3>Open for review ({open.length})</h3>
          {open.length === 0 ? (
            <p className="muted">No open suggestions.</p>
          ) : (
            <div className="song-list">
              {open.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  currentUserId={user.id}
                  canReview={canReview}
                />
              ))}
            </div>
          )}
        </section>

        <section className="calendar-section">
          <h3>Reviewed ({closed.length})</h3>
          {closed.length === 0 ? (
            <p className="muted">No reviewed suggestions yet.</p>
          ) : (
            <div className="song-list">
              {closed.map((item) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  currentUserId={user.id}
                  canReview={canReview}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
