"use client";

import { useEffect, useRef, useCallback } from "react";

interface VoiceWaveAnimationProps {
  /** Whether the mic is currently being captured */
  isRecording: boolean;
  /** Number of bars in the waveform (default 48) */
  barCount?: number;
  /** Height of the canvas in px (default 64) */
  height?: number;
  /** Primary bar colour when recording (default royal blue) */
  activeColor?: string;
  /** Bar colour when idle (default slate) */
  idleColor?: string;
  className?: string;
}

/**
 * Renders a real-time sound-wave visualizer that tracks microphone amplitude
 * via the Web Audio API. While idle it shows a gentle breathing animation.
 */
export default function VoiceWaveAnimation({
  isRecording,
  barCount = 48,
  height = 64,
  activeColor = "#3B82F6",
  idleColor = "#CBD5E1",
  className = "",
}: VoiceWaveAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const idlePhaseRef = useRef(0);

  // ── Colour utilities ────────────────────────────────────────────────────────
  const hexToRgb = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }, []);

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const drawFrame = useCallback(
    (dataArray: Uint8Array | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const gap = 3;
      const barW = Math.max(2, (W - gap * (barCount - 1)) / barCount);
      const rgb = hexToRgb(isRecording ? activeColor : idleColor);

      for (let i = 0; i < barCount; i++) {
        let amplitude: number; // 0 – 1

        if (dataArray && isRecording) {
          // Map frequency bin to bar index
          const binIndex = Math.floor((i / barCount) * dataArray.length * 0.75);
          amplitude = dataArray[binIndex] / 255;

          // Smooth low amplitudes so silent gaps still look alive
          amplitude = Math.max(amplitude, 0.04 + Math.random() * 0.02);
        } else {
          // Idle breathing wave
          const wave = Math.sin(idlePhaseRef.current + (i / barCount) * Math.PI * 2);
          amplitude = 0.08 + 0.06 * ((wave + 1) / 2);
        }

        const barH = Math.max(3, amplitude * H);
        const x = i * (barW + gap);
        const y = (H - barH) / 2;

        // Opacity follows amplitude for a glowing feel
        const alpha = isRecording ? 0.55 + amplitude * 0.45 : 0.35;

        // Draw rounded rect bar
        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        const radius = barW / 2;
        ctx.roundRect(x, y, barW, barH, radius);
        ctx.fill();

        // Subtle highlight line on top third of each bar
        if (isRecording && amplitude > 0.2) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${amplitude * 0.25})`;
          ctx.roundRect(x, y, barW, barH * 0.35, radius);
          ctx.fill();
        }
      }
    },
    [barCount, isRecording, activeColor, idleColor, hexToRgb]
  );

  // ── Animation loop ──────────────────────────────────────────────────────────
  const startLoop = useCallback(
    (analyser: AnalyserNode | null) => {
      const bufferLength = analyser?.frequencyBinCount ?? 0;
      const dataArray = analyser ? new Uint8Array(bufferLength) : null;

      const tick = () => {
        if (analyser && dataArray) analyser.getByteFrequencyData(dataArray);
        if (!isRecording) idlePhaseRef.current += 0.04;
        drawFrame(dataArray);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [drawFrame, isRecording]
  );

  // ── Mic lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (!isRecording) {
      // Tear down any live audio context
      analyserRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      analyserRef.current = null;
      streamRef.current = null;
      audioCtxRef.current = null;

      // Run idle animation
      startLoop(null);
      return;
    }

    // Request mic access and build analyser
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        startLoop(analyser);
      } catch {
        // Mic denied — fall back to idle
        if (!cancelled) startLoop(null);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      analyserRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [isRecording, startLoop]);

  // ── Resize canvas to match CSS size ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px` }}
      className={`block rounded-xl ${className}`}
      aria-label={isRecording ? "Voice wave animation – recording" : "Voice wave animation – idle"}
    />
  );
}
