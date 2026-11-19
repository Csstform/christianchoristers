"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { canUpload } from "@/lib/roles";
import { absoluteUploadPath } from "@/lib/storage";
import { deleteVaultFile } from "@/lib/vault";

export type VaultActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function deleteVaultFileAction(
  fileId: string,
): Promise<VaultActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (!canUpload(user.role)) {
      throw new Error("Managers and above can delete vault files.");
    }

    const file = await deleteVaultFile(fileId);
    if (!file) throw new Error("File not found.");
    try {
      await unlink(absoluteUploadPath(file.storagePath));
    } catch {
      // Ignore missing on-disk files.
    }
    revalidatePath("/app/files");
    return { ok: true, message: "File removed." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete file.",
    };
  }
}
