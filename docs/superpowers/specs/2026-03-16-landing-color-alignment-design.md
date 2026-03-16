# Landing Page Color Alignment

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Recolor the landing page from dark-navy/teal cinematic theme to the app's standard light-blue-on-white palette. Remove the GamificationHUD overlay. Keep all other components (particles, mascot, interactive effects, cinematic overlays).

## Problem

The landing page uses a deep navy background (`#0A1625`) with teal (`#00E5FF`) accents — a completely different visual language from the rest of the app which uses light gray backgrounds (`#F8F9FA`), blue primary (`#2563EB`), white cards, and slate text. Users transitioning from the landing page to the app experience a jarring disconnect. The floating GamificationHUD (flame, hearts, XP, combo badge) also looks gimmicky and unprofessional.

## Solution

Two changes:
1. **Remove GamificationHUD** from page.tsx rendering (keep files, just don't render)
2. **Recolor all landing page elements** to match the app's design system

## Color Mapping

| Element | Current | New |
|---------|---------|-----|
| Page background | `#0A1625` | `#F8F9FA` |
| Section alt background | `#001F3F` at 60% | `#EFF6FF` (blue-50) |
| Primary accent | `#00E5FF` (teal) | `#2563EB` (blue-600) |
| Accent hover | — | `#2563EB` (blue-600) |
| Accent dark | — | `#1E40AF` (blue-800) |
| Heading text | `white` / `#F0F4F8` | `text-slate-800` |
| Body text | `white/60` | `text-slate-600` |
| Muted text | `white/30-50` | `text-slate-400` |
| Card background | `rgba(255,255,255,0.04)` glassmorphism | `#FFFFFF` solid |
| Card border | `rgba(0,229,255,0.12)` | `border-slate-200` |
| Card shadow | `0 0 30px rgba(0,229,255,0.04)` glow | `shadow-sm` |
| Card hover shadow | `0 0 40px rgba(0,229,255,0.08)` | `shadow-md` |
| Card hover border | `rgba(0,229,255,0.25)` | `border-blue-200` |
| Button primary bg | `#00E5FF/10` (teal ghost) | `#2563EB` (blue solid) |
| Button primary text | `#00E5FF` | `white` |
| Button outline | `border-white/20 text-white/70` | `border-slate-300 text-slate-600` |
| Button glow | `0 0 15px rgba(0,229,255,0.15)` | None |
| Button hover glow | `0 0 30px` + scale 1.05 | `shadow-md`, no scale |
| Header bg | `#0A1625/80 backdrop-blur` | `white/80 backdrop-blur` |
| Header border | `#00E5FF/10` | `border-slate-200` |
| Header nav text | `white/50` | `text-slate-600` |
| Header nav hover | `#00E5FF` | `#2563EB` (blue-600) |
| Header button bg | `#001F3F` | `#2563EB` |
| Header button text | `#00E5FF` | `white` |
| Text glow (`.text-glow`) | `0 0 20px rgba(0,229,255,0.3)` | Remove text-shadow entirely |
| Badge bg | `white/5 border #00E5FF/20` | `bg-blue-50 border-blue-200` |
| Badge text | `#00E5FF` | `text-blue-600` |
| Stats left border | `border-l-[#00E5FF]` | `border-l-blue-600` |
| Stat numbers | `#00E5FF` with text-glow | `text-blue-600`, no glow |
| Step numbers | `#00E5FF` with text-glow | `text-blue-600`, no glow |
| Testimonial quote | `white/75 italic` | `text-slate-600 italic` |
| Testimonial name | `white` | `text-slate-800` |
| Testimonial detail | `white/40` | `text-slate-400` |
| Footer text | `white/30` | `text-slate-400` |
| Footer border | `border-white/5` | `border-slate-200` |
| Final CTA card | Teal glow box-shadow | `shadow-lg` standard |

## CSS Changes (globals.css)

All under the `.cinematic` scoped section:

| CSS Class | Change |
|-----------|--------|
| `.glass-card` | `background: white`, `border: 1px solid var(--border)`, `box-shadow: shadow-sm` equivalent, remove `backdrop-filter` |
| `.glass-card:hover` | `border-color: #BFDBFE` (blue-200), `box-shadow: shadow-md` equivalent |
| `.text-glow` | Remove `text-shadow` entirely (set to `none`) |
| `.btn-cinematic` | Remove `border` override, remove `box-shadow` glow |
| `.btn-cinematic:hover` | Remove glow, remove `transform: scale(1.05)` |
| `.ambient-glow` keyframes | Change `rgba(0,229,255)` to `rgba(37,99,235)` (blue-600) |
| `.film-grain` | Keep as-is (very subtle at 3.5% opacity, barely visible on light bg) |
| `.vignette` | Change to very subtle: `rgba(0,0,0,0.1)` instead of `0.55` |
| `.vignette.dynamic` | Same reduction, adjust `--vignette-intensity` range |
| `.light-leak` | Change teal/gold to blue tones: `rgba(37,99,235,0.04)` + `rgba(147,197,253,0.03)` |
| `.lens-flare` | Change teal to blue: `rgba(37,99,235,0.2)`, reduce opacity |
| `.cinematic nav.nav-glow::after` | Change `#00E5FF` to `#2563EB`, reduce glow intensity |
| `.ripple-effect` | Change `rgba(0,229,255,0.5)` to `rgba(37,99,235,0.3)` |
| `.glass-card.tilt-active:hover` | Change teal glows to blue with reduced intensity |
| `.light-ray-sweep::before` | Change teal to blue: `rgba(37,99,235,0.04)` |
| `.flame-icon` | Keep as-is (only used by HUD which is being removed) |
| `.css-heart` | Keep as-is (only used by HUD which is being removed) |

## Particle System Changes

In `ParticleCanvas.tsx` — recolor all particle rendering from teal to blue:
- Teal glow particles: `rgba(0, 229, 255, ...)` → `rgba(59, 130, 246, ...)` (blue-600)
- Bright core: `rgba(200, 240, 255, ...)` → `rgba(191, 219, 254, ...)` (blue-200)
- Connection lines: Same teal→blue change
- Wave curves: Same teal→blue change
- Bubble particles: Keep the `rgba(100, 200, 255, ...)` light blue as-is (already close to the new palette)

## Confetti Changes

In `useConfetti.ts`:
- Change `COLORS` from `["#00E5FF", "#FFD700"]` to `["#2563EB", "#93C5FD"]` (blue-600 + blue-300)

## Mascot Changes

In page.tsx — ambient glow circle:
- Change `bg-[#00E5FF]/5` to `bg-blue-600/5`

## page.tsx Changes

1. Remove `<GamificationHUD deviceTier={deviceTier} />` from the JSX
2. Remove the GamificationHUD import
3. Recolor all inline Tailwind classes (see color mapping above)
4. Keep the `.cinematic` class on the root div (it scopes all the cinematic CSS rules) and update all `.cinematic`-scoped CSS to use the new blue-on-light palette

## Files Modified

| File | Change Type |
|------|-------------|
| `src/app/globals.css` | Recolor all `.cinematic` CSS, update `.glass-card`, `.text-glow`, `.btn-cinematic`, overlays |
| `src/app/page.tsx` | Recolor all inline Tailwind classes, remove GamificationHUD |
| `src/app/components/ParticleCanvas.tsx` | Recolor particles from teal to blue |
| `src/app/components/interactions/useConfetti.ts` | Change confetti colors |
| `CLAUDE.md` | Update Landing Page Exception to reflect new light theme |

## Files NOT Modified

Everything else stays as-is: MascotWrapper, useMascotReactions, InteractiveEffects, useDeviceCapability, useScrollVelocity, useIdleDetection, ProgressRing. The GamificationHUD files are kept but just not rendered.

## CLAUDE.md Update

The "Landing Page Exception" in CLAUDE.md currently specifies the dark cinematic theme. After this change, update it to reflect the new light theme aligned with the standard design system. The landing page will still use particles, mascot effects, and cinematic overlays — but in the app's blue color palette on a light background.
