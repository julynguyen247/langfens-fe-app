"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { STEPS } from "../data";
import { SectionHeading } from "../ui/SectionHeading";
import StepCard from "../ui/StepCard";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { EASE, STAGGER } from "../lib/animation-config";

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(".hiw-heading, .hiw-card", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".hiw-heading",
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
        ".hiw-card",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: STAGGER.wide,
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
      id="how-it-works"
      className="relative z-10 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="hiw-heading" style={{ opacity: 0 }}>
          <SectionHeading
            label="HOW IT WORKS"
            title="3 Simple Steps to Start"
            subtitle="No complicated setup. Sign up and start practicing immediately."
          />
        </div>

        {/* Steps with connecting line */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* SVG connecting line (desktop) */}
          <svg
            className="absolute top-1/2 left-0 w-full h-0.5 hidden md:block pointer-events-none -translate-y-1/2"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="17%"
              y1="50%"
              x2="83%"
              y2="50%"
              stroke="var(--ocean-primary)"
              strokeWidth="1"
              strokeDasharray="8 6"
              strokeOpacity="0.25"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
          </svg>

          {STEPS.map((step, i) => {
            const accentColors = ["#2563EB", "#06D6A0", "#8B5CF6"];
            return (
              <div key={i} className="hiw-card" style={{ opacity: 0 }}>
                <StepCard step={step} accentColor={accentColors[i]} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
