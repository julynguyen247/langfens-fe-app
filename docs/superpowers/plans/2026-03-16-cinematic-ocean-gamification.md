# Cinematic Ocean Gamification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Langfens landing page with Duolingo-style gamification overlays and ultra-cinematic ocean interactive effects, without changing any existing layout or structure.

**Architecture:** Layered composable systems — each effect is an independent component/hook sharing state via a Zustand store. Cross-system triggers use explicit refs. Progressive degradation across 3 device tiers (full/reduced/minimal).

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, GSAP 3, Framer Motion 12, Lottie, canvas-confetti (new)

**Spec:** `docs/superpowers/specs/2026-03-16-cinematic-ocean-gamification-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/components/effects/useDeviceCapability.ts` | CREATE | Detect device tier (full/reduced/minimal) and mobile status |
| `src/app/components/effects/useLandingEffectsStore.ts` | CREATE | Zustand store: mouse pos, scroll velocity, idle, device tier, heroInView |
| `src/app/components/effects/useScrollVelocity.ts` | CREATE | Track scroll position + velocity via rAF, write to store + CSS var |
| `src/app/components/effects/useIdleDetection.ts` | CREATE | Detect 5s mouse inactivity, write to store |
| `src/app/components/interactions/useConfetti.ts` | CREATE | canvas-confetti wrapper with presets, dynamic import, shared canvas |
| `src/app/components/ParticleCanvas.tsx` | MODIFY | Add particle types (bubble/star), wave curves, scroll velocity, burst API |
| `src/app/components/mascot/MascotWrapper.tsx` | CREATE | Wrap Lottie penguin with reactions, inline/peek modes |
| `src/app/components/mascot/useMascotReactions.ts` | CREATE | GSAP timelines for hover/click/idle/peek mascot behaviors |
| `src/app/components/gamification/GamificationHUD.tsx` | CREATE | Floating decorative HUD: streak, XP, hearts, combo, progress ring |
| `src/app/components/gamification/ProgressRing.tsx` | CREATE | SVG wave-fill progress ring with glow filter |
| `src/app/components/interactions/InteractiveEffects.tsx` | CREATE | DOM listener overlay: ripples, card tilt, nav underline, section sweep |
| `src/app/globals.css` | MODIFY | Add lens flare, dynamic vignette, ripple, card tilt, nav underline, light-ray CSS |
| `src/app/page.tsx` | MODIFY | Import + wire new components/hooks (~25 lines changed) |

---

## Chunk 1: Foundation — Dependencies, Store, and Hooks

### Task 1: Install canvas-confetti

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install canvas-confetti and types**

```bash
npm install canvas-confetti && npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('canvas-confetti')" && echo "OK"
```

Expected: `OK` (no errors)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add canvas-confetti dependency"
```

---

### Task 2: Create useDeviceCapability hook

**Files:**
- Create: `src/app/components/effects/useDeviceCapability.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "full" | "reduced" | "minimal";

interface DeviceCapability {
  tier: DeviceTier;
  isMobile: boolean;
}

// Extend Navigator for non-standard Chrome API
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
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit src/app/components/effects/useDeviceCapability.ts 2>&1 | head -20
```

Expected: no errors (or only unrelated errors from other files). If tsc does not support single-file check, run `npx tsc --noEmit` and verify no errors mention `useDeviceCapability`.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/effects/useDeviceCapability.ts
git commit -m "feat: add useDeviceCapability hook for device tier detection"
```

---

### Task 3: Create useLandingEffectsStore

**Files:**
- Create: `src/app/components/effects/useLandingEffectsStore.ts`

- [ ] **Step 1: Create the Zustand store**

Follow the pattern from `src/app/store/loading.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/effects/useLandingEffectsStore.ts
git commit -m "feat: add Zustand store for landing page effects shared state"
```

---

### Task 4: Create useScrollVelocity hook

**Files:**
- Create: `src/app/components/effects/useScrollVelocity.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useEffect } from "react";
import { useLandingEffectsStore } from "./useLandingEffectsStore";

/**
 * Tracks scroll position and velocity via rAF.
 * Writes to the Zustand store imperatively (no React re-renders).
 * Also writes --vignette-intensity CSS variable to the document root.
 */
export function useScrollVelocity() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let rafId = 0;

    const tick = () => {
      const currentY = window.scrollY;
      const velocity = currentY - lastScrollY;
      lastScrollY = currentY;

      // Write imperatively — no React re-render
      useLandingEffectsStore.getState().setScrollData(currentY, velocity);

      // Dynamic vignette intensity: fast scroll = darker edges
      const intensity = Math.min(Math.abs(velocity) * 0.005, 0.3);
      document.documentElement.style.setProperty(
        "--vignette-intensity",
        String(0.55 + intensity)
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/effects/useScrollVelocity.ts
git commit -m "feat: add useScrollVelocity hook with rAF-based scroll tracking"
```

---

### Task 5: Create useIdleDetection hook

**Files:**
- Create: `src/app/components/effects/useIdleDetection.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useEffect } from "react";
import { useLandingEffectsStore } from "./useLandingEffectsStore";

const IDLE_TIMEOUT_MS = 5000;

/**
 * Detects 5s of mouse inactivity. Desktop only.
 * Writes isIdle to the Zustand store.
 * Also updates mousePosition in the store on every mousemove.
 */
export function useIdleDetection() {
  useEffect(() => {
    const isMobile =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isMobile) return;

    let timerId: ReturnType<typeof setTimeout>;
    const store = useLandingEffectsStore.getState;

    const onMouseMove = (e: MouseEvent) => {
      // Update mouse position in store
      store().setMousePosition(e.clientX, e.clientY);

      // Reset idle
      if (store().isIdle) {
        store().setIdle(false);
      }

      clearTimeout(timerId);
      timerId = setTimeout(() => {
        store().setIdle(true);
      }, IDLE_TIMEOUT_MS);
    };

    // Start initial timer
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/effects/useIdleDetection.ts
git commit -m "feat: add useIdleDetection hook for 5s mouse inactivity detection"
```

