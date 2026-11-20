import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { albumSetUrl, albums } from "@/data/public-catalog";
import { localAlbumAudioAvailable } from "@/lib/catalog-audio";
import { spotifyEmbedUrl } from "@/lib/spotify";

export const metadata: Metadata = {
  title: "Music",
};

export default async function MusicPage() {
  const availability = await Promise.all(
    albums.map(async (album) => ({
      slug: album.slug,
      hasLocal: await localAlbumAudioAvailable(album),
    })),
  );
  const localBySlug = Object.fromEntries(
    availability.map((row) => [row.slug, row.hasLocal]),
  );

  return (
    <PublicShell solidHeader>
      <section className="section">
        <h1>Our Back Catalog</h1>
        <p>
          Eight official recordings from the Christian Choristers. Listen on
          Spotify where available, stream a local copy when hosted on this
          server, or order CDs and MP3s from Melt the Heart.
        </p>
        <p className="album-set-link">
          <a href={albumSetUrl} target="_blank" rel="noreferrer">
            Order the set of 8 CDs
          </a>
        </p>
        <div className="album-list">
          {albums.map((album, index) => {
            const embedSrc = album.spotifyUrl
              ? spotifyEmbedUrl(album.spotifyUrl)
              : null;
            const hasLocal = Boolean(localBySlug[album.slug]);

            return (
              <article
                key={album.slug}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <h3>{album.title}</h3>
                {embedSrc ? (
                  <div className="spotify-embed">
                    <iframe
                      src={embedSrc}
                      title={`${album.title} on Spotify`}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {!embedSrc && hasLocal ? (
                  <div className="album-local-player">
                    <audio
                      controls
                      preload="none"
                      src={`/api/catalog/albums/${album.slug}/audio`}
                    >
                      Your browser does not support audio playback.
                    </audio>
                    <p className="muted">Streaming from this server</p>
                  </div>
                ) : null}
                {!embedSrc && !hasLocal ? (
                  <p className="muted">Streaming coming soon</p>
                ) : null}
                <div className="album-links">
                  {album.spotifyUrl ? (
                    <a href={album.spotifyUrl} target="_blank" rel="noreferrer">
                      Open on Spotify
                    </a>
                  ) : null}
                  {album.cdUrl ? (
                    <a href={album.cdUrl} target="_blank" rel="noreferrer">
                      Buy CD / MP3
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
