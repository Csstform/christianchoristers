import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export function uploadsRoot(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}

export async function ensureUploadsRoot(): Promise<string> {
  const root = uploadsRoot();
  await mkdir(root, { recursive: true });
  return root;
}

export async function saveUpload(input: {
  category: "vault" | "songs" | "covers" | "suggestions";
  originalName: string;
  data: Buffer;
  mimeType?: string;
}): Promise<{ storagePath: string; absolutePath: string }> {
  const root = await ensureUploadsRoot();
  const safeBase = input.originalName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  const filename = `${nanoid(10)}-${safeBase}`;
  const relative = path.join(input.category, filename);
  const absolutePath = path.join(root, relative);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, input.data);
  return { storagePath: relative.replace(/\\/g, "/"), absolutePath };
}

export function absoluteUploadPath(storagePath: string): string {
  return path.join(uploadsRoot(), storagePath);
}
