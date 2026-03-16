"use client";

import { forwardRef, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO } from "../data";
import { Button } from "../ui/Button";
import { ScrollIndicator } from "../ui/ScrollIndicator";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onCTA: () => void;
}

const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  ({ onCTA }, forwardedRef) => {
    const sectionRef = useRef<HTMLElement>(null);

    // Merge forwarded ref with internal ref
    const mergedRef = useCallback(
      (node: HTMLElement | null) => {
        (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [forwardedRef],
    );

    const reducedMotion = useReducedMotion();

    // GSAP entrance stagger + scroll parallax
    useGSAP(() => {
      if (reducedMotion) {
        // Show everything immediately
        gsap.set(".hero-el", { opacity: 1, y: 0 });
        return;
      }

      // Entrance stagger for hero elements
      gsap.fromTo(
        ".hero-el",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE.smooth, stagger: STAGGER.relaxed, delay: 2.2 }
      );

      // Scroll parallax — fade out + drift up as user scrolls past
      gsap.to(".hero-content", {
        opacity: 0,
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, { scope: sectionRef, dependencies: [reducedMotion] });

    return (
      <section
        ref={mergedRef}
        data-section="hero"
        className="relative z-10 min-h-screen flex items-center pt-16 vignette-hero"
      >
        <div className="hero-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left: Text content */}
          <div className="space-y-6">
            {/* Pre-headline */}
            <span
              className="hero-el font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)] block"
              style={{ opacity: 0 }}
            >
              {HERO.preHeadline}
            </span>

            {/* Main headline */}
            <h1
              className="hero-el font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
              data-parallax-depth="0.5"
              style={{ opacity: 0 }}
            >
              {HERO.headline}
              <br />
              <span className="text-gradient-ocean text-glow">
                {HERO.headlineAccent}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="hero-el font-body text-lg sm:text-xl text-[var(--ocean-text-secondary)] max-w-xl leading-relaxed"
              style={{ opacity: 0 }}
            >
              {HERO.subtitle}
            </p>

            {/* Social proof badge */}
            <div className="hero-el" style={{ opacity: 0 }}>
              <span className="font-code text-sm font-bold text-[var(--ocean-primary-light)] bg-[rgba(37,99,235,0.12)] px-5 py-2 rounded-full border-2 border-[rgba(37,99,235,0.25)]">
                {HERO.socialProof}
              </span>
            </div>

            {/* CTA buttons */}
            <div className="hero-el flex flex-wrap gap-4 pt-2" style={{ opacity: 0 }}>
              <Button onClick={onCTA}>
                {HERO.ctaPrimary}
              </Button>
              <Button variant="ghost" onClick={onCTA}>
                {HERO.ctaSecondary}
              </Button>
            </div>

            {/* Free note */}
            <p
              className="hero-el font-code text-sm text-[var(--ocean-text-muted)]"
              style={{ opacity: 0 }}
            >
              {HERO.ctaNote}
            </p>
          </div>

          {/* Right: 3D penguin viewport (transparent area for R3F canvas to show through) */}
          <div
            className="hero-el hidden lg:flex items-center justify-center min-h-[500px]"
            data-parallax-depth="1.5"
            style={{ opacity: 0 }}
          >
            {/* Ambient glow circle — penguin renders behind via R3F fixed canvas */}
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-[var(--ocean-primary)]/5 scale-150 ocean-ambient-glow" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hero-el" style={{ opacity: 0 }}>
          <ScrollIndicator />
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
