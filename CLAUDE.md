# Langfens - IELTS Practice Platform

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Framer Motion (animations)
- Zustand (state management)
- Axios (HTTP client)
- Three.js + React Three Fiber + Drei (3D scene — landing page only)
- GSAP + ScrollTrigger (scroll-driven animations — landing page only)
- lottie-web / lottie-react (penguin mascot animations)
- canvas-confetti (celebration effects)

---

## App Design System (all pages EXCEPT landing page)

### Visual Rules (STRICT)
- **No icons** on new/redesigned pages. No Material Symbols, no lucide-react, no react-icons, no emoji icons. Use text labels, numbers, or CSS shapes.
- **No gradients**. Solid colors only. No `bg-gradient-to-*`, no `linear-gradient()`, no `radial-gradient()`.
- **No emojis** in UI content.
- **No heavy UI components**. Keep formal, standard. Prefer shadcn primitives.

### Components
- Use **shadcn/ui** (`src/components/ui/`) for all new code
- Legacy: `src/components/Button.tsx`, `src/components/Input.tsx` — do not use in new code
- Use Next.js `<Image>` for all images
- Use Framer Motion for animations

### Colors (Solid Only)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#2563EB` (blue-600) | CTA buttons, primary actions |
| `--primary-hover` | `#1D4ED8` (blue-700) | Button hover states |
| `--primary-dark` | `#1E40AF` (blue-800) | Brand headings |
| `--primary-light` | `#DBEAFE` (blue-100) | Highlight backgrounds |
| `--background` | `#F8F9FA` | Page background |
| `--surface` | `#FFFFFF` | Cards, containers |
| Body text | `text-slate-600` | Paragraphs |
| Muted text | `text-slate-400` | Secondary info |
| Borders | `border-slate-200` | Card/section borders |

### Typography
- **Font**: Nunito — used for EVERYTHING (headings + body). Do NOT use Inter, Merriweather, Geist, or any other font.
- `font-serif` and `font-sans` both resolve to Nunito
- H1: `text-3xl sm:text-4xl lg:text-5xl font-extrabold`
- H2: `text-2xl sm:text-3xl font-bold`
- H3: `text-xl font-semibold`
- Body: `text-base text-slate-600`
- Small: `text-sm text-slate-500`

### Layout & Spacing
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section padding: `py-16 lg:py-20`
- Card padding: `p-6` or `p-8`
- Grid gaps: `gap-4` (tight), `gap-6` (normal), `gap-8` (relaxed)

### Border Radius
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Small elements: `rounded-lg`
- Badges/pills: `rounded-full`

### Shadows
- Default cards: `shadow-sm`
- Hover state: `shadow-md`
- Elevated (modals): `shadow-lg`

### Animations (Framer Motion)
- `whileInView` with `viewport={{ once: true }}`
- Reveal: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ y: -2 }}`, `whileTap={{ scale: 0.98 }}`
- Duration: 0.5–0.6s, ease: `easeOut`
- Stagger: `staggerChildren: 0.08`

---

## Landing Page Design System (`/`)

The landing page is a **dark ocean cinematic theme** — completely separate from the app. All code lives in `src/app/landing/`. The app visual rules (no gradients, no icons, Nunito-only, solid colors) do **NOT** apply here.

### Theme: Dark Ocean
Everything scoped under `.landing-ocean` CSS class (defined in `landing-ocean.css`). Does not leak to the rest of the app.

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--ocean-bg` | `#040B14` | Page background (near-black blue) |
| `--ocean-bg-light` | `#0A1628` | Card backgrounds |
| `--ocean-surface` | `#0F1D32` | Elevated surfaces |
| `--ocean-primary` | `#0EA5E9` (sky-500) | CTA buttons, glows, accents |
| `--ocean-primary-hover` | `#0284C7` | Button hover |
| `--ocean-primary-light` | `#38BDF8` | Highlights |
| `--ocean-primary-glow` | `rgba(14,165,233,0.3)` | Glow shadows |
| `--ocean-accent` | `#06D6A0` | Seafoam/teal — gamification, success |
| `--ocean-gold` | `#F59E0B` | Amber — streaks, stars |
| `--ocean-text` | `#F0F4F8` | Primary text |
| `--ocean-text-secondary` | `#94A3B8` | Secondary text |
| `--ocean-text-muted` | `#64748B` | Muted text |
| `--ocean-border` | `rgba(255,255,255,0.06)` | Card/section borders |
| `--ocean-border-glow` | `rgba(14,165,233,0.2)` | Hover border glow |

