"use client";

import { useState } from "react";
import type { SkillId } from "./colors";

type SkillPatternHeroProps = {
  skill: SkillId;
  imageUrl?: string;
};

// A subtle CSS-only decorative pattern per skill, layered over a base color.
// When imageUrl is provided it renders above the pattern at full opacity;
// on error the image hides and the base + pattern remain visible.
export function SkillPatternHero({ skill, imageUrl }: SkillPatternHeroProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imgFailed;

  const baseStyle: React.CSSProperties = {
    backgroundColor: `var(--skill-${skill}-light)`,
  };

  // Per-skill pattern: same skill color at low opacity. We cannot use
  // pseudo-elements inline, so we render an absolute-filled div with the
  // gradient as its background.
  let patternStyle: React.CSSProperties = {};
  switch (skill) {
    case "reading":
      // Faint horizontal lines — text rows on a page
      patternStyle = {
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 14px,
          var(--skill-reading) 14px,
          var(--skill-reading) 15px
        )`,
        opacity: 0.07,
      };
      break;
    case "listening":
      // Faint waveform — alternating thicker/thinner bars
      patternStyle = {
        backgroundImage: `repeating-linear-gradient(
          to right,
          transparent 0,
          transparent 6px,
          var(--skill-listening) 6px,
          var(--skill-listening) 7px,
          transparent 7px,
          transparent 14px,
          var(--skill-listening) 14px,
          var(--skill-listening) 16px
        )`,
        opacity: 0.09,
      };
      break;
    case "writing":
      // Ruled-paper horizontal lines
      patternStyle = {
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 22px,
          var(--skill-writing) 22px,
          var(--skill-writing) 23px
        )`,
        opacity: 0.08,
      };
      break;
    case "speaking":
      // Dotted grid — small circular-feeling spacing via two-stop gradient
      patternStyle = {
        backgroundImage: `radial-gradient(var(--skill-speaking) 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
        opacity: 0.14,
      };
      break;
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={baseStyle}>
      {/* Pattern layer — always visible */}
      <div className="absolute inset-0 pointer-events-none" style={patternStyle} />

      {/* Image layer — when present, covers the pattern at full opacity */}
      {showImage && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
      )}
    </div>
  );
}
