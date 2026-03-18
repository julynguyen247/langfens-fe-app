"use client";

import Image from "next/image";
import { FOOTER } from "../data";

export default function FooterSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 border-t border-[var(--ocean-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Image
              width={100}
              height={32}
              src="/logo.png"
              alt="Langfens"
              className="brightness-0 invert opacity-80"
            />
            <p className="text-sm text-[var(--ocean-text-muted)]" style={{ fontFamily: 'var(--font-body)' }}>
              {FOOTER.tagline}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            {FOOTER.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[var(--ocean-text-muted)] hover:text-[var(--ocean-primary)] transition-colors duration-300"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[var(--ocean-surface)] border border-[var(--ocean-border)] flex items-center justify-center text-[var(--ocean-text-secondary)] hover:bg-[var(--ocean-primary)] hover:text-white hover:border-[var(--ocean-primary)] transition-all duration-300 cursor-pointer"
            aria-label="Back to top"
          >
            ↑
          </button>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-[var(--ocean-border)] text-center">
          <p className="text-sm text-[var(--ocean-text-muted)]" style={{ fontFamily: 'var(--font-body)' }}>
            {FOOTER.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
