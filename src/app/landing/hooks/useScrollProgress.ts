"use client";

import { useEffect, useState } from "react";

/**
 * Returns a normalized scroll progress value (0-1) for the entire page.
 * Also provides the current section name based on scroll position.
 */

interface SectionRange {
  id: string;
  start: number; // scroll % where section begins
  end: number; // scroll % where section ends
}

const SECTION_RANGES: SectionRange[] = [
  { id: "hero", start: 0, end: 0.12 },
  { id: "features", start: 0.12, end: 0.55 },
  { id: "how-it-works", start: 0.55, end: 0.68 },
  { id: "stats", start: 0.68, end: 0.78 },
  { id: "testimonials", start: 0.78, end: 0.88 },
  { id: "cta", start: 0.88, end: 0.96 },
  { id: "footer", start: 0.96, end: 1 },
];

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");

  useEffect(() => {
    let raf: number;

    const update = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
      setProgress(p);

      const section = SECTION_RANGES.find(
        (s) => p >= s.start && p < s.end
      );
      if (section) setCurrentSection(section.id);
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

  return { progress, currentSection };
}
