"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Animates a number from 0 to the target value when the element scrolls into view.
 * Returns a ref to attach to the element and the current display value.
 */
export function useCountUp(
  target: number,
  options: { duration?: number; suffix?: string } = {}
) {
  const { duration = 2000, suffix = "" } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(`0${suffix}`);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasAnimated(true);
        observer.disconnect();

        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);
          setDisplay(`${current.toLocaleString()}${suffix}`);

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setDisplay(`${target.toLocaleString()}${suffix}`);
          }
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, suffix, hasAnimated]);

  return { ref, display };
}
