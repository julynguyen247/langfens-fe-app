"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TESTIMONIALS } from "../data";
import { SectionHeading } from "../ui/SectionHeading";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";

const AVATAR_COLORS = ['#2563EB', '#06D6A0', '#8B5CF6'];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(".test-heading, .test-card", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".test-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: EASE.smooth,
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".test-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: STAGGER.relaxed,
          ease: EASE.smooth,
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        }
      );
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative z-10 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="test-heading" style={{ opacity: 0 }}>
          <SectionHeading title="What Students Are Saying" />
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-card" style={{ opacity: 0, animation: `float 6s ease-in-out ${i * 0.5}s infinite` }}>
              <div className="bg-[var(--ocean-bg-light)] border-[3px] border-[rgba(255,255,255,0.07)] rounded-[2rem] shadow-[0_5px_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-150 hover:-translate-y-[3px] hover:scale-[1.01] hover:border-[var(--ocean-border-glow)] hover:shadow-[0_7px_0_rgba(0,0,0,0.35),0_0_25px_var(--ocean-primary-glow)] rounded-3xl p-8 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span
                      key={s}
                      className="text-[var(--ocean-gold)] text-lg"
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <p
                  className="text-base leading-relaxed italic flex-1"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 pt-4 border-t border-[var(--ocean-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: AVATAR_COLORS[i] }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {t.name}
                    </p>
                  </div>
                  <span
                    className="bg-gradient-to-br from-[rgba(37,99,235,0.2)] to-[rgba(6,214,160,0.15)] text-[var(--ocean-primary-light)] rounded-full px-4 py-1.5 text-sm font-bold border-2 border-[rgba(37,99,235,0.3)] shadow-[0_2px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
                    style={{ fontFamily: 'var(--font-code)', letterSpacing: '0.03em' }}
                  >{t.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
