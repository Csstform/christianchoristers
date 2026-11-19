import Link from "next/link";

const links = [
  { href: "/music", label: "Music" },
  { href: "/live-recordings", label: "Live Recordings" },
  { href: "/login", label: "Login" },
];

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header className={`site-header ${solid ? "site-header--solid" : ""}`}>
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label="Christian Choristers home">
          Christian Choristers
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
