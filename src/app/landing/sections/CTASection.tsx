"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CTA } from "../data";
import { Button } from "../ui/Button";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE } from "../lib/animation-config";
import { GlassCard } from "../ui/GlassCard";

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
        start: "top 75%",
        end: "bottom bottom",
        scrub: 1, // scrub for immersive scale effect
      };

      // Background immersive scale
      gsap.fromTo(
        ".cta-bg-glow",
        { scale: 0.8, opacity: 0 },
        { scale: 1.2, opacity: 1, ease: "none", scrollTrigger: trigger }
      );

      // Card parallax
      gsap.fromTo(
        ".cta-card-wrapper",
        { y: 50 },
        { y: -50, ease: "none", scrollTrigger: trigger }
      );

      // Normal enter animations
      const enterTrigger = {
        trigger: sectionRef.current,
        start: "top 70%",
      };

      gsap.fromTo(
        ".cta-label",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE.smooth, scrollTrigger: enterTrigger }
      );
      gsap.fromTo(
        ".cta-title",
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.1, ease: EASE.smooth, scrollTrigger: enterTrigger }
      );
      gsap.fromTo(
        ".cta-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: EASE.smooth, scrollTrigger: enterTrigger }
      );
      gsap.fromTo(
        ".cta-buttons",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: EASE.smooth, scrollTrigger: enterTrigger }
      );
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={sectionRef}
      data-section="cta"
      className="relative z-10 min-h-screen flex items-center py-24 lg:py-32"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center w-full relative">
        <div className="cta-bg-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square max-w-[800px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="cta-card-wrapper relative z-10">
          <GlassCard className="p-12 sm:p-16 space-y-6" glowColor="rgba(59, 130, 246, 0.4)">
          {/* Label */}
          <span
            className="cta-label text-sm font-bold text-blue-400"
            style={{ opacity: 0, fontFamily: 'var(--font-heading)' }}
          >
            {CTA.label}
          </span>

          {/* Headline */}
          <h2
            className="cta-title text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-br from-[#2563EB] to-[#06D6A0] bg-clip-text text-transparent leading-tight drop-shadow-sm"
            style={{ opacity: 0, fontFamily: 'var(--font-heading)' }}
          >
            {CTA.headline}
          </h2>

          {/* Subtitle */}
          <p
            className="cta-subtitle text-lg text-white/80 max-w-2xl mx-auto"
            style={{ opacity: 0, fontFamily: 'var(--font-body)' }}
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
          <p
            className="text-sm text-white/50"
            style={{ fontFamily: 'var(--font-code)' }}
          >
            {CTA.note}
          </p>
        </GlassCard>
        </div>
      </div>
    </section>
  );
}
