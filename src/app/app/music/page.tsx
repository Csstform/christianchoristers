import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppMusicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav user={user} current="/app/music" />
      <section className="app-card">
        <h2>Music library</h2>
        <p className="muted">
          Active repertoire (~20 songs/year) with sheet music and rehearsal audio,
          plus a searchable archive. Upload tools arrive for managers+.
        </p>
      </section>
    </>
  );
}
