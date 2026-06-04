"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

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

    const obj = { value: 0 };
    
    const tl = gsap.to(obj, {
      value: target,
      duration: duration / 1000,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        setDisplay(`${Math.floor(obj.value).toLocaleString()}${suffix}`);
      },
      onComplete: () => {
        setDisplay(`${target.toLocaleString()}${suffix}`);
        setHasAnimated(true);
      }
    });

    return () => {
      tl.kill();
    };
  }, [target, duration, suffix, hasAnimated]);

  return { ref, display };
}
