"use client";

import { useCallback, useRef } from "react";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";

type ConfettiFunction = (options?: Record<string, unknown>) => Promise<null> | null;

const OCEAN_COLORS = ["#0EA5E9", "#06D6A0", "#38BDF8", "#34D399"];

/**
 * Ocean-themed confetti using canvas-confetti.
 * Lazy-loads the library on first use.
 */
export function useOceanConfetti() {
  const { tier } = useDeviceCapability();
  const confettiRef = useRef<ConfettiFunction | null>(null);

  const load = useCallback(async () => {
    if (!confettiRef.current) {
      const mod = await import("canvas-confetti");
      confettiRef.current = mod.default as unknown as ConfettiFunction;
    }
    return confettiRef.current!;
  }, []);

  const celebration = useCallback(async () => {
    if (tier === "minimal") return;
    const confetti = await load();
    const scale = tier === "full" ? 1 : 0.5;
    confetti({
      particleCount: Math.floor(80 * scale),
      spread: 120,
      origin: { y: 0.6 },
      colors: OCEAN_COLORS,
      disableForReducedMotion: true,
    });
  }, [tier, load]);

  const burst = useCallback(
    async (x: number, y: number) => {
      if (tier === "minimal") return;
      const confetti = await load();
      const scale = tier === "full" ? 1 : 0.5;
      confetti({
        particleCount: Math.floor(50 * scale),
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: OCEAN_COLORS,
        disableForReducedMotion: true,
      });
    },
    [tier, load]
  );

  return { celebration, burst };
}
