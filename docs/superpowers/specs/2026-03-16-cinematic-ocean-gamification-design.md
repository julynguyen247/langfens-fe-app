# Cinematic Ocean Gamification — Landing Page Enhancement

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Visual and interactive enhancements to the existing landing page (`/`). No structural changes.

## Overview

Enhance the Langfens landing page with Duolingo-style gamification elements and ultra-cinematic ocean effects. The existing layout, section order, text content, and navigation remain completely unchanged. All enhancements are additive: new overlay components, extended particle system, enhanced CSS, and interactive behaviors.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mascot | Keep existing Penguin (Lottie) | Already branded, just needs interactive behaviors |
| Particle system | Extend custom ParticleCanvas | Zero new dependencies, full control, lighter bundle |
| New overlays | Freely added | Existing sections stay untouched |
| Mobile strategy | Progressive degradation (3 tiers) | Budget Android phones common among Vietnamese students |
| Confetti | canvas-confetti npm package | ~6KB, battle-tested, easy API |
| Architecture | Layered composable systems | Matches existing codebase patterns, each system independent |

## Architecture

### Approach: Layered Composable Systems

Each effect system is an independent React component or hook with its own lifecycle. A shared Zustand store provides common reactive state (mouse position, scroll velocity, device tier, idle status). No central orchestrator — cross-system triggers use explicit function calls via refs.

### Shared State Store

`useLandingEffectsStore.ts` — Zustand store:
- `mousePosition: { x, y }` — written by global mousemove listener
- `scrollY: number` — written by useScrollVelocity
- `scrollVelocity: number` — computed delta between frames
- `isIdle: boolean` — true after 5s of no mouse movement
- `deviceTier: 'full' | 'reduced' | 'minimal'` — set on mount by useDeviceCapability
- `heroInView: boolean` — set by IntersectionObserver on hero section

Components read from this store. Canvas/rAF loops read imperatively via `store.getState()` to avoid React re-renders.

### Z-Index Layer Stack

| Z-Index | Layer | Notes |
|---------|-------|-------|
| 0 | ParticleCanvas | Ambient particles, waves |
| 10 | Page content | Sections, cards, buttons (existing) |
| 40 | Vignette + Light leak + Lens flare | CSS overlays (existing + enhanced) |
| 45 | InteractiveEffects | Ripples, pointer-events: none |
| 50 | GamificationHUD | Top-right floating, pointer-events on children |
| 90 | Mascot peek | Fixed bottom-right when scrolled past hero |
| 100 | Header | Existing sticky header |
| 9997 | canvas-confetti canvas | Created by canvas-confetti lib, above content |
| 9998 | Film grain | Existing overlay |

### New File Structure (12 new files)

```
src/app/components/
  ParticleCanvas.tsx              ← MODIFY
  useMouseParallax.ts             ← UNCHANGED

  effects/
    useDeviceCapability.ts        ← NEW
    useLandingEffectsStore.ts     ← NEW
    useScrollVelocity.ts          ← NEW
    useIdleDetection.ts           ← NEW

  mascot/
    MascotWrapper.tsx             ← NEW
    useMascotReactions.ts         ← NEW

  gamification/
    GamificationHUD.tsx           ← NEW
    ProgressRing.tsx              ← NEW

  interactions/
    useConfetti.ts                ← NEW
    InteractiveEffects.tsx        ← NEW

src/app/globals.css               ← MODIFY
src/app/page.tsx                  ← MODIFY (~20 lines)
```

### New Dependencies

- `canvas-confetti` (~6KB gzipped) + `@types/canvas-confetti`
- No other new dependencies

### Bundle Size Impact

- canvas-confetti: ~6KB gzipped
- New components/hooks: ~8-12KB source
- Total estimated addition: ~15KB gzipped

## System 1: Enhanced Particle System

**File:** `ParticleCanvas.tsx` (modify existing)

### Particle Types

