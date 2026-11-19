import { createReadStream } from "fs";
import { unlink, stat } from "fs/promises";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth";
import { canUpload } from "@/lib/roles";
import { absoluteUploadPath } from "@/lib/storage";
import { deleteVaultFile, getVaultFile } from "@/lib/vault";
import {
  contentTypeForVaultFile,
  dispositionForVaultFile,
} from "@/lib/vault-validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const file = await getVaultFile(id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolute = absoluteUploadPath(file.storagePath);
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Missing file" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }

  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentTypeForVaultFile({
        storagePath: file.storagePath,
        mimeType: file.mimeType,
      }),
      "Content-Disposition": dispositionForVaultFile({
        storagePath: file.storagePath,
        filename: file.name,
      }),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUpload(user.role)) {
    return NextResponse.json(
      { error: "Managers and above can delete vault files." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const file = await deleteVaultFile(id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await unlink(absoluteUploadPath(file.storagePath));
  } catch {
    // Ignore missing on-disk files.
  }

  revalidatePath("/app/files");
  return NextResponse.json({ ok: true });
}
