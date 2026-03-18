"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { FEATURES } from "../data";
import { FeatureVisual } from "../ui/feature-visuals";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, DURATION } from "../lib/animation-config";

const VISUAL_TYPES = ["skills", "grading", "questions", "analytics", "flashcards", "gamification"] as const;

const FEATURE_COLORS = ['#2563EB', '#06D6A0', '#FF9600', '#8B5CF6', '#2563EB', '#F59E0B'];

export default function FeaturesSection() {
  const { tier } = useDeviceCapability();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (tier === "minimal" || reducedMotion) return;

    const texts = gsap.utils.toArray<HTMLElement>(".feature-text");
    const visuals = gsap.utils.toArray<HTMLElement>(".feature-visual");
    const dots = gsap.utils.toArray<HTMLElement>(".feature-dot");
    const total = texts.length;
    if (total === 0) return;

    // Helper: set dot to active/inactive via individual CSS properties
    const setDotActive = (dot: HTMLElement) => {
      gsap.set(dot, {
        width: 14,
        height: 14,
        backgroundColor: 'var(--ocean-primary)',
        borderColor: 'var(--ocean-primary-light)',
        opacity: 1,
        boxShadow: '0 0 12px var(--ocean-primary-glow)',
      });
    };
    const setDotInactive = (dot: HTMLElement) => {
      gsap.set(dot, {
        width: 10,
        height: 10,
        backgroundColor: 'var(--ocean-surface-light)',
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: 0.5,
        boxShadow: 'none',
      });
    };

    // Show first items
    gsap.set(texts[0], { opacity: 1, y: 0 });
    gsap.set(visuals[0], { opacity: 1, scale: 1 });
    if (dots[0]) setDotActive(dots[0] as HTMLElement);

    // Build timeline for transitions between features
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: pinRef.current,
        scrub: 1,
      },
    });

    for (let i = 0; i < total - 1; i++) {
      const position = i; // timeline position

      // Fade out current
      tl.to(texts[i], { opacity: 0, y: -30, duration: 0.4, ease: EASE.smooth }, position);
      tl.to(visuals[i], { opacity: 0, scale: 0.95, duration: 0.4, ease: EASE.smooth }, position);

      // Deactivate current dot
      if (dots[i]) {
        tl.call(() => setDotInactive(dots[i] as HTMLElement), [], position + 0.3);
      }

      // Fade in next
      tl.fromTo(texts[i + 1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE.smooth }, position + 0.3);
      tl.fromTo(visuals[i + 1], { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.4, ease: EASE.smooth }, position + 0.3);

      // Activate next dot
      if (dots[i + 1]) {
        tl.call(() => setDotActive(dots[i + 1] as HTMLElement), [], position + 0.3);
      }
    }
  }, { scope: sectionRef, dependencies: [tier, reducedMotion] });

  // Mobile / minimal fallback: simple grid
  if (tier === "minimal") {
    return (
      <section id="features" className="relative z-10 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="text-sm font-bold tracking-wide text-[var(--ocean-primary)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              What you&apos;ll get
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold mt-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Everything You Need to Succeed
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="bg-[var(--ocean-bg-light)] border-[3px] border-[rgba(255,255,255,0.07)] rounded-[2rem] shadow-[0_5px_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-150 hover:-translate-y-[3px] hover:scale-[1.01] hover:border-[var(--ocean-border-glow)] hover:shadow-[0_7px_0_rgba(0,0,0,0.35),0_0_25px_var(--ocean-primary-glow)] p-6"
              >
                <span
                  className="text-xs tracking-widest"
                  style={{ color: FEATURE_COLORS[i], fontFamily: 'var(--font-code)' }}
                >
                  {f.number} — {f.label}
                </span>
                <h3
                  className="text-xl font-semibold mt-3 mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm text-[var(--ocean-text-secondary)] leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: GSAP timeline-driven pinned section
  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative z-10"
      style={{ height: "600vh" }}
    >
      <div
        ref={pinRef}
        className="h-screen flex items-center"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-[45%_55%] gap-12 items-center">
          {/* Left: Text panel — stacked absolutely, GSAP controls visibility */}
          <div className="relative min-h-[400px]">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="feature-text absolute inset-0 flex flex-col justify-center"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <span
                  className="text-xs tracking-wide mb-4"
                  style={{ color: FEATURE_COLORS[i], fontFamily: 'var(--font-code)' }}
                >
                  {feature.number} — {feature.label}
                </span>
                <h3
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-lg text-[var(--ocean-text-secondary)] leading-relaxed mb-6 max-w-lg"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {feature.description}
                </p>
                <span
                  className="text-sm font-medium cursor-pointer hover:underline"
                  style={{ color: FEATURE_COLORS[i], fontFamily: 'var(--font-body)' }}
                >
                  {feature.cta} →
                </span>
              </div>
            ))}
          </div>

          {/* Right: Visual panel — FeatureVisual SVGs with pseudo-3D depth */}
          <div className="hidden lg:flex items-center justify-center" style={{ perspective: "800px" }}>
            <div className="relative w-full max-w-lg aspect-[16/10]">
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  className="feature-visual absolute inset-0 flex items-center justify-center rounded-[2rem] border border-[var(--ocean-border)]/50 overflow-hidden shadow-[inset_0_0_40px_rgba(37,99,235,0.06)]"
                  style={{
                    opacity: i === 0 ? 1 : 0,
                    background: "linear-gradient(135deg, rgba(37,99,235,0.04), rgba(6,214,160,0.02))",
                    backdropFilter: "blur(2px)",
                    transform: "rotateY(2deg) rotateX(-1deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <FeatureVisual type={VISUAL_TYPES[i]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress dots - left edge */}
        <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 hidden xl:flex">
          {FEATURES.map((_, i) => (
            <div
              key={i}
              className="feature-dot rounded-full border-2 transition-all duration-300"
              style={{
                width: i === 0 ? 14 : 10,
                height: i === 0 ? 14 : 10,
                backgroundColor: i === 0 ? 'var(--ocean-primary)' : 'var(--ocean-surface-light)',
                borderColor: i === 0 ? 'var(--ocean-primary-light)' : 'rgba(255,255,255,0.1)',
                opacity: i === 0 ? 1 : 0.5,
                boxShadow: i === 0 ? '0 0 12px var(--ocean-primary-glow)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