| Type | Count % | Radius | Behavior | Color | Mouse |
|------|---------|--------|----------|-------|-------|
| Teal glow | 50% | 0.5-2.5px | Existing behavior, enhanced glow | Cyan `rgba(200,240,255)` | Repulsion |
| Bubble | 30% | 4-8px | Slow upward drift, vy biased negative | Semi-transparent with highlight arc | Attraction |
| Star | 20% | 0.5-1px | Fast twinkle, no connections | White | None |

Desktop: 60 particles total. Mobile (reduced): 20 particles (60% teal, 40% bubble, no stars).

### Ocean Wave Curves

- 3 sinusoidal curves across canvas width in the bottom third
- Each wave: different amplitude (10-30px), frequency, speed, vertical position
- Rendered with `ctx.beginPath()` + `ctx.quadraticCurveTo()` in a loop
- Subtle teal color at alpha 0.03-0.06
- Desktop only (`deviceTier === 'full'`)

### Scroll Velocity Influence

- Read `scrollVelocity` from store via `store.getState()` in rAF loop
- Add `scrollVelocity * 0.01` to each particle's `vy`
- Creates brief upward "swoosh" during fast scrolling

### Click Burst API

- Expose `burstFromPoint(x: number, y: number)` via `useImperativeHandle`
- Spawns 15-20 temporary particles at the given point
- High initial velocity, fade out over 1 second
- Called by InteractiveEffects on hero click events
- Mobile: disabled on reduced/minimal tier

## System 2: Penguin Mascot Reactions

**Files:** `MascotWrapper.tsx`, `useMascotReactions.ts`

### MascotWrapper Component

Wraps existing `PenguinHero` (Lottie) in a div with a ref. Two positional modes:
- **Inline:** Normal position in hero grid (default)
- **Peeking:** Fixed position bottom-right (`bottom: 24px; right: 24px; z-index: 90`) when scrolled past hero

Mode switch uses IntersectionObserver on hero section (fires only on visibility change, not continuous scroll).

### Reaction Behaviors

| Trigger | Animation | GSAP Config |
|---------|-----------|-------------|
| Always (mount) | Gentle y bobbing | `y: -8, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut'` |
| Hover | Happy bounce + small confetti | `scale: 1.1` over 0.2s + `y: -12` + confetti (30 particles) |
| Click | Spin dance + big confetti | `rotation: 360` over 0.6s + `scale: 1.15` pulse + confetti (80 particles) |
| Idle 5s | Sad wiggle + sleep Lottie | Wobble `rotation: [-3, 3, -2, 1, 0]` over 2s. MascotWrapper owns Lottie rendering (lifts it out of PenguinHero): maintains two preloaded animation data refs (penguin.json + sleepPenguin.json), passes active data to a Lottie component. On idle, swaps data ref. |
| Scroll away | Slide to corner | GSAP `fromTo` slide-in from off-screen right to fixed position |
| Scroll back | Return inline | Reverse slide animation, remove fixed positioning |

### Implementation Notes

- All GSAP timelines use `gsap.context()` for proper cleanup on unmount
- `sleepPenguin.json` is prefetched on mount (not on idle) to avoid loading delay
- Confetti via `useConfetti` hook (see System 4)
- Mobile (reduced): floating motion only, no reactions, no peek mode

## System 3: Gamification HUD

**Files:** `GamificationHUD.tsx`, `ProgressRing.tsx`

### Position and Layout

- Fixed overlay: `position: fixed; top: 80px; right: 24px; z-index: 50`
- Horizontal flex row of gamification elements
- Container: `pointer-events: none`, children: `pointer-events: auto`
- Appears with a staggered fade-in animation on mount

### Elements (All Decorative)

| Element | Visual | Animation | Implementation |
|---------|--------|-----------|----------------|
| Streak flame | "7" with fire effect | CSS flickering (rapid opacity + scale oscillation) | CSS pseudo-elements with clip-path for flame shape. No emoji/icons. |
| XP counter | Gold coin + "2,450" | Number tweens 0→2,450 on mount (2s) | GSAP `gsap.to({ value: 0 }, { value: 2450, onUpdate })` with textContent. Coin is CSS `border-radius: 50%` circle with teal border and "XP" text — no icons/emoji. |
| Hearts | 3 red hearts | Staggered CSS pulse | CSS `::before`/`::after` for heart shape (no emoji). @keyframes pulse. |
| Combo badge | "x3" teal badge | Bounce-in on appearance | CSS @keyframes bounce |
| Progress ring | 73% filled circle | Wave-fill animation | SVG ProgressRing component (see below) |

