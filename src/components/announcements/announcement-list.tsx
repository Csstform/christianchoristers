import { AnnouncementDelete } from "@/components/announcements/announcement-delete";

type Item = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  emailedAt: Date | null;
  createdAt: Date;
};

export function AnnouncementList({
  items,
  canModerate,
}: {
  items: Item[];
  canModerate: boolean;
}) {
  if (items.length === 0) {
    return <p className="muted">No announcements yet.</p>;
  }

  return (
    <div className="song-list">
      {items.map((item) => (
        <article key={item.id} className="song-card">
          <div className="song-card__header">
            <div>
              <h3>{item.title}</h3>
              <p className="muted">
                {item.authorName} ·{" "}
                {item.createdAt.toLocaleString("en-US", {
                  timeZone: "America/Detroit",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {item.emailedAt ? " · emailed" : ""}
              </p>
            </div>
            {canModerate ? (
              <AnnouncementDelete announcementId={item.id} />
            ) : null}
          </div>
          <p className="announcement-body">{item.body}</p>
        </article>
      ))}
    </div>
  );
}
