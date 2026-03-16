"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Cinematic mouse parallax hook.
 * Pass a ref to the container. Child elements with `data-parallax-depth="0.02"`
 * (or any float) will move relative to mouse position.
 * Disabled on touch devices.
 */
export function useMouseParallax(containerRef: React.RefObject<HTMLElement | null>) {
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch.current) return;

    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      // Normalized mouse position: -1 to 1
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;

      const elements = container.querySelectorAll<HTMLElement>("[data-parallax-depth]");
      elements.forEach((el) => {
        const depth = parseFloat(el.dataset.parallaxDepth || "0");
        gsap.to(el, {
          x: nx * depth * 40,
          y: ny * depth * 40,
          duration: 1.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [containerRef]);
}
