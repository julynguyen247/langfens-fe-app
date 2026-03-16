"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "full" | "reduced" | "minimal";

interface DeviceCapability {
  tier: DeviceTier;
  isMobile: boolean;
}

declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

function getSnapshot(): DeviceCapability {
  if (typeof window === "undefined") {
    return { tier: "full", isMobile: false };
  }

  const isMobile =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const lowCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 2;

  const lowMemory =
    typeof navigator.deviceMemory === "number" &&
    navigator.deviceMemory <= 2;

  if (lowCpu || lowMemory) {
    return { tier: "minimal", isMobile };
  }

  if (isMobile || prefersReduced) {
    return { tier: "reduced", isMobile };
  }

  return { tier: "full", isMobile: false };
}

function getServerSnapshot(): DeviceCapability {
  return { tier: "full", isMobile: false };
}

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

export function useDeviceCapability(): DeviceCapability {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
