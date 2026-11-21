"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export function VaultSearch({ query }: { query: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/app/files";
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="music-search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const nextQuery = String(data.get("q") ?? "").trim();
        const params = new URLSearchParams();
        if (nextQuery) params.set("q", nextQuery);
        startTransition(() => {
          const qs = params.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        });
      }}
    >
      <input
        name="q"
        defaultValue={query}
        placeholder="Search files or uploader…"
      />
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
