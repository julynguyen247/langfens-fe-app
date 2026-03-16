import { create } from "zustand";
import type { DeviceTier } from "./useDeviceCapability";

interface LandingEffectsState {
  mousePosition: { x: number; y: number };
  scrollY: number;
  scrollVelocity: number;
  isIdle: boolean;
  deviceTier: DeviceTier;
  heroInView: boolean;
  setMousePosition: (x: number, y: number) => void;
  setScrollData: (y: number, velocity: number) => void;
  setIdle: (val: boolean) => void;
  setDeviceTier: (tier: DeviceTier) => void;
  setHeroInView: (val: boolean) => void;
}

export const useLandingEffectsStore = create<LandingEffectsState>((set) => ({
  mousePosition: { x: -1000, y: -1000 },
  scrollY: 0,
  scrollVelocity: 0,
  isIdle: false,
  deviceTier: "full",
  heroInView: true,
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
  setScrollData: (y, velocity) => set({ scrollY: y, scrollVelocity: velocity }),
  setIdle: (val) => set({ isIdle: val }),
  setDeviceTier: (tier) => set({ deviceTier: tier }),
  setHeroInView: (val) => set({ heroInView: val }),
}));
