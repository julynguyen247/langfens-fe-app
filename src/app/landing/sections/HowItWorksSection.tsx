"use client";

import { motion } from "framer-motion";
import { STEPS } from "../data";

const sectionReveal = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
} as const;

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <span className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)] block mb-4">
            HOW IT WORKS
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
            3 Simple Steps to Start
          </h2>
          <p className="mt-4 font-body text-lg text-[var(--ocean-text-secondary)] max-w-2xl mx-auto">
            No complicated setup. Sign up and start practicing immediately.
          </p>
        </motion.div>

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

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              variants={cardReveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="ocean-card rounded-2xl p-8 text-center h-full relative overflow-hidden">
                {/* Large watermark number */}
                <span className="absolute -top-4 -right-2 font-heading text-[120px] font-bold text-[var(--ocean-primary)] opacity-[0.04] leading-none select-none">
                  {step.number}
                </span>

                <span className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)] block mb-4 relative z-10">
                  Step {step.number}
                </span>
                <h3 className="font-heading text-xl font-semibold mb-3 relative z-10">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-[var(--ocean-text-secondary)] leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