---

### Task 6: Create useConfetti hook

**Files:**
- Create: `src/app/components/interactions/useConfetti.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DeviceTier } from "../effects/useDeviceCapability";

type ConfettiFunction = (options?: Record<string, unknown>) => Promise<null> | null;
type CreateConfetti = (canvas: HTMLCanvasElement, options?: { resize: boolean }) => ConfettiFunction;

const COLORS = ["#00E5FF", "#FFD700"];

interface ConfettiAPI {
  celebration: () => void;
  small: () => void;
  burst: (x: number, y: number) => void;
}

/**
 * Wrapper around canvas-confetti with dynamic import and shared canvas.
 * Returns preset functions: celebration, small, burst.
 * Degrades based on device tier: reduced = half particles, minimal = no-op.
 */
export function useConfetti(deviceTier: DeviceTier): ConfettiAPI {
  const confettiRef = useRef<ConfettiFunction | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup shared canvas on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
        confettiRef.current = null;
      }
    };
  }, []);

  const getConfetti = useCallback(async (): Promise<ConfettiFunction | null> => {
    if (deviceTier === "minimal") return null;
    if (confettiRef.current) return confettiRef.current;

    try {
      const mod = await import("canvas-confetti");
      const create = mod.default?.create ?? (mod as unknown as { create: CreateConfetti }).create;

      // Create shared canvas
      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100%;height:100%;z-index:9997;pointer-events:none;";
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      confettiRef.current = create(canvas, { resize: true });
      return confettiRef.current;
    } catch {
      return null;
    }
  }, [deviceTier]);

  const scale = deviceTier === "reduced" ? 0.5 : 1;

  const celebration = useCallback(async () => {
    const fire = await getConfetti();
    fire?.({
      particleCount: Math.round(80 * scale),
      spread: 120,
      colors: COLORS,
      origin: { y: 0.6 },
    });
  }, [getConfetti, scale]);

  const small = useCallback(async () => {
    const fire = await getConfetti();
    fire?.({
      particleCount: Math.round(30 * scale),
      spread: 50,
      colors: COLORS,
      origin: { y: 0.6 },
    });
  }, [getConfetti, scale]);

  const burst = useCallback(
    async (x: number, y: number) => {
      const fire = await getConfetti();
      fire?.({
        particleCount: Math.round(50 * scale),
        spread: 80,
        colors: COLORS,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      });
    },
    [getConfetti, scale]
  );

  return { celebration, small, burst };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/interactions/useConfetti.ts
git commit -m "feat: add useConfetti hook with dynamic import and shared canvas"
```

---

### Task 7: Verify foundation builds

- [ ] **Step 1: Run type check on the full project**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: no errors from the new files. If there are pre-existing errors unrelated to our changes, note them and proceed.

- [ ] **Step 2: Run dev server to verify no runtime errors**

```bash
npx next dev --port 3099 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3099
kill %1 2>/dev/null
```

Expected: HTTP 200

---

## Chunk 2: Enhanced Particle System

### Task 8: Extend ParticleCanvas with particle types, waves, scroll velocity, and burst API

**Files:**
- Modify: `src/app/components/ParticleCanvas.tsx`

The current file is a plain function component with a single particle type. We need to:
1. Convert to `forwardRef` to expose `burstFromPoint`
2. Add `type` field to Particle interface (`teal` | `bubble` | `star`)
3. Add bubble rendering (larger, upward drift, mouse attraction, highlight arc)
4. Add star rendering (tiny, white, fast twinkle, no connections)
5. Add ocean wave curves (3 sinusoidal, bottom third, desktop only)
6. Read scroll velocity from store in rAF loop
7. Expose `burstFromPoint(x, y)` via `useImperativeHandle`

- [ ] **Step 1: Replace the full ParticleCanvas with the enhanced version**

Replace the entire contents of `src/app/components/ParticleCanvas.tsx` with:

