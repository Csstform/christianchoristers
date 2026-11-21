import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { streamingLinks } from "@/data/streaming-links";

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero">
        <Image
          src="/hero-choir.jpg"
          alt="The Christian Choristers"
          fill
          priority
          sizes="100vw"
          className="hero__image"
        />
        <div className="hero__shade" aria-hidden />
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

      <section className="section home-about">
        <h2>An unchanging message</h2>
        <p>
          The group strives to be faithful to their calling by proclaiming an
          unchanging message to a changing world. Whether they seriously
          challenge listeners with “In the Lord Alone,” raise spirits with “I’m
          Feeling Fine,” or longingly look forward to “No More Night” in “Sweet
          Beulah Land,” there is something for everyone in the timeless messages
          of their songs.
        </p>
      </section>

      <section className="section home-streaming">
        <h2>Listen online</h2>
        <p>
          Our latest albums are available on iTunes, YouTube Music, and Spotify.
        </p>
        <ul className="home-streaming__links">
          {streamingLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="muted">
          Browse the catalog and CD orders on{" "}
          <Link href="/music">Music</Link>, or watch{" "}
          <Link href="/live-recordings">Live Recordings</Link>.
        </p>
      </section>
    </PublicShell>
  );
}
