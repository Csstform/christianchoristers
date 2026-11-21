import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { peaksFromChannelData } from "./audio-peaks";

describe("peaksFromChannelData", () => {
  it("normalizes peaks to 0..1", () => {
    const data = new Float32Array([0, 0.25, -0.5, 1, -0.1, 0.2]);
    const peaks = peaksFromChannelData(data, 3);
    assert.equal(peaks.length, 3);
    assert.ok(peaks.every((p) => p >= 0 && p <= 1));
    assert.equal(Math.max(...peaks), 1);
  });

  it("handles empty input", () => {
    assert.deepEqual(peaksFromChannelData([], 4), [0, 0, 0, 0]);
  });
});
