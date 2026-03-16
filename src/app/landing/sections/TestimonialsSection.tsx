"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TESTIMONIALS } from "../data";
import { SectionHeading } from "../ui/SectionHeading";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";

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
      className="relative z-10 py-24 lg:py-32 section-bg"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="test-heading" style={{ opacity: 0 }}>
          <SectionHeading title="What Students Are Saying" />
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-card" style={{ opacity: 0 }}>
              <div className="ocean-card rounded-3xl p-8 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span
                      key={s}
                      className="text-[var(--ocean-gold)] text-sm"
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <p className="font-body text-base leading-relaxed italic flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 pt-4 border-t border-[var(--ocean-border)] flex items-center justify-between">
                  <p className="font-heading text-sm font-semibold">
                    {t.name}
                  </p>
                  <span className="score-badge">{t.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
