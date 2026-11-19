import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { albums } from "@/data/public-catalog";

export const metadata: Metadata = {
  title: "Music",
};

export default function MusicPage() {
  return (
    <PublicShell solidHeader>
      <section className="section">
        <h1>Our Back Catalog</h1>
        <p>
          Eight official recordings from the Christian Choristers. Streaming
          links will be connected as media is migrated off WordPress.
        </p>
        <div className="album-list">
          {albums.map((album, index) => (
            <article
              key={album.title}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h3>{album.title}</h3>
              {album.spotifyUrl ? (
                <a href={album.spotifyUrl} target="_blank" rel="noreferrer">
                  Listen on Spotify
                </a>
              ) : (
                <p className="muted">Streaming link coming soon</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
