import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAlbumAudioPath, contentTypeForAlbumAudio } from "@/lib/catalog";

describe("safeAlbumAudioPath", () => {
  it("accepts albums/ relative audio paths", () => {
    assert.equal(safeAlbumAudioPath("albums/count-me-in.mp3"), "albums/count-me-in.mp3");
  });

  it("rejects traversal and non-album paths", () => {
    assert.equal(safeAlbumAudioPath("../etc/passwd"), null);
    assert.equal(safeAlbumAudioPath("songs/foo.mp3"), null);
    assert.equal(safeAlbumAudioPath("/albums/foo.mp3"), "albums/foo.mp3");
  });
});

describe("contentTypeForAlbumAudio", () => {
  it("maps common audio extensions", () => {
    assert.equal(contentTypeForAlbumAudio("albums/a.mp3"), "audio/mpeg");
    assert.equal(contentTypeForAlbumAudio("albums/a.wav"), "audio/wav");
  });
});
