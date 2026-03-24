"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
}

interface UseCountUpResult {
  value: number;
}

/**
 * Animates a number from 0 to the target value with a smooth ease-out effect.
 * Supports configurable duration and initial delay.
 */
export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): UseCountUpResult {
  const { duration = 2000, delay = 0 } = options;
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Apply initial delay
    timeoutRef.current = setTimeout(() => {
      const start = performance.now();

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        setValue(current);

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          setValue(target);
        }
      }

      requestAnimationFrame(tick);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [target, duration, delay]);

  return { value };
}
