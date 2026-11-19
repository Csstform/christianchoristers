import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MusicSearch } from "@/components/music/music-search";
import { SongCard } from "@/components/music/song-card";
import { SongCreateForm } from "@/components/music/song-create-form";
import { getCurrentUser } from "@/lib/auth";
import { listSongs } from "@/lib/music";
import { canUpload } from "@/lib/roles";

export default async function AppMusicPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const status = params.status === "archive" ? "archive" : "active";
  const query = params.q?.trim() ?? "";
  const songs = await listSongs({ status, query: query || undefined });

  return (
    <>
      <AppNav user={user} current="/app/music" />

      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Music library</h2>
            <p className="muted">
              Active repertoire with sheet music and rehearsal audio. Retired
              songs stay searchable in the archive.
            </p>
          </div>
          <div className="music-tabs" role="tablist" aria-label="Repertoire">
            <Link
              className={status === "active" ? "is-active" : undefined}
              href={query ? `/app/music?status=active&q=${encodeURIComponent(query)}` : "/app/music?status=active"}
              role="tab"
              aria-selected={status === "active"}
            >
              Active
            </Link>
            <Link
              className={status === "archive" ? "is-active" : undefined}
              href={query ? `/app/music?status=archive&q=${encodeURIComponent(query)}` : "/app/music?status=archive"}
              role="tab"
              aria-selected={status === "archive"}
            >
              Archive
            </Link>
          </div>
        </div>

        <MusicSearch status={status} query={query} />

        {canUpload(user.role) ? (
          <details className="music-details" open={songs.length === 0}>
            <summary>Add a song</summary>
            <SongCreateForm />
          </details>
        ) : null}

        {songs.length === 0 ? (
          <p className="muted music-empty">
            {query
              ? `No ${status} songs match “${query}”.`
              : status === "active"
                ? "No active songs yet."
                : "Archive is empty."}
          </p>
        ) : (
          <div className="song-list">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} user={user} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
