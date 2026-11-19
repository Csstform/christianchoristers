import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { liveRecordings } from "@/data/public-catalog";

export const metadata: Metadata = {
  title: "Live Recordings",
};

export default function LiveRecordingsPage() {
  return (
    <PublicShell solidHeader>
      <section className="section">
        <h1>Live Recordings</h1>
        <p>
          Selected live services and reunions. YouTube embeds will be restored
          after content cutover.
        </p>
        <div className="recording-list">
          {liveRecordings.map((item, index) => (
            <article
              key={`${item.title}-${item.year}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h3>{item.title}</h3>
              <p className="muted">
                {item.location}
                {item.year ? ` · ${item.year}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
