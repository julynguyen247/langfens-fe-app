"use client";

import { useSectionInView } from "../hooks/useSectionInView";

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "stats", label: "Stats" },
  { id: "testimonials", label: "Reviews" },
  { id: "cta", label: "CTA" },
  { id: "footer", label: "Footer" },
];

/**
 * Fixed dots on the right side of the viewport.
 * Active dot highlights the current section.
 * Click to scroll to section.
 */
export default function SectionDots() {
  const { activeIndex } = useSectionInView();

  const scrollTo = (id: string) => {
    const el =
      document.getElementById(id) ||
      document.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
      {SECTIONS.map((section, i) => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className="group relative flex items-center justify-end cursor-pointer"
          aria-label={`Scroll to ${section.label}`}
        >
          {/* Tooltip on hover */}
          <span className="absolute right-6 px-2 py-0.5 text-xs font-code text-[var(--ocean-text-secondary)] bg-[var(--ocean-surface)] border border-[var(--ocean-border)] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {section.label}
          </span>

          {/* Dot */}
          <div
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 10 : 6,
              height: i === activeIndex ? 10 : 6,
              background:
                i === activeIndex
                  ? "var(--ocean-primary)"
                  : "var(--ocean-text-muted)",
              opacity: i === activeIndex ? 1 : 0.3,
              boxShadow:
                i === activeIndex
                  ? "0 0 8px rgba(14, 165, 233, 0.4)"
                  : "none",
            }}
          />
        </button>
      ))}
    </div>
  );
}
