"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DeviceTier } from "../effects/useDeviceCapability";

type ConfettiFunction = (options?: Record<string, unknown>) => Promise<null> | null;
type CreateConfetti = (canvas: HTMLCanvasElement, options?: { resize: boolean }) => ConfettiFunction;

const COLORS = ["#2563EB", "#93C5FD"];

interface ConfettiAPI {
  celebration: () => void;
  small: () => void;
  burst: (x: number, y: number) => void;
}

export function useConfetti(deviceTier: DeviceTier): ConfettiAPI {
  const confettiRef = useRef<ConfettiFunction | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initPromiseRef = useRef<Promise<ConfettiFunction | null> | null>(null);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
        confettiRef.current = null;
        initPromiseRef.current = null;
      }
    };
  }, []);

  const getConfetti = useCallback(async (): Promise<ConfettiFunction | null> => {
    if (deviceTier === "minimal") return null;
    if (confettiRef.current) return confettiRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      try {
        const mod = await import("canvas-confetti");
        const create = mod.default?.create ?? (mod as unknown as { create: CreateConfetti }).create;

        const canvas = document.createElement("canvas");
        canvas.style.cssText =
          "position:fixed;inset:0;width:100%;height:100%;z-index:9997;pointer-events:none;";
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        confettiRef.current = create(canvas, { resize: true });
        return confettiRef.current;
      } catch {
        return null;
      }
    })();
    return initPromiseRef.current;
  }, [deviceTier]);

  const scale = deviceTier === "reduced" ? 0.5 : 1;

  const celebration = useCallback(async () => {
    const fire = await getConfetti();
    fire?.({
      particleCount: Math.round(80 * scale),
      spread: 120,
      colors: COLORS,
      origin: { y: 0.6 },
    });
  }, [getConfetti, scale]);

  const small = useCallback(async () => {
    const fire = await getConfetti();
    fire?.({
      particleCount: Math.round(30 * scale),
      spread: 50,
      colors: COLORS,
      origin: { y: 0.6 },
    });
  }, [getConfetti, scale]);

  const burst = useCallback(
    async (x: number, y: number) => {
      const fire = await getConfetti();
      fire?.({
        particleCount: Math.round(50 * scale),
        spread: 80,
        colors: COLORS,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      });
    },
    [getConfetti, scale]
  );

  return { celebration, small, burst };
}
