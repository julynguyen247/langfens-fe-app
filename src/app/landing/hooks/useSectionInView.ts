"use client";

import { useEffect, useState } from "react";

const SECTION_IDS = [
  "hero",
  "features",
  "how-it-works",
  "stats",
  "testimonials",
  "cta",
  "footer",
];

/**
 * Tracks which section is currently most visible in the viewport.
 * Returns the active section id and its index.
 */
export function useSectionInView() {
  const [activeSection, setActiveSection] = useState("hero");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let maxId = activeSection;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            maxId = entry.target.id || entry.target.getAttribute("data-section") || "";
          }
        });

        if (maxId && maxId !== activeSection) {
          setActiveSection(maxId);
          setActiveIndex(SECTION_IDS.indexOf(maxId));
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.5],
      }
    );

    // Observe all sections
    SECTION_IDS.forEach((id) => {
      const el =
        document.getElementById(id) ||
        document.querySelector(`[data-section="${id}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeSection]);

  return { activeSection, activeIndex, totalSections: SECTION_IDS.length };
}
