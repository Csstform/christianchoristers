export type PairableAsset = {
  id: string;
  kind: string;
  label: string | null;
  mimeType: string | null;
};

export type SongAssetPair = {
  key: string;
  title: string;
  sheet: PairableAsset | null;
  audio: PairableAsset | null;
};

/** Normalize labels/filenames so "When-He-Shall-Come.pdf" matches "01 when he shall come (sat).mp3". */
export function normalizeAssetLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+\s*/, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayTitle(asset: PairableAsset): string {
  const label = (asset.label || "").trim();
  if (!label) {
    return asset.kind === "sheet_pdf" ? "Sheet music" : "Rehearsal audio";
  }
  return label
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+\s*[-.]?\s*/i, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = b.split(" ").filter(Boolean);
  if (aTokens.size === 0 || bTokens.length === 0) return 0;
  let shared = 0;
  for (const token of bTokens) {
    if (aTokens.has(token)) shared += 1;
  }
  return Math.round((shared / Math.max(aTokens.size, bTokens.length)) * 70);
}

/**
 * Pair sheet PDFs with rehearsal audio under a shared part title.
 * Prefers label similarity; leftover assets become unpaired groups.
 */
export function pairSongAssets(assets: PairableAsset[]): SongAssetPair[] {
  const sheets = assets.filter((a) => a.kind === "sheet_pdf");
  const audios = assets.filter((a) => a.kind === "rehearsal_audio");
  const usedAudio = new Set<string>();
  const pairs: SongAssetPair[] = [];

  for (const sheet of sheets) {
    const sheetKey = normalizeAssetLabel(sheet.label);
    let best: { audio: PairableAsset; score: number } | null = null;
    for (const audio of audios) {
      if (usedAudio.has(audio.id)) continue;
      const score = scoreMatch(sheetKey, normalizeAssetLabel(audio.label));
      if (score < 40) continue;
      if (!best || score > best.score) best = { audio, score };
    }

    if (best) {
      usedAudio.add(best.audio.id);
      pairs.push({
        key: `pair-${sheet.id}-${best.audio.id}`,
        title: displayTitle(sheet) || displayTitle(best.audio),
        sheet,
        audio: best.audio,
      });
    } else {
      pairs.push({
        key: `sheet-${sheet.id}`,
        title: displayTitle(sheet),
        sheet,
        audio: null,
      });
    }
  }

  for (const audio of audios) {
    if (usedAudio.has(audio.id)) continue;
    pairs.push({
      key: `audio-${audio.id}`,
      title: displayTitle(audio),
      sheet: null,
      audio,
    });
  }

  return pairs;
}