### ProgressRing Component

- SVG circle with `stroke-dasharray`/`stroke-dashoffset` for progress arc
- Wave-fill effect: SVG `<clipPath>` with sinusoidal `<path>`
- Sinusoidal path animated via CSS @keyframes (horizontal shift = water surface illusion)
- Fill level animates 0% → 73% via GSAP
- Teal color (#00E5FF) with subtle glow via SVG `<filter>` (feGaussianBlur + feComposite)

### Mobile Degradation

- Reduced: only streak flame + XP counter (static, no animation)
- Minimal: hidden entirely

## System 4: Interactive Effects

**Files:** `InteractiveEffects.tsx`, `useConfetti.ts`

### useConfetti Hook

Wrapper around `canvas-confetti`:
- Dynamically imported via `import()` for code-splitting
- Creates a shared canvas once, reuses for all firings
- Preset configurations:
  - `celebration`: teal #00E5FF + gold #FFD700, 80 particles, spread 120
  - `small`: same colors, 30 particles, spread 50
  - `burst(x, y)`: from specific origin point
- Mobile (reduced): half particle counts
- Minimal: no-op function

### InteractiveEffects Component

Fixed overlay: `position: fixed; inset: 0; pointer-events: none; z-index: 45`

Attaches event listeners to existing DOM elements via `useEffect` + `document.querySelector`:

| Target | Event | Effect |
|--------|-------|--------|
| `.btn-cinematic` in hero | click | canvas-confetti celebration + ocean ripple CSS + mascot celebrate + particle burst |
| Hero section | click (not on buttons) | CSS ocean ripple at click point + ParticleCanvas.burstFromPoint(x, y) |
| `.glass-card` | mousemove | Set CSS custom properties `--tilt-x`, `--tilt-y` for 3D perspective tilt |
| `.glass-card` | mouseleave | Reset tilt to 0 with CSS transition |
| Nav links area | mousemove | Set `--nav-underline-x` CSS property on nav element |
| Sections | IntersectionObserver | Add `.light-ray-sweep` class on entry for horizontal glow animation |

### Implementation Notes

- All event listeners use `{ passive: true }` where applicable
- Cleanup on unmount removes all listeners
- Card tilt uses CSS custom properties to avoid conflict with Framer Motion's inline transforms
- Card tilt transform: `perspective(800px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))`
- Mobile: no card tilt, no hero click burst, confetti at half particle count

## System 5: Enhanced Cinematic CSS

**File:** `globals.css` (additions under `.cinematic` scope)

### New CSS Effects

| Effect | Selector | Implementation |
|--------|----------|----------------|
| Anamorphic lens flare | `.cinematic .lens-flare::after` or new pseudo | Horizontal light bar, @keyframes translateX + opacity. Different timing than light-leak. |
| Dynamic vignette | `.vignette::before` enhanced | CSS var `--vignette-intensity` written by JS on scroll. Radial gradient outer opacity uses this var. |
| Ocean ripple | `.ripple-effect` | @keyframes: expanding circular border that fades. Added/removed by InteractiveEffects on click. |
| Card tilt glow | `.glass-card` enhanced | `box-shadow: inset 0 0 20px rgba(0,229,255,0.06)` on hover. Transform uses CSS custom properties. |
| Nav neon underline | `nav::after` | 2px height, #00E5FF, box-shadow glow 8px, positioned via --nav-underline-x. |
| Light-ray sweep | `.light-ray-sweep::before` | Horizontal glow bar sweeps left-to-right. Triggered by adding class via JS. |

### Button Hover Enhancement

Existing `.btn-cinematic` enhanced:
- Scale 1.05 on hover (CSS transition)
- Intensified glow: `box-shadow: 0 0 30px rgba(0,229,255,0.3), 0 0 80px rgba(255,215,0,0.12)`
- Glassmorphism: backdrop-filter blur already present, increase on hover

## Foundation Hooks

### useDeviceCapability

Returns `{ tier: 'full' | 'reduced' | 'minimal', isMobile: boolean }`.

Detection criteria:
- **full:** Desktop, no `prefers-reduced-motion`, hardwareConcurrency > 2
- **reduced:** Mobile (touch device) OR `prefers-reduced-motion: reduce`
- **minimal:** `navigator.hardwareConcurrency <= 2` OR `navigator.deviceMemory <= 2`

Uses `useSyncExternalStore` to react to `prefers-reduced-motion` media query changes.

### useScrollVelocity

- Tracks `window.scrollY` with `requestAnimationFrame`
- Computes velocity as delta between consecutive frames
- Writes to Zustand store imperatively (no React re-renders)
- Also writes `--vignette-intensity` CSS variable to `document.documentElement`

### useIdleDetection

- Tracks time since last `mousemove`
- After 5 seconds: sets `isIdle: true` in store
- Any mouse movement resets timer, sets `isIdle: false`
- Desktop only (skipped on mobile)

## Integration in page.tsx

Minimal changes (~20 lines):

1. Import: `MascotWrapper`, `GamificationHUD`, `InteractiveEffects`, foundation hooks
2. Add hooks: `useScrollVelocity()`, `useIdleDetection()`, `useDeviceCapability()`
3. Wrap `<PenguinHero />` in `<MascotWrapper>`
4. Add overlays after existing overlays: `<InteractiveEffects />`, `<GamificationHUD />`
5. Add refs for ParticleCanvas burst API and confetti
6. Wire hero CTA `onClick` to fire confetti + mascot celebrate + particle burst

No changes to: section order, grid layouts, text content, button positions, or navigation.

## Build Order (Dependency Graph)

```
Phase 1: Foundation (all others depend on this)
  1.1 useDeviceCapability
  1.2 useLandingEffectsStore
  1.3 useScrollVelocity (depends on 1.2)
  1.4 useIdleDetection (depends on 1.2)
  1.5 useConfetti (independent, but needed by Phase 3)

Phase 2: Enhanced Particles (depends on 1.2, 1.3)
Phase 3: Mascot (depends on 1.2, 1.4, 1.5)
Phase 4: Gamification HUD (depends on 1.1)
Phase 5: Interactive Effects
  5.1 InteractiveEffects (depends on 1.5, Phase 2)

Phase 6: Enhanced CSS (independent)
Phase 7: Integration in page.tsx (depends on ALL above)
```

Phases 2-6 can be developed in parallel once Phase 1 is complete.

## Known Challenges

1. **Card tilt vs Framer Motion:** Existing cards use `whileHover={{ y: -4, scale: 1.02 }}`. 3D tilt applied via CSS custom properties avoids conflict with Framer Motion's inline transform.

2. **canvas-confetti canvas management:** Library creates a new canvas unless given an existing one. Create shared canvas once on first confetti call, reuse for all subsequent firings.

3. **Lottie data swapping for idle:** Both `penguin.json` and `sleepPenguin.json` must be loaded on mount. Prefetch sleep animation to avoid visible loading delay on idle trigger.

4. **GSAP cleanup:** All GSAP tweens in mascot must use `gsap.context()` and revert on unmount to prevent memory leaks.

5. **Mascot peek scroll performance:** Use IntersectionObserver (fires only on visibility change) rather than continuous scroll listener for hero-in-view detection.

6. **ParticleCanvas forwardRef:** Current component is a plain function component. Must convert to `forwardRef` to expose `burstFromPoint` via `useImperativeHandle`.

7. **navigator.deviceMemory typing:** Non-standard Chrome-only API, not in TypeScript's lib types. Needs type assertion or declaration merge (`declare global { interface Navigator { deviceMemory?: number } }`).

8. **canvas-confetti canvas reuse:** Create a shared canvas element once on first call, pass to `confetti.create(canvas)`. Prevents DOM pollution from repeated firings. Position at z-index 9997.
