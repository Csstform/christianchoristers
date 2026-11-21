"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function MusicSearch({
  status,
  query,
}: {
  status: "active" | "archive";
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/app/music";
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="music-search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const nextQuery = String(data.get("q") ?? "").trim();
        const params = new URLSearchParams();
        params.set("status", status);
        if (nextQuery) params.set("q", nextQuery);
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }}
    >
      <input
        name="q"
        defaultValue={query}
        placeholder={
          status === "archive"
            ? "Search archive…"
            : "Search active repertoire…"
        }
      />
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
