import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { files, users } from "@/db/schema";

export async function listVaultFiles(query?: string) {
  const q = query?.trim();
  const base = db
    .select({
      id: files.id,
      name: files.name,
      storagePath: files.storagePath,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      uploadedById: files.uploadedById,
      createdAt: files.createdAt,
      uploadedByName: users.name,
      uploadedByEmail: users.email,
    })
    .from(files)
    .innerJoin(users, eq(files.uploadedById, users.id));

  const rows = q
    ? await base
        .where(or(ilike(files.name, `%${q}%`), ilike(users.name, `%${q}%`)))
        .orderBy(desc(files.createdAt), asc(files.name))
    : await base.orderBy(desc(files.createdAt), asc(files.name));

  return rows;
}

export async function getVaultFile(id: string) {
  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  return row ?? null;
}

export async function createVaultFile(input: {
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}) {
  const [row] = await db
    .insert(files)
    .values({
      name: input.name.trim() || "Untitled",
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedById: input.uploadedById,
    })
    .returning();
  return row;
}

export async function deleteVaultFile(id: string) {
  const [row] = await db.delete(files).where(eq(files.id, id)).returning();
  return row ?? null;
}

export function formatBytes(size?: number | null): string {
  if (!size || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
