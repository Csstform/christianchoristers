import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAssetLabel, pairSongAssets } from "./song-asset-pairs";

describe("normalizeAssetLabel", () => {
  it("strips extensions, track numbers, and punctuation", () => {
    assert.equal(
      normalizeAssetLabel("01 when he shall come (sat).mp3"),
      "when he shall come",
    );
    assert.equal(
      normalizeAssetLabel("When-He-Shall-Come.pdf"),
      "when he shall come",
    );
  });
});

describe("pairSongAssets", () => {
  it("pairs sheet and audio by similar labels", () => {
    const pairs = pairSongAssets([
      {
        id: "s1",
        kind: "sheet_pdf",
        label: "When-He-Shall-Come.pdf",
        mimeType: "application/pdf",
      },
      {
        id: "a1",
        kind: "rehearsal_audio",
        label: "01 when he shall come (sat).mp3",
        mimeType: "audio/mpeg",
      },
      {
        id: "s2",
        kind: "sheet_pdf",
        label: "Resurrection Power",
        mimeType: "application/pdf",
      },
      {
        id: "a2",
        kind: "rehearsal_audio",
        label: "13 resurrection power.mp3",
        mimeType: "audio/mpeg",
      },
    ]);

    assert.equal(pairs.length, 2);
    assert.equal(pairs[0]?.sheet?.id, "s1");
    assert.equal(pairs[0]?.audio?.id, "a1");
    assert.match(pairs[0]?.title || "", /when he shall come/i);
    assert.equal(pairs[1]?.sheet?.id, "s2");
    assert.equal(pairs[1]?.audio?.id, "a2");
    assert.match(pairs[1]?.title || "", /resurrection power/i);
  });

  it("keeps unpaired assets as solo groups", () => {
    const pairs = pairSongAssets([
      {
        id: "s1",
        kind: "sheet_pdf",
        label: "Only Sheet.pdf",
        mimeType: "application/pdf",
      },
      {
        id: "a1",
        kind: "rehearsal_audio",
        label: "Different Audio.mp3",
        mimeType: "audio/mpeg",
      },
    ]);
    assert.equal(pairs.length, 2);
    assert.equal(pairs[0]?.audio, null);
    assert.equal(pairs[1]?.sheet, null);
  });
});
