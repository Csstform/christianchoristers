/** Downsample a channel into peak magnitudes in 0..1 for waveform drawing. */
export function peaksFromChannelData(
  channelData: ArrayLike<number>,
  barCount: number,
): number[] {
  const count = Math.max(1, Math.floor(barCount));
  if (channelData.length === 0) {
    return Array.from({ length: count }, () => 0);
  }

  const blockSize = Math.max(1, Math.floor(channelData.length / count));
  const peaks = new Array<number>(count);
  let max = 0;

  for (let i = 0; i < count; i += 1) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    let peak = 0;
    for (let j = start; j < end; j += 1) {
      const value = Math.abs(channelData[j] ?? 0);
      if (value > peak) peak = value;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }

  if (max <= 0) return peaks;
  return peaks.map((peak) => peak / max);
}

export async function peaksFromAudioBuffer(
  buffer: ArrayBuffer,
  barCount: number,
): Promise<number[]> {
  const AudioContextCtor =
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Web Audio API is unavailable in this browser.");
  }

  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(buffer.slice(0));
    const channel = decoded.getChannelData(0);
    return peaksFromChannelData(channel, barCount);
  } finally {
    await context.close().catch(() => undefined);
  }
}
