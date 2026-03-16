# Selenis Animation Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Selenis-style GSAP scroll animations, hover micro-interactions, loading screen, and per-section vignettes to the Langfens ocean landing page.

**Architecture:** Replace Framer Motion entrance animations with GSAP ScrollTrigger for consistency and scroll-scrub support. Add CSS-based hover glow effects to cards/buttons. Create a Framer Motion loading screen. Add underwater caustic CSS animation as new background effect.

**Tech Stack:** GSAP (already installed), Framer Motion (already installed), CSS keyframes

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/landing/landing-ocean.css` | Modify | Add hover glow keyframes, caustic animation, per-section vignette, noise overlay, shimmer effect |
| `src/app/landing/sections/HeroSection.tsx` | Modify | Replace Framer Motion with GSAP stagger entrance + scroll parallax fade |
| `src/app/landing/sections/HowItWorksSection.tsx` | Modify | Replace Framer Motion with GSAP ScrollTrigger entrance |
| `src/app/landing/sections/StatsSection.tsx` | Modify | Replace Framer Motion with GSAP ScrollTrigger entrance |
| `src/app/landing/sections/TestimonialsSection.tsx` | Modify | Replace Framer Motion with GSAP ScrollTrigger entrance |
| `src/app/landing/sections/CTASection.tsx` | Modify | Replace Framer Motion with GSAP stagger entrance |
| `src/app/landing/sections/FeaturesSection.tsx` | Modify | Upgrade GSAP timeline with scale transitions on visual panel |
| `src/app/landing/effects/LoadingScreen.tsx` | Create | Framer Motion loading screen with progress bar + penguin silhouette |
| `src/app/landing/effects/CausticOverlay.tsx` | Create | SVG-based underwater caustic light pattern |
| `src/app/landing/LandingPage.tsx` | Modify | Add LoadingScreen + CausticOverlay to layer stack |

---

## Chunk 1: CSS Foundations (hover glow, caustic, noise, per-section vignette)

### Task 1: Add CSS animations and utility classes

**Files:**
- Modify: `src/app/landing/landing-ocean.css`

- [ ] **Step 1: Add pulse-glow keyframe and hover-glow classes**

```css
/* After .ocean-card:hover rule (~line 113) */

/* ─── Pulse glow (for CTA buttons) ─── */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px var(--ocean-primary-glow); }
  50% { box-shadow: 0 0 40px var(--ocean-primary-glow), 0 0 80px rgba(14, 165, 233, 0.15); }
}

.landing-ocean .btn-ocean:hover {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* ─── Card hover glow (stronger than current) ─── */
.landing-ocean .ocean-card:hover {
  border-color: var(--ocean-border-glow);
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.15);
  transform: translateY(-2px);
}

/* ─── Ghost button glow hover ─── */
.landing-ocean .btn-ghost:hover {
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.1);
}
```

- [ ] **Step 2: Add underwater caustic keyframe**

```css
/* ─── Underwater caustic light pattern ─── */
@keyframes causticShift {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-2%, 1%) scale(1.02); }
  66% { transform: translate(1%, -1%) scale(0.98); }
  100% { transform: translate(0, 0) scale(1); }
}

.landing-ocean .caustic-overlay {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  opacity: 0.04;
  mix-blend-mode: overlay;
  animation: causticShift 12s ease-in-out infinite;
}
```

- [ ] **Step 3: Add noise overlay style**

```css
/* ─── Noise texture overlay (SVG turbulence) ─── */
.landing-ocean .noise-overlay {
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0.03;
  mix-blend-mode: overlay;
}
```

- [ ] **Step 4: Add per-section vignette variants**

```css
/* ─── Per-section vignette variants ─── */
.landing-ocean .vignette-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(4, 11, 20, 0.6) 100%);
  z-index: 1;
}

