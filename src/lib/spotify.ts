/** Build a Spotify embed URL from an open.spotify.com album/track/playlist link. */
export function spotifyEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "open.spotify.com" && host !== "spotify.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    // /album/{id}, /track/{id}, /playlist/{id}, or /embed/album/{id}
    if (parts[0] === "embed" && parts[1] && parts[2]) {
      return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`;
    }

    const kind = parts[0];
    const id = parts[1];
    if (
      id &&
      (kind === "album" || kind === "track" || kind === "playlist" || kind === "episode")
    ) {
      return `https://open.spotify.com/embed/${kind}/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}
