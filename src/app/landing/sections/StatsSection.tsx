"use client";

import { motion } from "framer-motion";
import { STATS } from "../data";
import { useCountUp } from "../hooks/useCountUp";

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

function StatCard({
  value,
  suffix,
  label,
  sublabel,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  delay: number;
}) {
  const { ref, display } = useCountUp(value, { suffix, duration: 2000 });

  return (
    <motion.div
      variants={cardReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
    >
      <div ref={ref} className="ocean-card rounded-2xl p-8 text-center h-full">
        <div className="font-heading text-5xl sm:text-6xl font-bold text-gradient-ocean mb-3">
          {display}
        </div>
        <h3 className="font-heading text-lg font-semibold mb-2">{label}</h3>
        <p className="font-body text-sm text-[var(--ocean-text-muted)]">
          {sublabel}
        </p>
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section data-section="stats" className="relative z-10 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">
            Results That Speak for Themselves
          </h2>
        </motion.div>

        {/* Stats grid with count-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {STATS.map((stat, i) => (
            <StatCard
              key={i}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              sublabel={stat.sublabel}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