.landing-ocean .vignette-cta::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 20%, rgba(4, 11, 20, 0.8) 100%);
  z-index: 1;
}
```

- [ ] **Step 5: Add shimmer keyframe for loading screen**

```css
/* ─── Shimmer animation ─── */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* ─── Loading screen styles ─── */
.landing-ocean .loading-progress-bar {
  background: linear-gradient(90deg, var(--ocean-primary), var(--ocean-accent), var(--ocean-primary));
  background-size: 200% auto;
  animation: shimmer 2s linear infinite;
}
```

- [ ] **Step 6: Verify CSS compiles** — Run `npx tsc --noEmit` (no errors expected since CSS-only changes)

- [ ] **Step 7: Commit**
```bash
git add src/app/landing/landing-ocean.css
git commit -m "style: add Selenis-style CSS animations — glow, caustic, noise, section vignettes"
```

---

## Chunk 2: Loading Screen + Caustic Overlay components

### Task 2: Create LoadingScreen component

**Files:**
- Create: `src/app/landing/effects/LoadingScreen.tsx`

- [ ] **Step 1: Create LoadingScreen with Framer Motion AnimatePresence**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--ocean-bg)]"
        >
          {/* Pulsing circle */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full border-2 border-[var(--ocean-primary)] mb-8"
            style={{ boxShadow: "0 0 30px var(--ocean-primary-glow)" }}
          />

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-[var(--ocean-surface)] overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="h-full rounded-full loading-progress-bar"
            />
          </div>

          {/* Text */}
          <p className="font-code text-xs text-[var(--ocean-text-muted)] mt-4 tracking-widest uppercase">
            Diving in...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Task 3: Create CausticOverlay component

**Files:**
- Create: `src/app/landing/effects/CausticOverlay.tsx`

- [ ] **Step 1: Create CausticOverlay with SVG turbulence filter**

```tsx
"use client";

/**
 * Underwater caustic light pattern using SVG feTurbulence.
 * Creates shifting light refraction effect on the background.
 */
