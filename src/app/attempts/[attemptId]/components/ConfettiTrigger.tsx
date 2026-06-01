"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiTrigger({
  score,
  targetScore,
}: {
  score: number;
  targetScore: number;
}) {
  useEffect(() => {
    if (score >= targetScore) {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const timer = setTimeout(() => {
        confetti({ particleCount: 100, spread: 70 });
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [score, targetScore]);
  return null;
}
