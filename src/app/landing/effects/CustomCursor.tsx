"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Bioluminescent ocean cursor.
 * - Inner dot: bright, follows mouse directly
 * - Outer ring: glowing halo, follows with elastic lag
 * - Trail: 8 fading particles that trace the cursor's path
 * - On hover: ring expands + brightens, dot pulses
 * - Hidden on touch devices + reduced motion
 *
 * All state uses refs — zero React re-renders after mount.
 */

const TRAIL_LENGTH = 8;
const LERP_DOT = 0.35;
const LERP_RING = 0.12;
const LERP_TRAIL = 0.08;

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isVisibleRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for hover/click state (no React re-renders)
  const isHoveringRef = useRef(false);
  const isClickingRef = useRef(false);

  const mouse = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const trail = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  const raf = useRef(0);

  const setTrailRef = useCallback(
    (el: HTMLDivElement | null, i: number) => {
      trailRefs.current[i] = el;
    },
    []
  );

  useEffect(() => {
    // Disable on touch or reduced motion
    if (
      "ontouchstart" in window ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    isVisibleRef.current = true;
    if (containerRef.current) {
      containerRef.current.style.display = "contents";
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer");
      const hovering = !!interactive;
      if (hovering !== isHoveringRef.current) {
        isHoveringRef.current = hovering;
        applyHoverStyles();
      }
    };

    const onMouseDown = () => {
      isClickingRef.current = true;
      applyHoverStyles();
    };
    const onMouseUp = () => {
      isClickingRef.current = false;
      applyHoverStyles();
    };
    const onMouseLeave = () => {
      mouse.current = { x: -100, y: -100 };
    };

    // Apply hover/click visual changes directly via style mutations (no React state)
    const applyHoverStyles = () => {
      const hovering = isHoveringRef.current;
      const clicking = isClickingRef.current;

      if (ringRef.current) {
        const size = hovering ? 52 : clicking ? 24 : 32;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
        ringRef.current.style.borderColor = hovering ? "var(--ocean-accent)" : "var(--ocean-primary)";
        ringRef.current.style.backgroundColor = hovering ? "rgba(6, 214, 160, 0.06)" : "transparent";
        ringRef.current.style.boxShadow = hovering
          ? "0 0 20px rgba(6, 214, 160, 0.25), inset 0 0 12px rgba(6, 214, 160, 0.08)"
          : "0 0 12px rgba(37, 99, 235, 0.15)";
      }

      if (dotRef.current) {
        const size = clicking ? 10 : 6;
        dotRef.current.style.width = `${size}px`;
        dotRef.current.style.height = `${size}px`;
        dotRef.current.style.backgroundColor = hovering ? "var(--ocean-accent)" : "var(--ocean-primary)";
        dotRef.current.style.boxShadow = hovering
          ? "0 0 8px var(--ocean-accent), 0 0 20px rgba(6, 214, 160, 0.4)"
          : "0 0 6px var(--ocean-primary), 0 0 14px rgba(37, 99, 235, 0.3)";
      }
    };

    const animate = () => {
      // Dot follows mouse with fast lerp
      dot.current.x += (mouse.current.x - dot.current.x) * LERP_DOT;
      dot.current.y += (mouse.current.y - dot.current.y) * LERP_DOT;

      // Ring follows with slower, elastic lerp
      ring.current.x += (mouse.current.x - ring.current.x) * LERP_RING;
      ring.current.y += (mouse.current.y - ring.current.y) * LERP_RING;

      // Trail: each particle follows the one ahead of it
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const target = i === 0 ? dot.current : trail.current[i - 1];
        const speed = LERP_TRAIL + i * 0.01;
        trail.current[i].x += (target.x - trail.current[i].x) * speed;
        trail.current[i].y += (target.y - trail.current[i].y) * speed;
      }

      // Apply transforms
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dot.current.x}px, ${dot.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const el = trailRefs.current[i];
        if (el) {
          el.style.transform = `translate(${trail.current[i].x}px, ${trail.current[i].y}px) translate(-50%, -50%)`;
        }
      }

      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ display: "none" }}>
      {/* Hide system cursor on the landing page */}
      <style>{`
        .landing-ocean, .landing-ocean * {
          cursor: none !important;
        }
      `}</style>

      {/* Trail particles — fading bioluminescent wake */}
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <div
          key={`trail-${i}`}
          ref={(el) => setTrailRef(el, i)}
          className="fixed top-0 left-0 pointer-events-none rounded-full"
          style={{
            width: Math.max(2, 6 - i * 0.5),
            height: Math.max(2, 6 - i * 0.5),
            backgroundColor: i % 2 === 0 ? "var(--ocean-primary)" : "var(--ocean-accent)",
            opacity: 0.4 - i * 0.045,
            zIndex: 9997,
            filter: `blur(${i * 0.3}px)`,
            willChange: "transform",
          }}
        />
      ))}

      {/* Outer ring — glowing halo with elastic follow */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full"
        style={{
          width: 32,
          height: 32,
          border: "1.5px solid var(--ocean-primary)",
          backgroundColor: "transparent",
          boxShadow: "0 0 12px rgba(37, 99, 235, 0.15)",
          zIndex: 9998,
          willChange: "transform",
          transition:
            "width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
        }}
      />

      {/* Inner dot — bright bioluminescent core */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: "var(--ocean-primary)",
          boxShadow: "0 0 6px var(--ocean-primary), 0 0 14px rgba(37, 99, 235, 0.3)",
          zIndex: 9999,
          willChange: "transform",
          transition:
            "width 0.15s ease, height 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease",
        }}
      />
    </div>
  );
}
