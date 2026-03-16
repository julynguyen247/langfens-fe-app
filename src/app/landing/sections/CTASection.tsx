"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CTA } from "../data";
import { Button } from "../ui/Button";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE } from "../lib/animation-config";

interface CTASectionProps {
  onCTA: () => void;
  onConfetti?: () => void;
}

export default function CTASection({ onCTA, onConfetti }: CTASectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const handlePrimaryCTA = () => {
    onConfetti?.();
    onCTA();
  };

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(".cta-label, .cta-title, .cta-subtitle, .cta-buttons", {
          opacity: 1,
          y: 0,
        });
        return;
      }

      const trigger = {
        trigger: sectionRef.current,
        start: "top 70%",
      };

      gsap.fromTo(
        ".cta-label",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE.smooth, scrollTrigger: trigger }
      );
      gsap.fromTo(
        ".cta-title",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.1, ease: EASE.smooth, scrollTrigger: trigger }
      );
      gsap.fromTo(
        ".cta-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: EASE.smooth, scrollTrigger: trigger }
      );
      gsap.fromTo(
        ".cta-buttons",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: EASE.smooth, scrollTrigger: trigger }
      );
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={sectionRef}
      data-section="cta"
      className="vignette-cta relative z-10 min-h-screen flex items-center py-24 lg:py-32 section-bg"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center w-full">
        <div className="ocean-card rounded-3xl p-12 sm:p-16 space-y-6">
          {/* Label */}
          <span
            className="cta-label font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]"
            style={{ opacity: 0 }}
          >
            {CTA.label}
          </span>

          {/* Headline */}
          <h2
            className="cta-title font-heading text-3xl sm:text-4xl lg:text-6xl font-bold text-gradient-ocean text-glow leading-tight"
            style={{ opacity: 0 }}
          >
            {CTA.headline}
          </h2>

          {/* Subtitle */}
          <p
            className="cta-subtitle font-body text-lg text-[var(--ocean-text-secondary)] max-w-2xl mx-auto"
            style={{ opacity: 0 }}
          >
            {CTA.subtitle}
          </p>

          {/* CTAs */}
          <div
            className="cta-buttons flex flex-wrap items-center justify-center gap-4 pt-4"
            style={{ opacity: 0 }}
          >
            <Button size="large" onClick={handlePrimaryCTA}>
              {CTA.ctaPrimary}
            </Button>
            <Button variant="ghost" size="large" onClick={onCTA}>
              {CTA.ctaSecondary}
            </Button>
          </div>

          {/* Note */}
          <p className="font-code text-sm text-[var(--ocean-text-muted)]">
            {CTA.note}
          </p>
        </div>
      </div>
    </section>
  );
}
