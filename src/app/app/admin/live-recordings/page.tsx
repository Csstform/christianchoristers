import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LiveRecordingCreateForm,
  LiveRecordingEditForm,
} from "@/components/admin/live-recording-forms";
import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/auth";
import { listAllLiveRecordings } from "@/lib/live-recordings";
import { canUpload } from "@/lib/roles";

export default async function AdminLiveRecordingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canUpload(user.role)) redirect("/app");

  const recordings = await listAllLiveRecordings();

  return (
    <>
      <AppNav user={user} current="/app/admin/live-recordings" />
      <section className="app-card music-library">
        <div className="music-library__intro">
          <div>
            <h2>Live recordings</h2>
            <p className="muted">
              Manage YouTube embeds on the public{" "}
              <Link href="/live-recordings">/live-recordings</Link> page.
            </p>
          </div>
        </div>

        <details className="music-details" open={recordings.length === 0}>
          <summary>Add a recording</summary>
          <LiveRecordingCreateForm />
        </details>

        <div className="song-list">
          {recordings.map((recording) => (
            <LiveRecordingEditForm key={recording.id} recording={recording} />
          ))}
        </div>
      </section>
    </>
  );
}
