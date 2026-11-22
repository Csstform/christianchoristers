import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlbumSetUrlForm,
  StreamingLinksForm,
} from "@/components/admin/site-settings-forms";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { canUpload } from "@/lib/roles";
import { getAlbumSetUrl, getStreamingLinks } from "@/lib/site-settings";

export default async function AdminSiteSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canUpload(user.role)) redirect("/app");

  const [streamingLinks, albumSetUrl] = await Promise.all([
    getStreamingLinks(),
    getAlbumSetUrl(),
  ]);

  return (
    <>
      <AppNav user={user} current="/app/admin/settings" />
      <section className="app-card" style={{ marginBottom: "1rem" }}>
        <h2>Site settings</h2>
        <p className="muted">
          Public home streaming destinations and the Melt the Heart album-set
          link used on <Link href="/music">/music</Link>.
        </p>
      </section>

      <section className="app-card" style={{ marginBottom: "1rem" }}>
        <h2>Listen online links</h2>
        <StreamingLinksForm links={streamingLinks} />
      </section>

      <section className="app-card">
        <h2>Album set purchase URL</h2>
        <AlbumSetUrlForm albumSetUrl={albumSetUrl} />
      </section>
    </>
  );
}
