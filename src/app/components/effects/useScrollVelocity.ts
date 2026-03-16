"use client";

import { useEffect } from "react";
import { useLandingEffectsStore } from "./useLandingEffectsStore";

export function useScrollVelocity() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId = 0;

    const tick = () => {
      const currentY = window.scrollY;
      const velocity = currentY - lastScrollY;
      lastScrollY = currentY;

      useLandingEffectsStore.getState().setScrollData(currentY, velocity);

      const intensity = Math.min(Math.abs(velocity) * 0.005, 0.3);
      document.documentElement.style.setProperty(
        "--vignette-intensity",
        String(0.55 + intensity)
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);
}