### Gradients (ALLOWED on landing page)
- Ocean: `linear-gradient(135deg, #0EA5E9, #06D6A0)` — hero headline, CTA
- Aurora: `linear-gradient(135deg, #0EA5E9, #8B5CF6)` — AI features
- Gold: `linear-gradient(135deg, #F59E0B, #FBBF24)` — achievements
- Text gradient: `.text-gradient-ocean` (CSS class in `landing-ocean.css`)

### Typography
| Role | Font | Class |
|------|------|-------|
| Headings | **Sora** (bold, modern) | `.font-heading` |
| Body | **Inter** (clean, readable) | `.font-body` |
| Labels/stats/scores | **JetBrains Mono** (monospace) | `.font-code` |

Fonts loaded via `next/font/google` in `src/app/landing/fonts.ts`, applied only to `.landing-ocean` wrapper.

**Type scale:**
- Hero H1: `text-4xl sm:text-5xl lg:text-7xl font-bold`
- Section H2: `text-3xl sm:text-4xl lg:text-5xl font-bold`
- Card H3: `text-xl font-semibold`
- Pre-headline labels: `font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]`
- Body: `font-body text-lg text-[var(--ocean-text-secondary)]`
- Stat numbers: `font-heading text-5xl sm:text-6xl font-bold text-gradient-ocean`

### Card Style
- Class: `.ocean-card` (glassmorphism: `rgba(10,22,40,0.6)` + `backdrop-blur-12px` + border `--ocean-border`)
- Hover: border shifts to `--ocean-border-glow`, adds `--ocean-shadow-glow`
- Radius: `rounded-2xl`

### Button Styles
- Primary: `.btn-ocean` — solid `--ocean-primary`, white text, glow shadow, hover lifts + intensifies glow
- Ghost: `.btn-ghost` — transparent, border `rgba(255,255,255,0.12)`, hover border turns primary
- Radius: `rounded-xl`
- Padding: `px-8 py-3.5` (standard), `px-10 py-4` (large/CTA)

### Sections (7 + header)
| Section | Component | Behavior |
|---------|-----------|----------|
| Header | `OceanHeader` | Fixed, transparent → blur on scroll |
| Hero | `HeroSection` | `min-h-screen`, gradient headline, CTAs, 3D penguin viewport |
| Features | `FeaturesSection` | GSAP ScrollTrigger pinned (600vh), 6 features crossfade, progress dots |
| How It Works | `HowItWorksSection` | 3 step cards, SVG connecting line animation |
| Stats | `StatsSection` | 3-column grid, count-up animation on scroll (`useCountUp`) |
| Testimonials | `TestimonialsSection` | 3 glassmorphism cards, star ratings, score badges |
| CTA | `CTASection` | `min-h-screen`, gradient headline, confetti on click |
| Footer | `FooterSection` | Dark footer, back-to-top button |

### Z-Index Layer Order
1. `z-0` — CSS dark background
2. `z-1` — R3F Canvas (fixed, transparent, `pointer-events: none`)
3. `z-2` — OceanParticleCanvas (2D canvas)
4. `z-5` — Cinematic CSS overlays (film grain, vignette, light leak)
5. `z-10` — HTML sections (relative positioned)
6. `z-20` — Feature progress dots (fixed left)
7. `z-50` — Custom cursor, section dots
8. `z-[100]` — Sticky header
9. `z-[101]` — Scroll progress bar