export default function CausticOverlay() {
  return (
    <>
      {/* SVG filter definition */}
      <svg className="fixed w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="caustic-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              seed="2"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="mono"
            />
            <feComponentTransfer in="mono" result="bright">
              <feFuncR type="linear" slope="3" intercept="-1" />
              <feFuncG type="linear" slope="3" intercept="-1" />
              <feFuncB type="linear" slope="3" intercept="-1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Caustic overlay */}
      <div
        className="caustic-overlay"
        style={{ filter: "url(#caustic-filter)" }}
      />

      {/* Noise texture overlay */}
      <svg className="noise-overlay" aria-hidden="true">
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript** — `npx tsc --noEmit | grep landing`

- [ ] **Step 3: Commit**
```bash
git add src/app/landing/effects/LoadingScreen.tsx src/app/landing/effects/CausticOverlay.tsx
git commit -m "feat: add LoadingScreen and CausticOverlay components (Selenis patterns)"
```

---

## Chunk 3: Hero GSAP animations (stagger + scroll parallax)

### Task 4: Replace Hero Framer Motion with GSAP

**Files:**
- Modify: `src/app/landing/sections/HeroSection.tsx`

- [ ] **Step 1: Rewrite HeroSection with GSAP stagger entrance + scroll parallax**

Replace the entire file. Key changes:
- Remove Framer Motion `variants` and `motion.div` for entrance animations
- Add `useEffect` with GSAP `gsap.from()` stagger for hero elements
- Add GSAP ScrollTrigger for parallax fade (content fades + moves up on scroll)
- Keep Framer Motion only for scroll indicator bounce (infinite animation)
- Keep Framer Motion for button `whileHover`/`whileTap` (micro-interactions)
- Add CSS classes: `.hero-preheadline`, `.hero-headline`, `.hero-subtitle`, `.hero-badge`, `.hero-cta`, `.hero-note` for GSAP targeting
- Add `.hero-content` wrapper for scroll parallax
- Add `vignette-hero` class to section for per-section vignette

GSAP entrance config:
```
gsap.from(".hero-el", {
  opacity: 0, y: 30, duration: 0.8,
  ease: "power2.out", stagger: 0.15, delay: 2.2
  // delay 2.2 = after loading screen (2s) + 0.2s buffer
})
```

GSAP scroll parallax config:
```
gsap.to(".hero-content", {
  opacity: 0, y: -100, ease: "none",
  scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true }
})
```

- [ ] **Step 2: Verify it compiles** — `npx tsc --noEmit | grep HeroSection`

- [ ] **Step 3: Commit**
```bash
git add src/app/landing/sections/HeroSection.tsx
git commit -m "feat: Hero GSAP stagger entrance + scroll parallax fade (Selenis pattern)"
```

---

## Chunk 4: Section GSAP entrance animations

### Task 5: HowItWorksSection — GSAP entrance

**Files:**
- Modify: `src/app/landing/sections/HowItWorksSection.tsx`

- [ ] **Step 1: Replace Framer Motion entrance with GSAP ScrollTrigger**

Key changes:
- Remove `motion.div` with `variants` for section heading and cards
- Add `useEffect` + `useRef` with GSAP:
  - Heading: `gsap.from(".hiw-heading", { y: 40, opacity: 0, duration: 0.8, scrollTrigger: { trigger, start: "top 80%" } })`
  - Cards: `gsap.from(".hiw-card", { y: 60, opacity: 0, duration: 0.8, stagger: 0.2, scrollTrigger: { trigger, start: "top 85%" } })`
- Keep SVG line animation (Framer Motion `pathLength` is fine for this)
- Add appropriate CSS classes for GSAP targeting

### Task 6: StatsSection — GSAP entrance

**Files:**
- Modify: `src/app/landing/sections/StatsSection.tsx`

- [ ] **Step 1: Replace Framer Motion entrance with GSAP ScrollTrigger**

Key changes:
- Heading: `gsap.from(".stats-heading", { y: 40, opacity: 0, duration: 0.8, scrollTrigger: { start: "top 80%" } })`
- Cards: `gsap.from(".stat-card", { y: 50, opacity: 0, duration: 0.8, stagger: 0.15, scrollTrigger: { start: "top 85%" } })`
- Keep `useCountUp` hook (already working well)

### Task 7: TestimonialsSection — GSAP entrance

**Files:**
- Modify: `src/app/landing/sections/TestimonialsSection.tsx`

- [ ] **Step 1: Replace Framer Motion entrance with GSAP ScrollTrigger**

Same pattern:
- Heading: `gsap.from` with ScrollTrigger
- Cards: `gsap.from` with stagger 0.15s

### Task 8: CTASection — GSAP stagger entrance

**Files:**
- Modify: `src/app/landing/sections/CTASection.tsx`

- [ ] **Step 1: Replace Framer Motion entrance with GSAP stagger**

Key changes:
- Individual element stagger (like Selenis CTA):
  - `.cta-label`: y:30, delay 0s
  - `.cta-title`: y:40, delay 0.1s
  - `.cta-subtitle`: y:30, delay 0.2s
  - `.cta-buttons`: y:30, delay 0.3s
- Add `vignette-cta` class to section

- [ ] **Step 2: Verify all sections compile** — `npx tsc --noEmit | grep landing/sections`

- [ ] **Step 3: Commit all section changes**
```bash
git add src/app/landing/sections/
git commit -m "feat: replace Framer Motion entrances with GSAP ScrollTrigger across all sections"
```

---

## Chunk 5: Features section timeline upgrade + integrate everything

### Task 9: Upgrade Features GSAP timeline

**Files:**
- Modify: `src/app/landing/sections/FeaturesSection.tsx`

- [ ] **Step 1: Add scale transitions to feature visual panel**

In the existing GSAP ScrollTrigger `onUpdate`, add:
- Visual panel scale: outgoing `scale: 1 → 0.95`, incoming `scale: 1.05 → 1`
- Smoother crossfade with overlapping timings (current text just uses opacity/translateY)

### Task 10: Integrate LoadingScreen + CausticOverlay into LandingPage

**Files:**
- Modify: `src/app/landing/LandingPage.tsx`

- [ ] **Step 1: Add imports and render LoadingScreen + CausticOverlay**

```tsx
import LoadingScreen from "./effects/LoadingScreen";
import CausticOverlay from "./effects/CausticOverlay";
```

Add to render, in layer order:
```tsx
{/* Loading screen (above everything, exits after 2s) */}
<LoadingScreen />

{/* Between particle canvas and film-grain: */}
<CausticOverlay />
```

- [ ] **Step 2: Verify full page compiles and renders** — `npx tsc --noEmit | grep landing`

- [ ] **Step 3: Commit**
```bash
git add src/app/landing/
git commit -m "feat: integrate LoadingScreen + CausticOverlay + Features timeline upgrade"
```

---

## Chunk 6: Final verification

### Task 11: End-to-end verification

- [ ] **Step 1: Run `npx next dev` and verify:**
  - Loading screen appears for 2s then fades out
  - Hero elements stagger in after loading screen exits
  - Hero content fades + moves up on scroll (parallax)
  - Features section crossfades with scale transitions
  - All section headings/cards animate in on scroll (GSAP)
  - Cards have glow hover effects
  - Buttons have pulse glow on hover
  - Caustic overlay visible (subtle shifting light pattern)
  - Noise texture visible (very subtle grain)
  - Hero section has darker vignette
  - CTA section has darkest vignette
  - No console errors
  - 60fps performance maintained

- [ ] **Step 2: Test mobile** — verify GSAP animations degrade gracefully (no `prefers-reduced-motion` issues)

- [ ] **Step 3: Final commit**
```bash
git add .
git commit -m "feat: complete Selenis animation upgrade — GSAP entrances, loading screen, caustics, hover glow"
```
