import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUploadPath } from "@/lib/storage";
import {
  getSuggestion,
  isStoredSuggestionFile,
} from "@/lib/suggestions";
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
  const suggestion = await getSuggestion(id);
  if (!suggestion || !isStoredSuggestionFile(suggestion.linkOrPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storagePath = suggestion.linkOrPath!;
  const absolute = absoluteUploadPath(storagePath);
  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Missing file" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }

  const filename = storagePath.split("/").pop() || "suggestion-file";
  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentTypeForVaultFile({ storagePath }),
      "Content-Disposition": dispositionForVaultFile({
        storagePath,
        filename,
      }),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
