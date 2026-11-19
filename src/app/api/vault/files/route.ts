import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { maxUploadBytes } from "@/lib/file-validation";
import { canUpload } from "@/lib/roles";
import { saveUpload } from "@/lib/storage";
import { createVaultFile } from "@/lib/vault";
import { validateVaultUpload } from "@/lib/vault-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUpload(user.role)) {
    return NextResponse.json(
      { error: "Managers and above can upload to the file vault." },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxUploadBytes() + 1024 * 1024) {
    return NextResponse.json(
      { error: "File is too large (25MB max)." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const displayName = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { mimeType, safeFilename } = validateVaultUpload({
      filename: file.name,
      buffer,
    });

    const saved = await saveUpload({
      category: "vault",
      originalName: safeFilename,
      data: buffer,
      mimeType,
    });

    const row = await createVaultFile({
      name: displayName || file.name,
      storagePath: saved.storagePath,
      mimeType,
      sizeBytes: buffer.length,
      uploadedById: user.id,
    });

    revalidatePath("/app/files");
    return NextResponse.json({ ok: true, file: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
