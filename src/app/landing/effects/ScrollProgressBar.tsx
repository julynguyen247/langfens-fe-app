"use client";

import { useEffect, useRef } from "react";
import { useScrollStore } from "../hooks/useScrollStore";

/**
 * Thin progress bar fixed at the top of the viewport.
 * Subscribes to scroll store and updates width via ref — zero React re-renders.
 */
export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return useScrollStore.subscribe((state) => {
      if (barRef.current) {
        barRef.current.style.width = `${state.scrollProgress * 100}%`;
      }
    });
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[101] h-[3px]">
      <div
        ref={barRef}
        className="h-full"
        style={{
          width: "0%",
          background: "var(--ocean-primary)",
          boxShadow: "0 0 8px var(--ocean-primary-glow)",
          willChange: "width",
        }}
      />
    </div>
  );
}
