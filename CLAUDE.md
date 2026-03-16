# Langfens - IELTS Practice Platform

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Framer Motion (animations)
- Zustand (state management)
- Axios (HTTP client)

## Design System Rules

### Components
- Use **shadcn/ui** components (`src/components/ui/`) as the standard
- Old custom components (`src/components/Button.tsx`, `src/components/Input.tsx`) are legacy — use shadcn equivalents for new code
- Use Next.js `<Image>` for all images
- Use Framer Motion for animations

### Visual Rules (STRICT)
- **No icons**: Do not use Material Symbols, emoji icons, lucide-react, or react-icons on new/redesigned pages. Use text labels, numbers, or CSS decorative shapes instead.
- **No gradients**: Solid colors only. No `bg-gradient-to-*`, no `linear-gradient()`, no `radial-gradient()`.
- **No heavy UI components**: Keep components formal and standard. Prefer shadcn primitives.
- **No emojis** in UI content.

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
- **Font**: Nunito (Duolingo-style, rounded sans-serif) — used for EVERYTHING (headings + body)
- Do NOT use Inter, Merriweather, Geist, or any other font. Only Nunito.
- `font-serif` and `font-sans` both resolve to Nunito
- H1: `text-3xl sm:text-4xl lg:text-5xl font-extrabold`
- H2: `text-2xl sm:text-3xl font-bold`
- H3: `text-xl font-semibold`
- Body: `text-base text-slate-600`
- Small: `text-sm text-slate-500`

### Spacing
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section vertical padding: `py-16 lg:py-20`
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
- Use `whileInView` with `viewport={{ once: true }}`
- Standard reveal: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ y: -2 }}`, `whileTap={{ scale: 0.98 }}`
- Duration: 0.5-0.6s, ease: `easeOut`
- Stagger children: `staggerChildren: 0.08`

## Project Structure
- `src/app/` — Pages (App Router)
- `src/components/` — Shared components (legacy custom)
- `src/components/ui/` — shadcn/ui components (standard)
- `src/types/` — TypeScript type definitions
- `src/utils/` — API services (Axios)
- `src/lib/` — Utilities (cn helper)
- `src/app/store/` — Zustand stores

## API Architecture
Backend is microservices. API clients defined in `src/utils/api.customize.ts`:
- api-auth, api-exams, api-attempts, api-vocabulary, api-speaking
- api-writing, api-dictionary, api-gamification, api-analytics
- api-notification, api-course

All use Bearer token auth with automatic refresh on 401.

### Landing Page Exception
The landing page (`/`) uses the **standard light theme** but with additional interactive effects:
- Light background (`#F8F9FA`) with blue-50 section alternation — matches app palette
- GSAP for mouse parallax (`useMouseParallax` hook)
- Canvas particle effects in blue (`ParticleCanvas` component)
- Subtle film grain, vignette, light leak CSS overlays (scoped under `.cinematic` class)
- Mascot reactions (MascotWrapper with GSAP animations)
- Interactive card tilt, nav underline, click ripples (InteractiveEffects component)
- Confetti on CTA click (useConfetti hook)
All colors use the standard design system tokens (blue-600 primary, slate text).

## Important Notes
- Landing page (`/`) and auth pages (`/auth/*`) do NOT show the main header
- Other pages still use legacy components (Material Symbols icons, custom Button) — do not break them
- The app is bilingual (Vietnamese primary, English secondary)
- Target audience: IELTS students, primarily Vietnamese high school/university students
