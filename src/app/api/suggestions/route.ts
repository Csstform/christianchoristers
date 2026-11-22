import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { maxUploadBytes } from "@/lib/file-validation";
import { readFileHeader, saveUploadStream } from "@/lib/storage";
import {
  createSuggestion,
  normalizeSuggestionLink,
} from "@/lib/suggestions";
import { validateVaultUpload } from "@/lib/vault-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const linkRaw = String(formData.get("link") ?? "");
  const file = formData.get("file");

  try {
    let linkOrPath: string | null = null;

    if (linkRaw.trim()) {
      linkOrPath = normalizeSuggestionLink(linkRaw);
    }

    if (file instanceof File && file.size > 0) {
      if (linkOrPath) {
        return NextResponse.json(
          { error: "Provide either a link or a file, not both." },
          { status: 400 },
        );
      }
      const header = await readFileHeader(file, 2048);
      const { mimeType, safeFilename } = validateVaultUpload({
        filename: file.name,
        buffer: header,
        sizeBytes: file.size,
      });
      const saved = await saveUploadStream({
        category: "suggestions",
        originalName: safeFilename,
        stream: file.stream(),
        mimeType,
      });
      linkOrPath = saved.storagePath;
    }

    const suggestion = await createSuggestion({
      title,
      notes,
      linkOrPath,
      submittedById: user.id,
    });

    revalidatePath("/app/suggestions");
    return NextResponse.json({ ok: true, suggestion });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not submit suggestion.",
      },
      { status: 400 },
    );
  }
}
