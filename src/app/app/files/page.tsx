import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppFilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav user={user} current="/app/files" />
      <section className="app-card">
        <h2>File vault</h2>
        <p className="muted">
          Shared uploads stored on the droplet under <code>UPLOADS_DIR</code>.
          Managers+ can upload; all members can download.
        </p>
      </section>
    </>
  );
}