```typescript
"use client";

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useLandingEffectsStore } from "./effects/useLandingEffectsStore";

type ParticleType = "teal" | "bubble" | "star";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  type: ParticleType;
  /** For burst particles: remaining lifetime in frames (undefined = permanent) */
  life?: number;
}

export interface ParticleCanvasHandle {
  burstFromPoint: (x: number, y: number) => void;
}

const ParticleCanvas = forwardRef<ParticleCanvasHandle>(
  function ParticleCanvas(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);

    const initParticles = useCallback((w: number, h: number) => {
      const tier = useLandingEffectsStore.getState().deviceTier;
      const totalCount =
        tier === "minimal"
          ? 0
          : tier === "reduced"
            ? 20
            : Math.min(60, Math.floor((w * h) / 25000));

      const particles: Particle[] = [];

      for (let i = 0; i < totalCount; i++) {
        // Distribution: 50% teal, 30% bubble, 20% star (no stars on reduced)
        const ratio = i / totalCount;
        let type: ParticleType;
        if (tier === "reduced") {
          type = ratio < 0.6 ? "teal" : "bubble";
        } else {
          type = ratio < 0.5 ? "teal" : ratio < 0.8 ? "bubble" : "star";
        }

        const isBubble = type === "bubble";
        const isStar = type === "star";

        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (isStar ? 0.1 : 0.3),
          vy: isBubble
            ? -(Math.random() * 0.3 + 0.1) // upward drift
            : (Math.random() - 0.5) * 0.2 - 0.1,
          radius: isBubble
            ? Math.random() * 4 + 4 // 4-8px
            : isStar
              ? Math.random() * 0.5 + 0.5 // 0.5-1px
              : Math.random() * 2 + 0.5, // 0.5-2.5px (teal)
          opacity: isStar
            ? Math.random() * 0.6 + 0.3
            : Math.random() * 0.5 + 0.2,
          pulseSpeed: isStar
            ? Math.random() * 0.06 + 0.02 // fast twinkle
            : Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
          type,
        });
      }
      particlesRef.current = particles;
    }, []);

    // Expose burst API
    useImperativeHandle(
      ref,
      () => ({
        burstFromPoint(x: number, y: number) {
          const tier = useLandingEffectsStore.getState().deviceTier;
          if (tier !== "full") return;

          const count = 15 + Math.floor(Math.random() * 6); // 15-20
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = Math.random() * 3 + 1.5;
            particlesRef.current.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 2 + 1,
              opacity: 0.8,
              pulseSpeed: 0,
              pulsePhase: 0,
              type: "teal",
              life: 60, // ~1 second at 60fps
            });
          }
        },
      }),
      []
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (particlesRef.current.length === 0) {
          initParticles(canvas.width, canvas.height);
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      };

      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      let time = 0;

      const draw = () => {
        time++;
        const { width: W, height: H } = canvas;
        ctx.clearRect(0, 0, W, H);

        // Read scroll velocity imperatively
        const scrollVel = useLandingEffectsStore.getState().scrollVelocity;
        const tier = useLandingEffectsStore.getState().deviceTier;

        // --- Draw ocean wave curves (desktop only) ---
        if (tier === "full") {
          const waves = [
            { amp: 12, freq: 0.003, speed: 0.008, yOffset: 0.75, alpha: 0.04 },
            { amp: 20, freq: 0.002, speed: 0.005, yOffset: 0.8, alpha: 0.03 },
            { amp: 28, freq: 0.0015, speed: 0.003, yOffset: 0.85, alpha: 0.05 },
          ];
          for (const wave of waves) {
            ctx.beginPath();
            const baseY = H * wave.yOffset;
            for (let x = 0; x <= W; x += 2) {
              const y =
                baseY + Math.sin(x * wave.freq + time * wave.speed) * wave.amp;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 229, 255, ${wave.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // --- Update and draw particles ---
        const mouse = mouseRef.current;
        const particles = particlesRef.current;

        // Remove dead burst particles
        particlesRef.current = particles.filter(
          (p) => p.life === undefined || p.life > 0
        );

        for (const p of particlesRef.current) {
          // Decrement burst particle life
          if (p.life !== undefined) {
            p.life--;
            p.opacity = Math.max(0, (p.life / 60) * 0.8);
          }

          // Mouse interaction
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            if (p.type === "bubble") {
              // Attraction — invert force direction
              p.vx -= (dx / dist) * force * 0.03;
              p.vy -= (dy / dist) * force * 0.03;
            } else if (p.type === "teal") {
              // Repulsion (existing behavior)
              p.vx += (dx / dist) * force * 0.05;
              p.vy += (dy / dist) * force * 0.05;
            }
            // Stars: no mouse interaction
          }

          // Scroll velocity influence
          p.vy += scrollVel * 0.01;

          // Damping
          p.vx *= 0.995;
          p.vy *= 0.995;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap around edges (permanent particles only)
          if (p.life === undefined) {
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;
          }

          // Pulsing opacity
          const pulse =
            p.pulseSpeed > 0
              ? Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7
              : 1;
          const alpha = p.opacity * pulse;

          // --- Render by type ---
          if (p.type === "star") {
            // Tiny bright white dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
          } else if (p.type === "bubble") {
            // Semi-transparent circle with highlight arc
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.15})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Highlight arc (top-left glint)
            ctx.beginPath();
            ctx.arc(
              p.x - p.radius * 0.25,
              p.y - p.radius * 0.25,
              p.radius * 0.5,
              Math.PI * 1.2,
              Math.PI * 1.8
            );
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          } else {
            // Teal glow (original style, enhanced)
            const gradient = ctx.createRadialGradient(
              p.x, p.y, 0,
              p.x, p.y, p.radius * 4
            );
            gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(0, 229, 255, ${alpha * 0.3})`);
            gradient.addColorStop(1, "rgba(0, 229, 255, 0)");

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Bright core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 240, 255, ${alpha * 0.8})`;
            ctx.fill();
          }
        }

        // --- Connection lines (teal particles only) ---
        const tealParticles = particlesRef.current.filter(
          (p) => p.type === "teal" && p.life === undefined
        );
        for (let i = 0; i < tealParticles.length; i++) {
          for (let j = i + 1; j < tealParticles.length; j++) {
            const a = tealParticles[i];
            const b = tealParticles[j];
            const ddx = a.x - b.x;
            const ddy = a.y - b.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < 120) {
              const lineAlpha = (1 - d / 120) * 0.08;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      animFrameRef.current = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(animFrameRef.current);
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
      };
    }, [initParticles]);

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />
    );
  }
);

export default ParticleCanvas;
```

- [ ] **Step 2: Verify the dev server renders the page with enhanced particles**

```bash
npx next dev --port 3099 &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3099
kill %1 2>/dev/null
```

