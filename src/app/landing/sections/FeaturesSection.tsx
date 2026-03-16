"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FEATURES } from "../data";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";

const sectionReveal = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
} as const;

export default function FeaturesSection() {
  const { tier } = useDeviceCapability();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // GSAP ScrollTrigger pin — added in Phase 4
  // For now, on desktop we still render the pinned layout structure
  // On mobile/minimal, render as a grid
  useEffect(() => {
    if (tier === "minimal" || typeof window === "undefined") return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current!,
        start: "top top",
        end: "bottom bottom",
        pin: pinRef.current!,
        scrub: 0.5,
        onUpdate: (self) => {
          const idx = Math.min(5, Math.floor(self.progress * 6));
          setActiveIndex(idx);
        },
      });

      cleanup = () => trigger.kill();
    })();

    return () => cleanup?.();
  }, [tier]);

  // Mobile / minimal fallback: simple grid
  if (tier === "minimal") {
    return (
      <section id="features" className="relative z-10 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12"
          >
            <span className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]">
              FEATURES
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mt-3">
              Everything You Need to Succeed
            </h2>
          </motion.div>
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

  // Desktop: scroll-locked pinned section
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
          {/* Left: Text panel */}
          <div className="relative min-h-[400px]">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="absolute inset-0 flex flex-col justify-center transition-all duration-500"
                style={{
                  opacity: activeIndex === i ? 1 : 0,
                  transform: `translateY(${activeIndex === i ? 0 : 20}px)`,
                  pointerEvents: activeIndex === i ? "auto" : "none",
                }}
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

          {/* Right: Visual area (penguin environment / abstract shapes) */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Abstract visual placeholder per feature */}
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center transition-all duration-700"
                  style={{
                    opacity: activeIndex === i ? 1 : 0,
                    transform: `scale(${activeIndex === i ? 1 : 0.9})`,
                  }}
                >
                  <div
                    className="w-64 h-64 rounded-3xl border border-[var(--ocean-border)] ocean-ambient-glow"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(14, 165, 233, ${0.05 + i * 0.02}), rgba(6, 214, 160, ${0.03 + i * 0.01}), transparent)`,
                    }}
                  />
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
              className={`feature-dot ${activeIndex === i ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
