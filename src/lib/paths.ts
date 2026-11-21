/** Safe post-login redirect: only same-origin /app paths. */
export function safeAppPath(raw: string | null | undefined): string {
  if (!raw) return "/app";
  const path = raw.trim();
  if (!path.startsWith("/")) return "/app";
  if (path.startsWith("//")) return "/app";
  if (path.includes("://")) return "/app";
  if (path.includes("\\")) return "/app";
  if (!path.startsWith("/app")) return "/app";
  return path;
}
