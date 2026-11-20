/** Build a privacy-friendly embed URL from a watch or playlist URL. */
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const list = parsed.searchParams.get("list");
      const videoId = parsed.searchParams.get("v");

      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube-nocookie.com${parsed.pathname}${parsed.search}`;
      }

      if (parsed.pathname.startsWith("/playlist") && list) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`;
      }

      if (videoId && list) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?list=${encodeURIComponent(list)}`;
      }

      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}
