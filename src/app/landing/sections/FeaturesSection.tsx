"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { FEATURES } from "../data";
import { FeatureVisual } from "../ui/FeatureVisual";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, DURATION } from "../lib/animation-config";

const VISUAL_TYPES = ["skills", "grading", "questions", "analytics", "flashcards", "gamification"] as const;

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

    // Show first items
    gsap.set(texts[0], { opacity: 1, y: 0 });
    gsap.set(visuals[0], { opacity: 1, scale: 1 });
    if (dots[0]) gsap.set(dots[0], { className: "feature-dot active" });

    // Build timeline for transitions between features
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: pinRef.current,
        scrub: 0.5,
      },
    });

    for (let i = 0; i < total - 1; i++) {
      const position = i; // timeline position

      // Fade out current
      tl.to(texts[i], { opacity: 0, y: -30, duration: 0.4, ease: EASE.smooth }, position);
      tl.to(visuals[i], { opacity: 0, scale: 0.95, duration: 0.4, ease: EASE.smooth }, position);

      // Deactivate current dot
      if (dots[i]) {
        tl.set(dots[i], { className: "feature-dot" }, position + 0.3);
      }

      // Fade in next
      tl.fromTo(texts[i + 1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: EASE.smooth }, position + 0.3);
      tl.fromTo(visuals[i + 1], { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.4, ease: EASE.smooth }, position + 0.3);

      // Activate next dot
      if (dots[i + 1]) {
        tl.set(dots[i + 1], { className: "feature-dot active" }, position + 0.3);
      }
    }
  }, { scope: sectionRef, dependencies: [tier, reducedMotion] });

  // Mobile / minimal fallback: simple grid
  if (tier === "minimal") {
    return (
      <section id="features" className="relative z-10 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]">
              FEATURES
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-3">
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
                className="ocean-card rounded-2xl p-6"
              >
                <span className="font-code text-xs text-[var(--ocean-primary)] tracking-widest">
                  {f.number} — {f.label}
                </span>
                <h3 className="font-heading text-xl font-semibold mt-3 mb-2">
                  {f.title}
                </h3>
                <p className="font-body text-sm text-[var(--ocean-text-secondary)] leading-relaxed">
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
                <span className="font-code text-xs tracking-[0.2em] text-[var(--ocean-primary)] mb-4">
                  {feature.number} — {feature.label}
                </span>
                <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  {feature.title}
                </h3>
                <p className="font-body text-lg text-[var(--ocean-text-secondary)] leading-relaxed mb-6 max-w-lg">
                  {feature.description}
                </p>
                <span className="font-body text-sm font-medium text-[var(--ocean-accent)] cursor-pointer hover:underline">
                  {feature.cta} →
                </span>
              </div>
            ))}
          </div>

          {/* Right: Visual panel — FeatureVisual SVGs, GSAP controls visibility */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-[16/10]">
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  className="feature-visual absolute inset-0 flex items-center justify-center rounded-2xl border border-[var(--ocean-border)]/50 bg-[var(--ocean-bg-light)]/30 overflow-hidden"
                  style={{ opacity: i === 0 ? 1 : 0 }}
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
              className={`feature-dot ${i === 0 ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
