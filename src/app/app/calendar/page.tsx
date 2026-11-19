import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav user={user} current="/app/calendar" />
      <section className="app-card">
        <h2>Concert calendar</h2>
        <p className="muted">
          RSVP fields: coming, practice Saturday, program Saturday/Sunday, housing
          needs, notes. Responses visible to all members.
        </p>
      </section>
    </>
  );
}
