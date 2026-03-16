"use client";

import { motion } from "framer-motion";
import { CTA } from "../data";

interface CTASectionProps {
  onCTA: () => void;
  onConfetti?: () => void;
}

export default function CTASection({ onCTA, onConfetti }: CTASectionProps) {
  const handlePrimaryCTA = () => {
    onConfetti?.();
    onCTA();
  };

  return (
    <section data-section="cta" className="relative z-10 min-h-screen flex items-center py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="ocean-card rounded-3xl p-12 sm:p-16 space-y-6"
        >
          {/* Label */}
          <span className="font-code text-xs tracking-[0.2em] uppercase text-[var(--ocean-primary)]">
            {CTA.label}
          </span>

          {/* Headline */}
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-6xl font-bold text-gradient-ocean text-glow leading-tight">
            {CTA.headline}
          </h2>

          {/* Subtitle */}
          <p className="font-body text-lg text-[var(--ocean-text-secondary)] max-w-2xl mx-auto">
            {CTA.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrimaryCTA}
              className="btn-ocean rounded-xl px-10 py-4 text-lg font-semibold cursor-pointer"
            >
              {CTA.ctaPrimary}
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCTA}
              className="btn-ghost rounded-xl px-10 py-4 text-lg cursor-pointer"
            >
              {CTA.ctaSecondary}
            </motion.button>
          </div>

          {/* Note */}
          <p className="font-code text-sm text-[var(--ocean-text-muted)]">
            {CTA.note}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
