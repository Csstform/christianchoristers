"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { peaksFromAudioBuffer } from "@/lib/audio-peaks";

const DEFAULT_BARS = 96;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({
  src,
  label,
}: {
  src: string;
  label?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const peaksRef = useRef<number[]>([]);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);

  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loadingWave, setLoadingWave] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const drawWaveform = useEffectEvent(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 320;
    const cssHeight = canvas.clientHeight || 56;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const data =
      peaksRef.current.length > 0
        ? peaksRef.current
        : Array.from({ length: DEFAULT_BARS }, () => 0.12);
    const gap = 1.5;
    const barWidth = Math.max(
      1.5,
      (cssWidth - gap * (data.length - 1)) / data.length,
    );
    const midY = cssHeight / 2;
    const progressX = cssWidth * progressRef.current;

    const styles = getComputedStyle(document.documentElement);
    const played = styles.getPropertyValue("--accent").trim() || "#9a6b2f";
    const rest =
      styles.getPropertyValue("--ink-soft").trim() || "#3a4a63";

    for (let i = 0; i < data.length; i += 1) {
      const x = i * (barWidth + gap);
      const amplitude = Math.max(0.08, data[i] ?? 0);
      const barHeight = amplitude * (cssHeight * 0.86);
      const y = midY - barHeight / 2;
      const center = x + barWidth / 2;
      ctx.fillStyle = center <= progressX ? played : rest;
      ctx.globalAlpha = center <= progressX ? 0.95 : 0.35;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
    ctx.globalAlpha = 1;
  });

  useEffect(() => {
    peaksRef.current = peaks;
    drawWaveform();
  }, [peaks]);

  useEffect(() => {
    let cancelled = false;
    setLoadingWave(true);
    setError(null);
    setPeaks([]);

    (async () => {
      try {
        const response = await fetch(src, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`Could not load audio (${response.status}).`);
        }
        const buffer = await response.arrayBuffer();
        if (cancelled) return;
        const nextPeaks = await peaksFromAudioBuffer(buffer, DEFAULT_BARS);
        if (cancelled) return;
        setPeaks(nextPeaks);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not build waveform.",
          );
        }
      } finally {
        if (!cancelled) setLoadingWave(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const onResize = () => drawWaveform();
    window.addEventListener("resize", onResize);
    const observer =
      typeof ResizeObserver !== "undefined" && trackRef.current
        ? new ResizeObserver(onResize)
        : null;
    if (trackRef.current && observer) observer.observe(trackRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      const next =
        audio.duration > 0 ? Math.min(1, audio.currentTime / audio.duration) : 0;
      progressRef.current = next;
      setCurrent(audio.currentTime);
      if (!draggingRef.current) drawWaveform();
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      progressRef.current = 1;
      drawWaveform();
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  function seekFromClientX(clientX: number) {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    progressRef.current = ratio;
    setCurrent(audio.currentTime);
    drawWaveform();
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setError("Playback was blocked. Try pressing play again.");
      }
    } else {
      audio.pause();
    }
  }

  return (
    <div className="waveform-player" aria-label={label || "Audio player"}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="waveform-player__play"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <div className="waveform-player__body">
        <div
          ref={trackRef}
          className="waveform-player__track"
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration) || 0}
          aria-valuenow={Math.floor(current) || 0}
          aria-label="Seek in waveform"
          onPointerDown={(event) => {
            draggingRef.current = true;
            trackRef.current?.setPointerCapture(event.pointerId);
            seekFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) return;
            seekFromClientX(event.clientX);
          }}
          onPointerUp={(event) => {
            draggingRef.current = false;
            trackRef.current?.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={(event) => {
            const audio = audioRef.current;
            if (!audio || !Number.isFinite(audio.duration)) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              audio.currentTime = Math.min(
                audio.duration,
                audio.currentTime + 5,
              );
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              audio.currentTime = Math.max(0, audio.currentTime - 5);
            }
          }}
        >
          <canvas ref={canvasRef} className="waveform-player__canvas" />
          {loadingWave ? (
            <span className="waveform-player__status">Drawing waveform…</span>
          ) : null}
        </div>
        <div className="waveform-player__times">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </div>
  );
}
