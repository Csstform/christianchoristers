import Link from "next/link";
import { redirect } from "next/navigation";
import { AlbumStreamingForm } from "@/components/admin/album-streaming-form";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { listAllAlbums, localAlbumAudioAvailable } from "@/lib/catalog";
import { canUpload } from "@/lib/roles";

export default async function AdminPublicMusicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canUpload(user.role)) {
    redirect("/app");
  }

  const albums = await listAllAlbums();
  const availability = await Promise.all(
    albums.map(async (album) => ({
      id: album.id,
      hasLocal: await localAlbumAudioAvailable(album),
    })),
  );
  const localById = Object.fromEntries(
    availability.map((row) => [row.id, row.hasLocal]),
  );

  return (
    <>
      <AppNav user={user} current="/app/admin/music" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Public music streaming</h2>
            <p className="muted">
              Manage Spotify embeds, Melt the Heart purchase links, and optional
              on-server audio for the public{" "}
              <Link href="/music">/music</Link> page.
            </p>
          </div>
        </div>

        <div className="song-list">
          {albums.map((album) => (
            <AlbumStreamingForm
              key={album.id}
              album={album}
              hasLocalAudio={Boolean(localById[album.id])}
            />
          ))}
        </div>
      </section>
    </>
  );
}