Expected: HTTP 200. Manually verify in browser: should see teal glow particles (existing), larger rising bubbles, and tiny white twinkling stars.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ParticleCanvas.tsx
git commit -m "feat: extend ParticleCanvas with bubble/star types, ocean waves, scroll velocity, and burst API"
```

---

## Chunk 3: Mascot Reactions

### Task 9: Create useMascotReactions hook

**Files:**
- Create: `src/app/components/mascot/useMascotReactions.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLandingEffectsStore } from "../effects/useLandingEffectsStore";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface MascotReactionsConfig {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  deviceTier: DeviceTier;
  onHover?: () => void;
  onClick?: () => void;
}

/**
 * GSAP-powered mascot reaction animations.
 * Handles: floating, hover bounce, click spin, idle wiggle, peek mode.
 */
export function useMascotReactions({
  wrapperRef,
  deviceTier,
  onHover,
  onClick,
}: MascotReactionsConfig) {
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const floatTweenRef = useRef<gsap.core.Tween | null>(null);
  const isIdleAnimating = useRef(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || deviceTier === "minimal") return;

    const ctx = gsap.context(() => {
      // --- Floating motion (always) ---
      floatTweenRef.current = gsap.to(el, {
        y: -8,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }, el);
    gsapCtxRef.current = ctx;

    if (deviceTier === "reduced") {
      // Reduced: only floating, no interactions
      return () => ctx.revert();
    }

    // --- Hover: happy bounce + confetti ---
    const handleMouseEnter = () => {
      gsap.to(el, {
        scale: 1.1,
        y: -12,
        duration: 0.2,
        ease: "back.out(2)",
        overwrite: "auto",
      });
      onHover?.();
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
      // Restart float
      floatTweenRef.current?.restart();
    };

    // --- Click: spin dance + confetti ---
    const handleClick = () => {
      const tl = gsap.timeline();
      tl.to(el, { rotation: 360, duration: 0.6, ease: "power2.inOut" });
      tl.to(el, { scale: 1.15, duration: 0.15, ease: "back.out(3)" }, 0);
      tl.to(el, { scale: 1, rotation: 0, duration: 0.3, ease: "power2.out" });
      tl.call(() => floatTweenRef.current?.restart());
      onClick?.();
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handleClick);

    // --- Idle wiggle ---
    const unsubIdle = useLandingEffectsStore.subscribe(
      (state) => state.isIdle,
      (isIdle) => {
        if (!el) return;
        if (isIdle && !isIdleAnimating.current) {
          isIdleAnimating.current = true;
          gsap.to(el, {
            keyframes: [
              { rotation: -3, duration: 0.4 },
              { rotation: 3, duration: 0.4 },
              { rotation: -2, duration: 0.3 },
              { rotation: 1, duration: 0.3 },
              { rotation: 0, duration: 0.2 },
            ],
            ease: "sine.inOut",
            repeat: -1,
            repeatDelay: 1,
          });
        } else if (!isIdle && isIdleAnimating.current) {
          gsap.killTweensOf(el, "rotation");
          gsap.to(el, { rotation: 0, duration: 0.3 });
          isIdleAnimating.current = false;
        }
      }
    );

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handleClick);
      unsubIdle();
      ctx.revert();
    };
  }, [wrapperRef, deviceTier, onHover, onClick]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/mascot/useMascotReactions.ts
git commit -m "feat: add useMascotReactions hook with GSAP float, bounce, spin, and idle wiggle"
```

---

### Task 10: Create MascotWrapper component

**Files:**
- Create: `src/app/components/mascot/MascotWrapper.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Lottie from "lottie-react";
import gsap from "gsap";
import { useMascotReactions } from "./useMascotReactions";
import { useLandingEffectsStore } from "../effects/useLandingEffectsStore";
import { useConfetti } from "../interactions/useConfetti";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface MascotWrapperProps {
  deviceTier: DeviceTier;
  heroSectionRef: React.RefObject<HTMLElement | null>;
}

/**
 * Wraps the penguin Lottie animation with interactive behaviors.
 * Two modes: inline (in hero grid) and peeking (fixed bottom-right via GSAP).
 * Owns Lottie rendering — loads both penguin.json and sleepPenguin.json.
 */
