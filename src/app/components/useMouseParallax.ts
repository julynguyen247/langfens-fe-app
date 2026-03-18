"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Cinematic mouse parallax hook.
 * Pass a ref to the container. Child elements with `data-parallax-depth="0.02"`
 * (or any float) will move relative to mouse position.
 * Uses gsap.quickTo() for pre-allocated tweens — no GC pressure on mousemove.
 * Disabled on touch devices.
 */
export function useMouseParallax(containerRef: React.RefObject<HTMLElement | null>) {
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch.current) return;

    const container = containerRef.current;
    if (!container) return;

    // Cache elements + create pre-allocated quickTo setters (zero GC on mousemove)
    const elements = container.querySelectorAll<HTMLElement>("[data-parallax-depth]");
    const setters = Array.from(elements).map((el) => {
      const depth = parseFloat(el.dataset.parallaxDepth || "0");
      return {
        setX: gsap.quickTo(el, "x", { duration: 1.2, ease: "power2.out" }),
        setY: gsap.quickTo(el, "y", { duration: 1.2, ease: "power2.out" }),
        depth,
      };
    });

    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;

      for (const { setX, setY, depth } of setters) {
        setX(nx * depth * 40);
        setY(ny * depth * 40);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [containerRef]);
}
