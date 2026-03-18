"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { NAV_LINKS } from "../data";
import { useScrollStore } from "../hooks/useScrollStore";

interface OceanHeaderProps {
  onCTA: () => void;
}

export default function OceanHeader({ onCTA }: OceanHeaderProps) {
  // Read from scroll store — only re-renders when boolean changes (at most 2 times)
  const scrolled = useScrollStore((s) => s.scrollProgress > 0.005);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-[#040B14]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Image
            width={130}
            height={100}
            src="/logo.png"
            alt="Langfens"
            className="mt-3 brightness-0 invert opacity-90"
          />
        </motion.div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <button
              key={item.target}
              onClick={() =>
                document
                  .getElementById(item.target)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-sm font-medium text-[var(--ocean-text-secondary)] hover:text-[var(--ocean-primary)] transition-colors duration-300"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Streak badge */}
        <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[var(--ocean-text-secondary)] text-xs font-bold">
          <span
            className="inline-block w-3 h-4 bg-orange-500"
            style={{ clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)' }}
          />
          <span>12</span>
        </span>

        {/* CTA */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCTA}
          className="bg-[var(--ocean-primary)] text-white font-bold text-sm border-2 border-[var(--ocean-primary-dark)] border-b-[4px] rounded-full px-6 py-2 transition-all duration-[120ms] hover:bg-[var(--ocean-primary-light)] hover:border-[var(--ocean-primary)] hover:-translate-y-0.5 hover:shadow-[0_0_20px_var(--ocean-primary-glow)] active:translate-y-[3px] active:border-b-[2px] cursor-pointer"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Start Free
        </motion.button>
      </div>
    </header>
  );
}