export function MascotWrapper({ deviceTier, heroSectionRef }: MascotWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const confetti = useConfetti(deviceTier);
  const isPeekingRef = useRef(false);

  // --- Lottie animation data ---
  const [activeData, setActiveData] = useState<object | null>(null);
  const [sleepData, setSleepData] = useState<object | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    fetch("/animation/penguin.json")
      .then((r) => r.json())
      .then(setActiveData)
      .catch(() => {});
    // Prefetch sleep animation (silent fail if missing)
    fetch("/animation/sleepPenguin.json")
      .then((r) => r.json())
      .then(setSleepData)
      .catch(() => {});
  }, []);

  // --- Idle → swap to sleep animation with opacity crossfade ---
  useEffect(() => {
    if (deviceTier !== "full" || !sleepData) return;

    const unsub = useLandingEffectsStore.subscribe(
      (state) => state.isIdle,
      (isIdle) => {
        const el = wrapperRef.current;
        if (!el) {
          setIsSleeping(isIdle);
          return;
        }
        // Crossfade: fade out → swap data → fade in
        gsap.to(el, {
          opacity: 0.3,
          duration: 0.3,
          onComplete: () => {
            setIsSleeping(isIdle);
            gsap.to(el, { opacity: 1, duration: 0.3 });
          },
        });
      }
    );
    return unsub;
  }, [deviceTier, sleepData]);

  // --- Peek mode via GSAP slide animation (not CSS class toggle) ---
  useEffect(() => {
    if (deviceTier !== "full") return;
    const heroEl = heroSectionRef.current;
    const el = wrapperRef.current;
    if (!heroEl || !el) return;

    // Store original inline styles
    const originalPosition = el.style.position;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        useLandingEffectsStore.getState().setHeroInView(inView);

        if (!inView && !isPeekingRef.current) {
          // Slide to fixed corner
          isPeekingRef.current = true;
          el.style.position = "fixed";
          el.style.zIndex = "90";
          gsap.fromTo(
            el,
            { bottom: -100, right: 24, width: 80, height: 80 },
            { bottom: 24, duration: 0.5, ease: "back.out(1.5)" }
          );
        } else if (inView && isPeekingRef.current) {
          // Slide out then return to inline
          isPeekingRef.current = false;
          gsap.to(el, {
            bottom: -100,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
              el.style.position = originalPosition || "";
              el.style.zIndex = "";
              el.style.bottom = "";
              el.style.right = "";
              el.style.width = "";
              el.style.height = "";
              gsap.set(el, { clearProps: "bottom,right,width,height" });
            },
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [deviceTier, heroSectionRef]);

  // --- Mascot reactions ---
  const handleHover = useCallback(() => {
    confetti.small();
  }, [confetti]);

  const handleClick = useCallback(() => {
    confetti.celebration();
  }, [confetti]);

  useMascotReactions({
    wrapperRef,
    deviceTier,
    onHover: handleHover,
    onClick: handleClick,
  });

  const currentData = isSleeping && sleepData ? sleepData : activeData;
  if (!currentData) return <div className="w-64 h-64 sm:w-80 sm:h-80" />;

  return (
    <div
      ref={wrapperRef}
      className="w-64 h-64 sm:w-80 sm:h-80 cursor-pointer"
    >
      <Lottie animationData={currentData} loop autoplay />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/mascot/MascotWrapper.tsx
git commit -m "feat: add MascotWrapper with Lottie swap, peek mode, and reaction triggers"
```

---

## Chunk 4: Gamification HUD

### Task 11: Create ProgressRing component

**Files:**
- Create: `src/app/components/gamification/ProgressRing.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useEffect, useRef, useId } from "react";
import gsap from "gsap";

interface ProgressRingProps {
  size?: number;
  progress?: number;
}

/**
 * SVG wave-fill progress ring with glowing particles.
 * Animated fill from 0% to target via GSAP.
 * Uses useId() for unique SVG IDs to avoid collisions.
 */
export function ProgressRing({ size = 36, progress = 73 }: ProgressRingProps) {
  const id = useId();
  const glowId = `ring-glow-${id}`;
  const clipId = `wave-clip-${id}`;
  const textRef = useRef<SVGTextElement>(null);
  const clipPathRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const rect = clipPathRef.current;
    const text = textRef.current;
    if (!rect || !text) return;

    // Animate clip rect from bottom to target height
    const targetHeight = (progress / 100) * size;
    const obj = { val: 0 };

    gsap.to(obj, {
      val: progress,
      duration: 2,
      ease: "power2.out",
      delay: 0.5,
      onUpdate: () => {
        const h = (obj.val / 100) * size;
        rect.setAttribute("y", String(size - h));
        rect.setAttribute("height", String(h));
        text.textContent = `${Math.round(obj.val)}%`;
      },
    });
  }, [progress, size]);

  const r = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {/* Glow filter */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          <feComposite in="SourceGraphic" />
        </filter>

        {/* Wave clip path */}
        <clipPath id={clipId}>
          <rect
            ref={clipPathRef}
            x="0"
            y={String(size)}
            width={String(size)}
            height="0"
          />
        </clipPath>
      </defs>

      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0, 229, 255, 0.15)"
        strokeWidth="3"
      />

      {/* Progress ring (clipped by wave) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#00E5FF"
        strokeWidth="3"
        clipPath={`url(#${clipId})`}
        filter={`url(#${glowId})`}
      />

      {/* Center text */}
      <text
        ref={textRef}
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#00E5FF"
        fontSize={size * 0.28}
        fontWeight="700"
        fontFamily="var(--font-nunito), sans-serif"
      >
        0%
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/gamification/ProgressRing.tsx
git commit -m "feat: add ProgressRing SVG component with GSAP wave-fill animation"
```

---

### Task 12: Create GamificationHUD component

**Files:**
- Create: `src/app/components/gamification/GamificationHUD.tsx`

- [ ] **Step 1: Create the component**

This component renders purely decorative gamification elements. All shapes are CSS-only (no emoji, no icons per CLAUDE.md).

```typescript
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ProgressRing } from "./ProgressRing";
import type { DeviceTier } from "../effects/useDeviceCapability";

interface GamificationHUDProps {
  deviceTier: DeviceTier;
}

/**
 * Floating decorative gamification HUD overlay.
 * Shows streak flame, XP counter, hearts, combo badge, progress ring.
 * Purely visual — no real data.
 */
export function GamificationHUD({ deviceTier }: GamificationHUDProps) {
  const xpRef = useRef<HTMLSpanElement>(null);

  // Animate XP counter 0 → 2450
  useEffect(() => {
    if (deviceTier === "minimal" || !xpRef.current) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: 2450,
      duration: 2,
      ease: "power2.out",
      delay: 1,
      onUpdate: () => {
        if (xpRef.current) {
          xpRef.current.textContent = Math.round(obj.val).toLocaleString();
        }
      },
    });
  }, [deviceTier]);

  if (deviceTier === "minimal") return null;

  const isReduced = deviceTier === "reduced";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="fixed top-20 right-4 sm:right-6 z-50 pointer-events-none"
    >
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        {/* Streak flame — CSS shape only */}
        <div className="flex items-center gap-1 bg-orange-500/15 border border-orange-400/30 rounded-full px-2.5 py-1 text-xs">
          <span className="flame-icon" aria-hidden="true" />
          <span className="text-orange-400 font-bold">7</span>
        </div>

        {/* XP counter */}
        <div className="flex items-center gap-1 bg-[#FFD700]/10 border border-[#FFD700]/25 rounded-full px-2.5 py-1 text-xs">
          <span className="w-4 h-4 rounded-full bg-[#FFD700] border border-[#00E5FF]/40 flex items-center justify-center text-[6px] font-extrabold text-[#0A1625]">
            XP
          </span>
          <span ref={xpRef} className="text-[#FFD700] font-bold">
            0
          </span>
        </div>

        {/* Hearts — CSS shapes, not emoji */}
        {!isReduced && (
          <div className="flex items-center gap-0.5 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="css-heart"
                style={{ animationDelay: `${i * 0.15}s` }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* Combo badge */}
        {!isReduced && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 2, stiffness: 300 }}
            className="bg-[#00E5FF]/15 border border-[#00E5FF]/30 rounded-full px-2.5 py-1 text-xs text-[#00E5FF] font-extrabold"
          >
            x3
          </motion.div>
        )}

        {/* Progress ring */}
        {!isReduced && <ProgressRing size={36} progress={73} />}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/gamification/GamificationHUD.tsx
