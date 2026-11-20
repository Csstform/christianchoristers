import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { liveRecordings } from "@/data/public-catalog";
import { youtubeEmbedUrl } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Live Recordings",
};

export default function LiveRecordingsPage() {
  return (
    <PublicShell solidHeader>
      <section className="section">
        <h1>Live Recordings</h1>
        <p>
          Selected live services and reunions from Apostolic Christian
          congregations across North America.
        </p>
        <div className="recording-list">
          {liveRecordings.map((item, index) => {
            const embedSrc = item.youtubeUrl
              ? youtubeEmbedUrl(item.youtubeUrl)
              : null;

            return (
              <article
                key={`${item.title}-${item.year}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <h3>{item.title}</h3>
                <p className="muted">
                  {item.location}
                  {item.year ? ` · ${item.year}` : ""}
                </p>
                {embedSrc ? (
                  <div className="recording-embed">
                    <iframe
                      src={embedSrc}
                      title={`${item.title} – ${item.location}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {item.youtubeUrl ? (
                  <p className="recording-link">
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on YouTube
                    </a>
                  </p>
                ) : (
                  <p className="muted">Recording coming soon</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
