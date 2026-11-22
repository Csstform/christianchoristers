import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/admin/member-list";
import { AppNav } from "@/components/app-nav";
import { InviteForm } from "@/components/invite-form";
import { getCurrentUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { listUsers } from "@/lib/users";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageUsers(user.role)) {
    redirect("/app");
  }

  const members = await listUsers();
  const activeCount = members.filter((m) => m.status === "active").length;
  const invitedCount = members.filter((m) => m.status === "invited").length;
  const disabledCount = members.filter((m) => m.status === "disabled").length;

  return (
    <>
      <AppNav user={user} current="/app/admin" />

      <section className="app-card" style={{ marginBottom: "1rem" }}>
        <h2>Public site</h2>
        <p className="muted">
          Manage Spotify embeds, purchase links, and local streaming audio for
          the public catalog.
        </p>
        <p>
          <Link className="btn btn-quiet" href="/app/admin/music">
            Public music streaming →
          </Link>
        </p>
      </section>

      <section className="app-card" style={{ marginBottom: "1rem" }}>
        <h2>Members</h2>
        <p className="muted">
          View and manage everyone with access to the member app.{" "}
          {members.length} total · {activeCount} active · {invitedCount} invited
          · {disabledCount} disabled. Disabled members can be permanently
          deleted (press Delete twice to confirm).
        </p>
        <MemberList members={members} currentUserId={user.id} />
      </section>

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
