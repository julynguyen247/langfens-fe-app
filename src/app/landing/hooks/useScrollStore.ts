import { create } from "zustand";

interface ScrollState {
  scrollProgress: number;
  currentSection: string;
  setScroll: (progress: number, section: string) => void;
}

/**
 * Zustand store for scroll state — decoupled from React rendering.
 *
 * R3F components read via `useScrollStore.getState()` inside useFrame
 * (synchronous, zero React re-render overhead).
 *
 * DOM components that need reactive updates use selectors:
 *   `useScrollStore(s => s.scrollProgress)`
 */
export const useScrollStore = create<ScrollState>((set) => ({
  scrollProgress: 0,
  currentSection: "hero",
  setScroll: (progress, section) => set({ scrollProgress: progress, currentSection: section }),
}));
