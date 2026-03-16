"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { NAV_LINKS } from "../data";

interface OceanHeaderProps {
  onCTA: () => void;
}

export default function OceanHeader({ onCTA }: OceanHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
              className="font-body text-sm font-medium text-[var(--ocean-text-secondary)] hover:text-[var(--ocean-primary)] transition-colors duration-300"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCTA}
          className="btn-ocean rounded-xl px-5 py-2 text-sm font-semibold cursor-pointer"
        >
          Start Free
        </motion.button>
      </div>
    </header>
  );
}
