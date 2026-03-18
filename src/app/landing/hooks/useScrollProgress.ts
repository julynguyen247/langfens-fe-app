"use client";

import { useEffect } from "react";
import { useScrollStore } from "./useScrollStore";

/**
 * Registers a RAF-throttled scroll listener that updates the scroll store.
 * Call once in LandingPage — no return value, no React state, no re-renders.
 */

interface SectionRange {
  id: string;
  start: number;
  end: number;
}

const SECTION_RANGES: SectionRange[] = [
  { id: "hero", start: 0, end: 0.10 },
  { id: "features", start: 0.10, end: 0.28 },
  { id: "how-it-works", start: 0.28, end: 0.40 },
  { id: "stats", start: 0.40, end: 0.50 },
  { id: "testimonials", start: 0.50, end: 0.58 },
  { id: "cta", start: 0.58, end: 0.72 },
  { id: "footer", start: 0.72, end: 1 },
];

export function useScrollProgress() {
  useEffect(() => {
    let raf: number;

    const update = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

      const section = SECTION_RANGES.find(
        (s) => p >= s.start && p < s.end
      );

      useScrollStore.getState().setScroll(p, section?.id ?? "hero");
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // initial

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
}
