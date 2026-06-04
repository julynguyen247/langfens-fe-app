"use client";

import { forwardRef, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { HERO } from "../data";
import { Button } from "../ui/Button";
import { ScrollIndicator } from "../ui/ScrollIndicator";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";
import { GlassCard } from "../ui/GlassCard";

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
    const magneticRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Magnetic button effect
    useGSAP(() => {
      if (reducedMotion) return;
      const magnets = magneticRefs.current.filter(Boolean) as HTMLDivElement[];
      
      const handlers = magnets.map((magnet) => {
        const onMouseMove = (e: MouseEvent) => {
          const rect = magnet.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(magnet, { x: x * 0.2, y: y * 0.2, duration: 0.4, ease: "power2.out" });
        };
        const onMouseLeave = () => {
          gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
        };
        magnet.addEventListener("mousemove", onMouseMove);
        magnet.addEventListener("mouseleave", onMouseLeave);
        return { magnet, onMouseMove, onMouseLeave };
      });

      return () => {
        handlers.forEach(({ magnet, onMouseMove, onMouseLeave }) => {
          magnet.removeEventListener("mousemove", onMouseMove);
          magnet.removeEventListener("mouseleave", onMouseLeave);
        });
      };
    }, { dependencies: [reducedMotion] });

    // GSAP entrance stagger + scroll parallax
    useGSAP(() => {
      if (reducedMotion) {
        // Show everything immediately
        gsap.set(".hero-el, .hero-word, .hero-accent", { opacity: 1, y: 0 });
        return;
      }

      // Pre-headline and subtitle
      gsap.fromTo(
        ".hero-el",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: EASE.smooth, stagger: STAGGER.relaxed, delay: 1.5 }
      );

      // Staggered text reveal for headline
      gsap.to(".hero-word", {
        y: "0%",
        opacity: 1,
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
        delay: 1.6,
      });

      gsap.to(".hero-accent", {
        y: "0%",
        opacity: 1,
        duration: 1,
        ease: "power4.out",
        delay: 2.0,
      });

      // Entrance for floating cards
      gsap.fromTo(
        ".floating-card",
        { opacity: 0, scale: 0.8, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "back.out(1.2)", stagger: 0.2, delay: 2.0 }
      );

      // Scroll parallax — fade out + drift up as user scrolls past
      gsap.to(".hero-content", {
        opacity: 0,
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1, // Add slight scrub smoothing
        },
      });

      // Different scroll speeds for floating cards
      gsap.to(".parallax-fast", {
        y: -250,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        }
      });
      gsap.to(".parallax-slow", {
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        }
      });
    }, { scope: sectionRef, dependencies: [reducedMotion] });

    const headlineWords = HERO.headline.split(" ");

    return (
      <section
        ref={mergedRef}
        data-section="hero"
        className="relative z-10 min-h-screen flex items-center pt-16"
      >
        <div className="hero-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left: Text content */}
          <div className="space-y-6">
            {/* Pre-headline */}
            <span
              className="hero-el text-sm tracking-wide font-bold text-[var(--ocean-primary)] block"
              style={{ opacity: 0, fontFamily: 'var(--font-heading)' }}
            >
              {HERO.preHeadline}
            </span>

            {/* Main headline with text reveal */}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <span className="flex flex-wrap gap-[0.25em] mb-2">
                {headlineWords.map((word, i) => (
                  <span key={i} className="overflow-hidden inline-block pb-2">
                    <span 
                      className="hero-word inline-block" 
                      style={{ transform: "translateY(100%)", opacity: 0 }}
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </span>
              <span className="overflow-hidden inline-block pb-2">
                <span
                  className="hero-accent inline-block bg-gradient-to-br from-[#2563EB] to-[#06D6A0] bg-clip-text text-transparent"
                  style={{ transform: "translateY(100%)", opacity: 0, textShadow: 'none' }}
                >
                  {HERO.headlineAccent}
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="hero-el text-lg sm:text-xl text-[var(--ocean-text-secondary)] max-w-xl leading-relaxed"
              style={{ opacity: 0, fontFamily: 'var(--font-body)' }}
            >
              {HERO.subtitle}
            </p>

            {/* Social proof badge */}
            <div className="hero-el" style={{ opacity: 0 }}>
              <span
                className="text-sm font-bold text-[var(--ocean-primary-light)] bg-[var(--ocean-primary)]/10 px-5 py-2 rounded-full border-2 border-[var(--ocean-primary)]/25 inline-block"
                style={{ fontFamily: 'var(--font-code)' }}
              >
                {HERO.socialProof}
              </span>
            </div>

            {/* CTA buttons with magnetic effect */}
            <div className="hero-el flex flex-wrap gap-4 pt-2" style={{ opacity: 0 }}>
              <div ref={(el) => { magneticRefs.current[0] = el; }} className="inline-block">
                <Button onClick={onCTA}>
                  {HERO.ctaPrimary}
                </Button>
              </div>
              <div ref={(el) => { magneticRefs.current[1] = el; }} className="inline-block">
                <Button variant="ghost" onClick={onCTA}>
                  {HERO.ctaSecondary}
                </Button>
              </div>
            </div>

            {/* Free note */}
            <p
              className="hero-el text-sm text-[var(--ocean-text-muted)]"
              style={{ opacity: 0, fontFamily: 'var(--font-body)' }}
            >
              {HERO.ctaNote}
            </p>
          </div>

          {/* Right: 3D penguin viewport & Floating Elements */}
          <div
            className="hidden lg:flex items-center justify-center min-h-[500px] relative w-full"
            style={{ perspective: "1000px" }}
          >
            {/* Ambient glow circle — penguin renders behind via R3F fixed canvas */}
            <div className="hero-el relative w-80 h-80 z-10" style={{ opacity: 0 }}>
              <div
                className="absolute inset-0 rounded-full bg-[var(--ocean-primary)]/10 scale-150"
                style={{
                  boxShadow: '0 0 120px rgba(59, 130, 246, 0.3)',
                  animation: 'oceanAmbientGlow 4s ease-in-out infinite',
                }}
              />
            </div>

            {/* Floating Glass Cards */}
            <div className="absolute top-10 -left-10 z-20 floating-card parallax-fast" style={{ opacity: 0 }}>
              <GlassCard className="p-4 w-48 rotate-[-5deg]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <span className="material-symbols-rounded">psychology</span>
                  </div>
                  <div>
                    <div className="text-xs text-white/50">AI Powered</div>
                    <div className="text-sm font-semibold text-white">Smart Feedback</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="absolute bottom-20 -right-10 z-20 floating-card parallax-slow" style={{ opacity: 0 }}>
              <GlassCard className="p-4 w-52 rotate-[3deg]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-rounded">trending_up</span>
                  </div>
                  <div>
                    <div className="text-xs text-white/50">Your Progress</div>
                    <div className="text-sm font-semibold text-white">+24% this week</div>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            <div className="absolute -top-10 right-10 z-0 floating-card parallax-slow" style={{ opacity: 0 }}>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"></div>
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
