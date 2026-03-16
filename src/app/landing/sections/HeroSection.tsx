"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { HERO } from "../data";

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.12 },
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
} as const;

interface HeroSectionProps {
  onCTA: () => void;
}

const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  ({ onCTA }, ref) => {
    return (
      <section
        ref={ref}
        data-section="hero"
        className="relative z-10 min-h-screen flex items-center pt-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left: Text content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Pre-headline */}
            <motion.span
              variants={fadeUp}
              className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]"
            >
              {HERO.preHeadline}
            </motion.span>

            {/* Main headline */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
              data-parallax-depth="0.5"
            >
              {HERO.headline}
              <br />
              <span className="text-gradient-ocean text-glow">
                {HERO.headlineAccent}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="font-body text-lg sm:text-xl text-[var(--ocean-text-secondary)] max-w-xl leading-relaxed"
            >
              {HERO.subtitle}
            </motion.p>

            {/* Social proof badge */}
            <motion.div variants={fadeUp}>
              <span className="font-code text-sm text-[var(--ocean-primary)] bg-[rgba(14,165,233,0.08)] px-4 py-1.5 rounded-full border border-[rgba(14,165,233,0.15)]">
                {HERO.socialProof}
              </span>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCTA}
                className="btn-ocean rounded-xl px-8 py-3.5 text-base font-semibold cursor-pointer"
              >
                {HERO.ctaPrimary}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCTA}
                className="btn-ghost rounded-xl px-8 py-3.5 text-base cursor-pointer"
              >
                {HERO.ctaSecondary}
              </motion.button>
            </motion.div>

            {/* Free note */}
            <motion.p
              variants={fadeUp}
              className="font-code text-sm text-[var(--ocean-text-muted)]"
            >
              {HERO.ctaNote}
            </motion.p>
          </motion.div>

          {/* Right: 3D penguin viewport (transparent area for R3F canvas to show through) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            className="hidden lg:flex items-center justify-center min-h-[500px]"
            data-parallax-depth="1.5"
          >
            {/* Ambient glow circle — penguin renders behind via R3F fixed canvas */}
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-[var(--ocean-primary)]/5 scale-150 ocean-ambient-glow" />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-code text-xs text-[var(--ocean-text-muted)] uppercase tracking-widest">
              Scroll to dive deeper
            </span>
            <div className="w-px h-8 bg-gradient-to-b from-[var(--ocean-primary)] to-transparent" />
          </motion.div>
        </motion.div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
