import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__brand">Christian Choristers</h1>
          <p className="hero__lede">
            Organized in 1959, presenting the Good News in song to Apostolic
            Christian Churches and local ministries across North America.
          </p>
          <div className="hero__actions">
            <Link className="btn btn-primary" href="/music">
              Listen to our music
            </Link>
            <Link className="btn btn-ghost" href="/login">
              Member login
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
