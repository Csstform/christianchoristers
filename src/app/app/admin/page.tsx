import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { InviteForm } from "@/components/invite-form";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageUsers(user.role)) {
    redirect("/app");
  }

  return (
    <>
      <AppNav user={user} current="/app/admin" />
      <section className="app-card">
        <h2>Invite a member</h2>
        <p className="muted">
          Invite-only: no public signup. SMTP on the droplet delivers the
          set-password link.
        </p>
        <InviteForm />
      </section>
    </>
  );
}
