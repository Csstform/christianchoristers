import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";

const links = [
  { href: "/app", label: "Home" },
  { href: "/app/music", label: "Music" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/files", label: "Files" },
  { href: "/app/suggestions", label: "Suggestions" },
];

export function AppNav({
  user,
  current,
}: {
  user: SessionUser;
  current: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "baseline",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Member app</h1>
          <p className="muted">
            Signed in as {user.name} · {user.role}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-dark" type="submit">
            Log out
          </button>
        </form>
      </div>
      <nav className="app-nav" aria-label="Member">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        {canManageUsers(user.role) ? (
          <Link
            href="/app/admin"
            aria-current={current === "/app/admin" ? "page" : undefined}
          >
            Admin
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
