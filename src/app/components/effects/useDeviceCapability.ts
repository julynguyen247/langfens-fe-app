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

// Cached snapshot — only recomputed when subscribe fires (prefers-reduced-motion changes)
let cachedSnapshot: DeviceCapability | null = null;

function computeSnapshot(): DeviceCapability {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
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

function getSnapshot(): DeviceCapability {
  if (!cachedSnapshot) {
    cachedSnapshot = computeSnapshot();
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: DeviceCapability = { tier: "full", isMobile: false };

function getServerSnapshot(): DeviceCapability {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    cachedSnapshot = null; // invalidate cache so getSnapshot recomputes
    callback();
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useDeviceCapability(): DeviceCapability {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
