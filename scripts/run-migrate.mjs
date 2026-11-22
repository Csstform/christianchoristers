#!/usr/bin/env node
/**
 * Apply Drizzle SQL migrations. Prefer this over `drizzle-kit migrate`,
 * which can exit 0 without applying when the DB was previously pushed.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = path.join(root, "drizzle");
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://choristers:choristers@localhost:5432/choristers";

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

async function tableExists(sql, name) {
  const rows = await sql`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Local/dev DBs often used `db:push` without recording journal rows.
 * Baseline already-present migrations so later ones can apply cleanly.
 */
async function baselineIfNeeded(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const existing = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  if (existing.length > 0) return;

  if (!(await tableExists(sql, "users"))) return;

  const journal = JSON.parse(
    readFileSync(path.join(migrationsFolder, "meta", "_journal.json"), "utf8"),
  );

  const baselines = [];
  for (const entry of journal.entries) {
    const sqlFile = path.join(migrationsFolder, `${entry.tag}.sql`);
    const hash = sha256(sqlFile);

    if (entry.tag.startsWith("0000")) {
      baselines.push({ hash, when: entry.when });
      continue;
    }
    if (entry.tag.includes("album_streaming") && (await tableExists(sql, "albums"))) {
      const cols = await sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'albums' AND column_name = 'spotify_url'
      `;
      if (cols.length) baselines.push({ hash, when: entry.when });
      continue;
    }
    if (
      entry.tag.includes("password_reset") &&
      (await tableExists(sql, "password_reset_tokens"))
    ) {
      baselines.push({ hash, when: entry.when });
      continue;
    }
    if (entry.tag.includes("rename_concerts") && (await tableExists(sql, "programs"))) {
      baselines.push({ hash, when: entry.when });
      continue;
    }
    if (
      entry.tag.includes("site_hardening") &&
      (await tableExists(sql, "site_settings"))
    ) {
      baselines.push({ hash, when: entry.when });
      continue;
    }
  }

  if (!baselines.length) return;

  console.log(
    `[migrate] Baselining ${baselines.length} already-applied migration(s)…`,
  );
  for (const row of baselines) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${row.hash}, ${row.when})
    `;
  }
}

async function main() {
  console.log("[migrate] Connecting…");
  const client = postgres(databaseUrl, { max: 1 });
  try {
    await baselineIfNeeded(client);
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    console.log("[migrate] Done.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("[migrate] Failed:", error);
  process.exit(1);
});
