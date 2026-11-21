export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Christian Choristers</p>
      <p>Proclaiming an unchanging message to a changing world.</p>
      <p className="muted">
        Music also on Spotify, YouTube Music, and iTunes.
      </p>
    </footer>
  );
}
