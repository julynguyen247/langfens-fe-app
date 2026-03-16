"use client";

import { useEffect } from "react";
import { useLandingEffectsStore } from "./useLandingEffectsStore";

const IDLE_TIMEOUT_MS = 5000;

export function useIdleDetection() {
  useEffect(() => {
    const isMobile =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isMobile) return;

    let timerId: ReturnType<typeof setTimeout>;
    const store = useLandingEffectsStore.getState;

    const onMouseMove = (e: MouseEvent) => {
      store().setMousePosition(e.clientX, e.clientY);

      if (store().isIdle) {
        store().setIdle(false);
      }

      clearTimeout(timerId);
      timerId = setTimeout(() => {
        store().setIdle(true);
      }, IDLE_TIMEOUT_MS);
    };

    timerId = setTimeout(() => {
      useLandingEffectsStore.getState().setIdle(true);
    }, IDLE_TIMEOUT_MS);

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      clearTimeout(timerId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);
}
