import type { SessionUser } from "@/lib/auth";
import { canSetRepertoire, canUpload } from "@/lib/roles";
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
  const sheets = song.assets.filter((a) => a.kind === "sheet_pdf");
  const audio = song.assets.filter((a) => a.kind === "rehearsal_audio");
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

      <div className="song-assets">
        <div>
          <h4>Sheet music</h4>
          {sheets.length === 0 ? (
            <p className="muted">No PDF yet.</p>
          ) : (
            <ul>
              {sheets.map((asset) => (
                <li key={asset.id}>
                  <a href={`/api/music/assets/${asset.id}`} target="_blank" rel="noreferrer">
                    {asset.label || "Sheet PDF"}
                  </a>
                  {uploader ? <SongAssetDelete assetId={asset.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4>Rehearsal audio</h4>
          {audio.length === 0 ? (
            <p className="muted">
              {song.status === "archive"
                ? "Audio optional in archive."
                : "No audio yet."}
            </p>
          ) : (
            <ul>
              {audio.map((asset) => (
                <li key={asset.id}>
                  <a href={`/api/music/assets/${asset.id}`}>
                    {asset.label || "Rehearsal audio"}
                  </a>
                  <WaveformPlayer
                    src={`/api/music/assets/${asset.id}`}
                    label={asset.label || "Rehearsal audio"}
                  />
                  {uploader ? <SongAssetDelete assetId={asset.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {uploader ? (
        <details className="music-details">
          <summary>Upload files</summary>
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
