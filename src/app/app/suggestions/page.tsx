import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppSuggestionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav user={user} current="/app/suggestions" />
      <section className="app-card">
        <h2>Song suggestions</h2>
        <p className="muted">
          Members propose title + notes (+ optional file/link). Directors review:
          submitted → reviewing → accepted / declined.
        </p>
      </section>
    </>
  );
}