git commit -m "feat: add GamificationHUD overlay with streak, XP, hearts, combo, and progress ring"
```

---

## Chunk 5: Interactive Effects and Enhanced CSS

### Task 13: Add enhanced cinematic CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add new CSS effects**

Append the following CSS **before** the `@layer base` block (before line 339 in the current file), after the existing `.ambient-glow` rule:

```css
/* ─── Enhanced Cinematic Effects ─── */

/* Anamorphic lens flare — horizontal light sweep */
@keyframes lensFlare {
  0% { opacity: 0; transform: translateX(-150%) scaleY(0.3); }
  30% { opacity: 0.06; }
  100% { opacity: 0; transform: translateX(150%) scaleY(0.3); }
}

.cinematic .lens-flare::after {
  content: '';
  position: fixed;
  top: 30%;
  left: -50%;
  width: 200%;
  height: 4px;
  z-index: 42;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), rgba(255, 215, 0, 0.2), transparent);
  filter: blur(6px);
  animation: lensFlare 20s ease-in-out infinite;
}

/* Dynamic vignette — intensity driven by --vignette-intensity CSS var */
.vignette.dynamic::before {
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    rgba(0, 0, 0, var(--vignette-intensity, 0.55)) 100%
  );
}

/* Ocean ripple on click */
@keyframes oceanRipple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.6;
    border-width: 3px;
  }
  100% {
    transform: translate(-50%, -50%) scale(8);
    opacity: 0;
    border-width: 0.5px;
  }
}

.ripple-effect {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(0, 229, 255, 0.5);
  pointer-events: none;
  animation: oceanRipple 0.8s ease-out forwards;
}

/* Glass card 3D tilt via CSS custom properties */
.glass-card.tilt-active {
  transform:
    perspective(800px)
    rotateX(var(--tilt-x, 0deg))
    rotateY(var(--tilt-y, 0deg));
  transition: transform 0.15s ease-out;
}

.glass-card.tilt-active:hover {
  box-shadow:
    0 0 40px rgba(0, 229, 255, 0.08),
    inset 0 0 20px rgba(0, 229, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* Nav neon underline that follows mouse */
.cinematic nav.nav-glow {
  position: relative;
}

.cinematic nav.nav-glow::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: var(--nav-underline-x, -100px);
  width: 40px;
  height: 2px;
  background: #00E5FF;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.6), 0 0 20px rgba(0, 229, 255, 0.2);
  border-radius: 1px;
  transition: left 0.2s ease-out, opacity 0.3s;
  opacity: var(--nav-underline-opacity, 0);
  pointer-events: none;
}

/* Light-ray sweep on section entry */
@keyframes lightRaySweep {
  0% { transform: translateX(-100%); opacity: 0; }
  20% { opacity: 0.08; }
  100% { transform: translateX(200%); opacity: 0; }
}

.light-ray-sweep {
  position: relative;
  overflow: hidden;
}

.light-ray-sweep::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.06), transparent);
  pointer-events: none;
  animation: lightRaySweep 1.2s ease-out forwards;
}

/* NOTE: Also replace the EXISTING .btn-cinematic:hover rule (around line 312-317
   in the current globals.css) with this enhanced version: */
.btn-cinematic:hover {
  box-shadow:
    0 0 30px rgba(0, 229, 255, 0.3),
    0 0 80px rgba(255, 215, 0, 0.12);
  transform: scale(1.05);
  border-color: rgba(0, 229, 255, 0.6) !important;
}

/* CSS Flame shape for gamification HUD */
.flame-icon {
  display: inline-block;
  width: 10px;
  height: 14px;
  background: #FF6B35;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  position: relative;
  animation: flicker 0.3s ease-in-out infinite alternate;
}

.flame-icon::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 2px;
  width: 6px;
  height: 8px;
  background: #FFD700;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}

@keyframes flicker {
  0% { transform: scaleY(1) scaleX(1); opacity: 1; }
  100% { transform: scaleY(1.15) scaleX(0.9); opacity: 0.85; }
}

/* CSS Heart shape for gamification HUD */
.css-heart {
  display: inline-block;
  width: 10px;
  height: 9px;
  position: relative;
  animation: heartPulse 1s ease-in-out infinite;
}

.css-heart::before,
.css-heart::after {
  content: '';
  position: absolute;
  top: 0;
  width: 5px;
  height: 8px;
  background: #FF3250;
  border-radius: 5px 5px 0 0;
}

.css-heart::before {
  left: 0;
  transform: rotate(-45deg);
  transform-origin: bottom right;
}