### Cinematic Effects
- **Particles**: `OceanParticleCanvas` — bubbles (rise), plankton (drift), dust, volumetric light rays
- **Film grain**: `.film-grain` CSS overlay (opacity 0.025)
- **Vignette**: `.ocean-vignette` — dark radial gradient, intensity driven by scroll velocity
- **Light leak**: `.ocean-light-leak` — sweeping blue gradient animation
- **Custom cursor**: `CustomCursor` — 16px ring, expands to 40px on hover, `cursor: none` on desktop
- **Scroll progress**: `ScrollProgressBar` — 3px top bar, `--ocean-primary` with glow
- **Section dots**: `SectionDots` — fixed right, 7 dots, click to scroll, tooltip on hover
- **Confetti**: `useOceanConfetti` — ocean colors `#0EA5E9, #06D6A0, #38BDF8, #34D399`

### 3D Penguin Scene
- R3F Canvas: `position: fixed; inset: 0; z-index: 1; pointer-events: none`
- Loaded via `next/dynamic({ ssr: false })` for code-splitting
- **PenguinModel**: Lottie billboard (`lottie-web` → hidden DOM container → canvas → `THREE.CanvasTexture` → `<Billboard>`)
- **PenguinController**: Scroll-driven keyframe positions with smoothstep interpolation
- **OceanEnvironment**: Fog (`#040B14`, 8–30), blue ambient + directional lights
- Skipped on `minimal` device tier → falls back to existing `MascotWrapper` (Lottie)

### Device Tier Degradation
Via `useDeviceCapability` hook:
| Tier | Criteria | Effects |
|------|----------|---------|
| `full` | Desktop, motion enabled | All effects: R3F, particles, custom cursor, interactions |
| `reduced` | Mobile or prefers-reduced-motion | Fewer particles, no cursor, no interactions |
| `minimal` | Low CPU (≤2 cores) or low RAM (≤2GB) | No R3F, no particles, Lottie fallback only |

### Content
- **English only** on landing page
- All text in `src/app/landing/data.ts` (centralized constants)
- Social proof: "4.8/5 from 2,000+ students"
- Stats: 3,200+ tests, 75% pass rate, 80% band improvement

### Penguin Mascot Assets
| File | Format | Details |
|------|--------|---------|
| `/public/animation/penguin.json` | Lottie JSON | "Penguin with binoculars", 766x864px, 30fps, 161 frames |
| `/public/animation/sleepPenguin.json` | Lottie JSON | Sleep animation, 1000x1000px, 180 frames |
| `/public/models/penguin.glb` | **(not yet)** | Upgrade path: AI generate via Meshy.ai → `useGLTF` in PenguinModel.tsx |

---

## Project Structure
- `src/app/` — Pages (App Router)
- `src/app/landing/` — Cinematic ocean landing page (self-contained)
  - `sections/` — HeroSection, FeaturesSection, HowItWorksSection, StatsSection, TestimonialsSection, CTASection, FooterSection, OceanHeader
  - `three/` — PenguinScene, PenguinModel, PenguinController, OceanEnvironment
  - `effects/` — OceanParticleCanvas, CustomCursor, ScrollProgressBar, SectionDots
  - `hooks/` — useScrollProgress, useCountUp, useSectionInView, useOceanConfetti
  - `landing-ocean.css`, `fonts.ts`, `data.ts`, `LandingPage.tsx`
- `src/app/components/` — Shared effects (ParticleCanvas, useMouseParallax, mascot, effects store)
- `src/components/` — Shared components (legacy custom)
- `src/components/ui/` — shadcn/ui components (standard)
- `src/types/` — TypeScript type definitions
- `src/utils/` — API services (Axios)
- `src/lib/` — Utilities (cn helper)
- `src/app/store/` — Zustand stores
- `src/app/page.legacy.tsx` — Backup of old Vietnamese light-themed landing page

## API Architecture
Backend is microservices. API clients defined in `src/utils/api.customize.ts`:
- api-auth, api-exams, api-attempts, api-vocabulary, api-speaking
- api-writing, api-dictionary, api-gamification, api-analytics
- api-notification, api-course

All use Bearer token auth with automatic refresh on 401.

## Important Notes
- Landing page (`/`) and auth pages (`/auth/*`) do NOT show the main header
- `AppShell.tsx` conditionally removes `bg-gray-50` when on `/` (landing page manages its own dark background)
- Other pages still use legacy components (Material Symbols icons, custom Button) — do not break them
- The app is bilingual (Vietnamese primary, English secondary)
- Target audience: IELTS students, primarily Vietnamese high school/university students
