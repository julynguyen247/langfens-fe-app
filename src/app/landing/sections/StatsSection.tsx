"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STATS } from "../data";
import { SectionHeading } from "../ui/SectionHeading";
import { useCountUp } from "../hooks/useCountUp";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";

import { GlassCard } from "../ui/GlassCard";

function StatCard({
  value,
  suffix,
  label,
  sublabel,
}: {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
}) {
  const { ref, display } = useCountUp(value, { suffix, duration: 2000 });

  return (
    <div ref={ref} className="stat-card h-full" style={{ opacity: 0 }}>
      <GlassCard className="p-8 text-center h-full flex flex-col justify-center">
        <div
          className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-[#2563EB] to-[#06D6A0] bg-clip-text text-transparent mb-3 drop-shadow-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {display}
        </div>
        <h3
          className="text-xl font-semibold mb-2 text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >{label}</h3>
        <p
          className="text-sm text-[var(--ocean-text-muted)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {sublabel}
        </p>
      </GlassCard>
    </div>
  );
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(".stats-heading, .stat-card", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".stats-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: EASE.bounce,
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".stat-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: STAGGER.relaxed,
          ease: EASE.bounce,
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        }
      );
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={sectionRef}
      data-section="stats"
      className="relative z-10 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="stats-heading" style={{ opacity: 0 }}>
          <SectionHeading title="Results That Speak for Themselves" />
        </div>

        {/* Stats grid with count-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {STATS.map((stat, i) => (
            <StatCard
              key={i}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              sublabel={stat.sublabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