.css-heart::after {
  left: 4px;
  transform: rotate(45deg);
  transform-origin: bottom left;
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
```

- [ ] **Step 2: Update the existing `.vignette::before` to support dynamic mode**

In `globals.css`, the existing `.vignette::before` (line 243) stays as-is for the fallback. The new `.vignette.dynamic::before` override above will take effect when the `dynamic` class is added (done in Task 15 when wiring page.tsx).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add enhanced cinematic CSS — lens flare, ripple, card tilt, nav glow, light-ray, flame, hearts"
```

---

### Task 14: Create InteractiveEffects component

**Files:**
- Create: `src/app/components/interactions/InteractiveEffects.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useEffect, useRef } from "react";
import type { DeviceTier } from "../effects/useDeviceCapability";
import type { ParticleCanvasHandle } from "../ParticleCanvas";

interface InteractiveEffectsProps {
  deviceTier: DeviceTier;
  particleCanvasRef: React.RefObject<ParticleCanvasHandle | null>;
  heroSectionRef: React.RefObject<HTMLElement | null>;
  onHeroCtaClick?: () => void;
}

/**
 * Fixed overlay that attaches event listeners to existing DOM elements.
 * Handles: hero click ripple, card 3D tilt, nav neon underline, section light-ray sweep.
 * Does NOT modify existing JSX — uses querySelector to find targets.
 */
export function InteractiveEffects({
  deviceTier,
  particleCanvasRef,
  heroSectionRef,
  onHeroCtaClick,
}: InteractiveEffectsProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deviceTier === "minimal") return;

    const cleanups: (() => void)[] = [];

    // --- Hero area click → ripple + particle burst ---
    const heroSection = heroSectionRef.current;
    if (heroSection) {
      const handleHeroClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Only trigger celebration confetti for .btn-cinematic buttons (primary CTAs)
        if (target.closest(".btn-cinematic")) {
          onHeroCtaClick?.();
          return;
        }
        // Skip other buttons/links (e.g. "Xem demo" outline button)
        if (target.closest("button") || target.closest("a")) return;

        // Spawn ripple
        spawnRipple(e.clientX, e.clientY, heroSection);

        // Particle burst
        if (deviceTier === "full") {
          particleCanvasRef.current?.burstFromPoint(e.clientX, e.clientY);
        }
      };
      heroSection.addEventListener("click", handleHeroClick);
      cleanups.push(() =>
        heroSection.removeEventListener("click", handleHeroClick)
      );
    }

    // --- Glass card 3D tilt (desktop only) ---
    if (deviceTier === "full") {
      const cards = document.querySelectorAll<HTMLElement>(".glass-card");
      cards.forEach((card) => {
        card.classList.add("tilt-active");

        const handleMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty("--tilt-x", `${-y * 6}deg`);
          card.style.setProperty("--tilt-y", `${x * 6}deg`);
        };

        const handleLeave = () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        };

        card.addEventListener("mousemove", handleMove, { passive: true });
        card.addEventListener("mouseleave", handleLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", handleMove);
          card.removeEventListener("mouseleave", handleLeave);
          card.classList.remove("tilt-active");
        });
      });
    }

    // --- Nav neon underline ---
    if (deviceTier === "full") {
      const nav = document.querySelector<HTMLElement>(".cinematic nav");
      if (nav) {
        nav.classList.add("nav-glow");

        const handleNavMove = (e: MouseEvent) => {
          const rect = nav.getBoundingClientRect();
          const x = e.clientX - rect.left - 20; // center underline
          nav.style.setProperty("--nav-underline-x", `${x}px`);
          nav.style.setProperty("--nav-underline-opacity", "1");
        };

        const handleNavLeave = () => {
          nav.style.setProperty("--nav-underline-opacity", "0");
        };

        nav.addEventListener("mousemove", handleNavMove, { passive: true });
        nav.addEventListener("mouseleave", handleNavLeave);
        cleanups.push(() => {
          nav.removeEventListener("mousemove", handleNavMove);
          nav.removeEventListener("mouseleave", handleNavLeave);
          nav.classList.remove("nav-glow");
        });
      }
    }

    // --- Section light-ray sweep via IntersectionObserver ---
    const sections = document.querySelectorAll<HTMLElement>(
      "section[id]"
    );
    if (sections.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("light-ray-sweep");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      sections.forEach((s) => observer.observe(s));
      cleanups.push(() => observer.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [deviceTier, particleCanvasRef, heroSectionRef, onHeroCtaClick]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[45] pointer-events-none"
      aria-hidden="true"
    />
  );
}

/** Spawn a CSS ripple circle at the given screen coordinates */
function spawnRipple(x: number, y: number, container: HTMLElement) {
  const ripple = document.createElement("div");
  ripple.className = "ripple-effect";
  ripple.style.left = `${x - container.getBoundingClientRect().left}px`;
  ripple.style.top = `${y - container.getBoundingClientRect().top}px`;
  container.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/interactions/InteractiveEffects.tsx
git commit -m "feat: add InteractiveEffects overlay with ripple, card tilt, nav underline, and light-ray sweep"
```

---

## Chunk 6: Integration and Final Wiring

### Task 15: Wire everything into page.tsx

**Files:**
- Modify: `src/app/page.tsx`

This task makes minimal, targeted changes to the existing page.tsx. No section order, layout, or content changes.

**Note:** Line numbers below refer to the original `page.tsx` before any modifications. Since Step 2 deletes lines, subsequent steps should locate code by content, not line number. The implementer (or agentic worker) should search for the exact string patterns shown.

- [ ] **Step 1: Update imports at the top of page.tsx**

Add these imports after the existing import block (after `import { useMouseParallax } ...`):

```typescript
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useScrollVelocity } from "@/app/components/effects/useScrollVelocity";
import { useIdleDetection } from "@/app/components/effects/useIdleDetection";
import { useConfetti } from "@/app/components/interactions/useConfetti";
import { MascotWrapper } from "@/app/components/mascot/MascotWrapper";
import { GamificationHUD } from "@/app/components/gamification/GamificationHUD";
import { InteractiveEffects } from "@/app/components/interactions/InteractiveEffects";
import type { ParticleCanvasHandle } from "@/app/components/ParticleCanvas";
```

- [ ] **Step 2: Remove the old PenguinHero component**

Delete the entire `PenguinHero` function (search for `function PenguinHero()` through its closing `}`). It is replaced by `MascotWrapper` which owns Lottie rendering. Also remove the `useState` import if it becomes unused (but it won't since `MascotWrapper` doesn't need it in page.tsx — check).

- [ ] **Step 3: Add hooks and refs inside the LandingPage component**

Add these lines at the top of the `LandingPage` function body, after the existing `useMouseParallax(pageRef);` line:

```typescript
  const { tier: deviceTier } = useDeviceCapability();
  useScrollVelocity();
  useIdleDetection();
  const confetti = useConfetti(deviceTier);
  const particleCanvasRef = useRef<ParticleCanvasHandle>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
```

- [ ] **Step 4: Pass ref to ParticleCanvas**

Find `<ParticleCanvas />` and change to:

```tsx
<ParticleCanvas ref={particleCanvasRef} />
```

- [ ] **Step 5: Add lens flare and dynamic vignette class**

After the existing `<div className="light-leak" />`, add:

```tsx
      <div className="lens-flare" />
```

Change `<div className="vignette" />` to:

```tsx
      <div className="vignette dynamic" />
```

- [ ] **Step 6: Add overlay components after cinematic overlays**

After the new `<div className="lens-flare" />`, add:

```tsx
      <InteractiveEffects
        deviceTier={deviceTier}
        particleCanvasRef={particleCanvasRef}
        heroSectionRef={heroSectionRef}
        onHeroCtaClick={() => confetti.celebration()}
      />
      <GamificationHUD deviceTier={deviceTier} />
```

- [ ] **Step 7: Add ref to hero section**

Find the first `<section className="relative z-10">` (the hero section, immediately after the `</header>` tag) and change to:

```tsx
      <section ref={heroSectionRef} data-section="hero" className="relative z-10">
```

The `data-section="hero"` attribute is used by `InteractiveEffects` to find the hero section reliably.

- [ ] **Step 8: Replace PenguinHero with MascotWrapper**

Find the penguin rendering block inside the hero right column (search for `<PenguinHero />`):

```tsx
              {/* Ambient glow circle behind penguin */}
              <div className="absolute inset-0 bg-[#00E5FF]/5 rounded-full scale-125 ambient-glow" />
              <div className="relative z-10">
                <PenguinHero />
              </div>
```

Replace with:

```tsx
              {/* Ambient glow circle behind penguin */}
              <div className="absolute inset-0 bg-[#00E5FF]/5 rounded-full scale-125 ambient-glow" />
              <div className="relative z-10">
                <MascotWrapper
                  deviceTier={deviceTier}
                  heroSectionRef={heroSectionRef}
                />
              </div>
```

- [ ] **Step 9: Verify the page builds and renders**

```bash
npx next build 2>&1 | tail -30
```

Expected: build succeeds with no errors related to our new files.

- [ ] **Step 10: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate all cinematic ocean gamification systems into landing page"
```

---

### Task 16: Manual verification and polish

- [ ] **Step 1: Start dev server and verify in browser**

```bash
npx next dev --port 3099
```

Open `http://localhost:3099` in the browser and verify:

1. **Particles**: Three types visible — teal glow (existing), rising bubbles, tiny white stars
2. **Ocean waves**: Subtle teal sinusoidal curves in bottom third of screen
3. **Mascot**: Penguin gently bobbing. Hover → bounce + confetti. Click → spin + big confetti. 5s idle → wiggle + sleep animation.
4. **Gamification HUD**: Top-right showing streak flame (7), XP counting up to 2,450, hearts pulsing, combo badge "x3", progress ring filling to 73%.
5. **Card tilt**: Glass cards tilt on mousemove (3D perspective effect)
6. **Nav underline**: Teal glow follows mouse over nav links
7. **Hero click**: Clicking hero area spawns ripple + particle burst
8. **CTA click**: Clicking hero buttons fires teal+gold confetti
9. **Scroll**: Particles swoosh on fast scroll. Vignette darkens briefly. Sections get light-ray sweep.
10. **Lens flare**: Horizontal light bar slowly sweeps across page periodically
11. **Mascot peek**: Scrolling past hero → penguin slides to bottom-right corner

- [ ] **Step 2: Verify mobile degradation**

Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M) → Select a mobile device.

Verify on mobile:
- Fewer particles (20 instead of 60)
- No wave curves
- No card tilt
- Mascot floats only (no hover/click reactions)
- HUD shows only streak + XP (no hearts, combo, ring)
- No parallax

- [ ] **Step 3: Verify `prefers-reduced-motion`**

In Chrome DevTools → Rendering panel → Enable "Emulate CSS media feature prefers-reduced-motion: reduce"

Verify:
- Page degrades to "reduced" tier behavior
- Minimal animations, reduced particles

- [ ] **Step 4: Final commit if any polish tweaks were needed**

```bash
git add -A
git commit -m "fix: polish cinematic effects after manual testing"
```

Only commit if there were actual changes. Skip if everything worked on first try.
