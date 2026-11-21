import type { SessionUser } from "@/lib/auth";
import { canSetRepertoire, canUpload } from "@/lib/roles";
import { pairSongAssets } from "@/lib/song-asset-pairs";
import { WaveformPlayer } from "@/components/audio/waveform-player";
import { SongAssetDelete } from "@/components/music/song-asset-delete";
import { SongAssetUpload } from "@/components/music/song-asset-upload";
import { SongStatusButtons } from "@/components/music/song-status-buttons";

type Asset = {
  id: string;
  kind: string;
  label: string | null;
  mimeType: string | null;
};

type Song = {
  id: string;
  title: string;
  notes: string | null;
  status: "active" | "archive";
  assets: Asset[];
};

export function SongCard({
  song,
  user,
}: {
  song: Song;
  user: SessionUser;
}) {
  const pairs = pairSongAssets(song.assets);
  const uploader = canUpload(user.role);
  const director = canSetRepertoire(user.role);

  return (
    <article className="song-card">
      <div className="song-card__header">
        <div>
          <h3>{song.title}</h3>
          {song.notes ? <p className="muted">{song.notes}</p> : null}
        </div>
        <span className={`song-pill song-pill--${song.status}`}>
          {song.status}
        </span>
      </div>

      {pairs.length === 0 ? (
        <p className="muted music-empty">
          {song.status === "archive"
            ? "No sheet music or rehearsal audio in archive."
            : "No sheet music or rehearsal audio yet."}
        </p>
      ) : (
        <div className="song-parts">
          {pairs.map((part) => (
            <section key={part.key} className="song-part">
              <h4 className="song-part__title">{part.title}</h4>
              <div className="song-part__body">
                <div className="song-part__sheet">
                  <span className="song-part__label">Sheet music</span>
                  {part.sheet ? (
                    <div className="song-part__sheet-row">
                      <a
                        href={`/api/music/assets/${part.sheet.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {part.sheet.label || "Open PDF"}
                      </a>
                      {uploader ? (
                        <SongAssetDelete assetId={part.sheet.id} />
                      ) : null}
                    </div>
                  ) : (
                    <p className="muted">No PDF linked yet.</p>
                  )}
                </div>
                <div className="song-part__audio">
                  <span className="song-part__label">Rehearsal audio</span>
                  {part.audio ? (
                    <>
                      <div className="song-part__sheet-row">
                        <span className="song-part__audio-name">
                          {part.audio.label || "Rehearsal audio"}
                        </span>
                        {uploader ? (
                          <SongAssetDelete assetId={part.audio.id} />
                        ) : null}
                      </div>
                      <WaveformPlayer
                        src={`/api/music/assets/${part.audio.id}`}
                        label={part.audio.label || part.title}
                      />
                    </>
                  ) : (
                    <p className="muted">
                      {song.status === "archive"
                        ? "Audio optional in archive."
                        : "No audio linked yet."}
                    </p>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {uploader ? (
        <details className="music-details">
          <summary>Upload files</summary>
          <p className="muted song-part__hint">
            Use matching labels (for example “Resurrection Power” on both the
            PDF and the MP3) so sheet music and rehearsal audio group together.
          </p>
          <SongAssetUpload songId={song.id} />
        </details>
      ) : null}

      <SongStatusButtons
        songId={song.id}
        status={song.status}
        canArchive={director}
      />
    </article>
  );
}
