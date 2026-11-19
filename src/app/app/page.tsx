import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav user={user} current="/app" />
      <div className="app-card-grid">
        <section className="app-card">
          <h2>Announcements</h2>
          <p className="muted">
            Posts and email alerts land here next. Managers and above can publish.
          </p>
        </section>
        <section className="app-card">
          <h2>Upcoming concerts</h2>
          <p className="muted">
            Calendar + shared RSVPs (coming, practice Saturday, programs, housing).
          </p>
        </section>
      </div>
    </>
  );
}
