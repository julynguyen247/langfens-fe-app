"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { NAV_LINKS } from "../data";
import { useScrollStore } from "../hooks/useScrollStore";

interface OceanHeaderProps {
  onCTA: () => void;
}

export default function OceanHeader({ onCTA }: OceanHeaderProps) {
  // Read from scroll store — only re-renders when boolean changes (at most 2 times)
  const scrolled = useScrollStore((s) => s.scrollProgress > 0.005);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      const items = navRef.current?.querySelectorAll<HTMLButtonElement>('[data-nav-item]');
      if (!items) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = items[idx + 1] || items[0];
        next?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = items[idx - 1] || items[items.length - 1];
        prev?.focus();
      } else if (e.key === "Escape") {
        closeMobile();
      }
    },
    [closeMobile]
  );

  const scrollTo = useCallback((target: string) => {
    closeMobile();
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  }, [closeMobile]);

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[var(--ocean-primary)] focus:text-white focus:rounded-full focus:font-bold focus:text-sm"
      >
        Skip to content
      </a>

    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-[var(--ocean-bg)]/80 backdrop-blur-xl border-b border-white/5"
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

        {/* Desktop Nav links */}
        <nav
          ref={navRef}
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-8"
        >
          {NAV_LINKS.map((item, idx) => (
            <button
              key={item.target}
              data-nav-item
              tabIndex={0}
              onClick={() => scrollTo(item.target)}
              onKeyDown={(e) => handleNavKeyDown(e, idx)}
              className="text-sm font-medium text-[var(--ocean-text-secondary)] hover:text-[var(--ocean-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ocean-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ocean-bg)] rounded transition-colors duration-300 cursor-pointer"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={toggleMobile}
          className="flex md:hidden p-2 rounded text-[var(--ocean-text-secondary)] hover:text-[var(--ocean-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ocean-primary)] cursor-pointer"
        >
          {mobileOpen ? (
            <span className="text-xl font-bold" aria-hidden="true">✕</span>
          ) : (
            <span className="text-xl font-bold" aria-hidden="true">☰</span>
          )}
        </button>

        {/* Desktop streak badge + CTA */}
        <div className="hidden md:flex items-center gap-4">
          {/* Streak badge */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[var(--ocean-text-secondary)] text-xs font-bold">
            <span
              className="inline-block w-3 h-4"
              style={{ background: 'var(--ocean-gold)', clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)' }}
            />
            <span>12</span>
          </span>

          {/* CTA */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCTA}
            className="bg-[var(--ocean-primary)] text-white font-bold text-sm border-2 border-[var(--ocean-primary-dark)] border-b-[4px] rounded-full px-6 py-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Start Free
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 pb-4 flex flex-col gap-2">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {NAV_LINKS.map((item, idx) => (
              <button
                key={item.target}
                data-nav-item
                tabIndex={mobileOpen ? 0 : -1}
                onClick={() => scrollTo(item.target)}
                onKeyDown={(e) => handleNavKeyDown(e, idx)}
                className="text-left text-sm font-medium text-[var(--ocean-text-secondary)] hover:text-[var(--ocean-primary)] py-2 px-3 rounded hover:bg-[rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ocean-primary)] transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile streak badge */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[var(--ocean-text-secondary)] text-xs font-bold">
              <span
                className="inline-block w-3 h-4"
                style={{ background: 'var(--ocean-gold)', clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)' }}
              />
              <span>12</span>
            </span>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => { closeMobile(); onCTA(); }}
            className="bg-[var(--ocean-primary)] text-white font-bold text-sm border-2 border-[var(--ocean-primary-dark)] border-b-[4px] rounded-full px-6 py-3 cursor-pointer w-full"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Start Free
          </button>
        </div>
      </div>
    </header>
    </>
  );
}
