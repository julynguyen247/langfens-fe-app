"use client";

// One per-skill card in the "Skill band breakdown" grid.
// Reads `band` on the IELTS 0–9 scale and pipes it to `SkillProgressBar`
// (which already expects band 0–9). Accuracy is shown as a subline and
// comes from the same percent 0–100 backend (no conversion needed for display).

import { SkillProgressBar } from "@/components/ui/SkillProgressBar";
import { bandDescriptor, formatBand } from "../../history/_lib/utils";

export interface SkillBandCardProps {
  /** Skill name (uppercase enum as returned by backend). */
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  /** Estimated band 0–9. Null if not yet computed. */
  band: number | null;
  /** Accuracy percent 0–100. Null when unknown. */
  accuracy: number | null;
  testCount: number;
}

const SKILL_ACCENT: Record<SkillBandCardProps["skill"], string> = {
  READING: "var(--skill-reading)",
  LISTENING: "var(--skill-listening)",
  WRITING: "var(--skill-writing)",
  SPEAKING: "var(--skill-speaking)",
};

const SKILL_ACCENT_LIGHT: Record<SkillBandCardProps["skill"], string> = {
  READING: "var(--skill-reading-light)",
  LISTENING: "var(--skill-listening-light)",
  WRITING: "var(--skill-writing-light)",
  SPEAKING: "var(--skill-speaking-light)",
};

const SKILL_ACCENT_BORDER: Record<SkillBandCardProps["skill"], string> = {
  READING: "var(--skill-reading-border)",
  LISTENING: "var(--skill-listening-border)",
  WRITING: "var(--skill-writing-border)",
  SPEAKING: "var(--skill-speaking-border)",
};

function displaySkillName(skill: SkillBandCardProps["skill"]): string {
  return skill.charAt(0) + skill.slice(1).toLowerCase();
}

export function SkillBandCard({
  skill,
  band,
  accuracy,
  testCount,
}: SkillBandCardProps) {
  const accent = SKILL_ACCENT[skill];
  const light = SKILL_ACCENT_LIGHT[skill];
  const border = SKILL_ACCENT_BORDER[skill];
  const hasBand = band != null && Number.isFinite(band);
  const displayBand = hasBand ? formatBand(band as number) : "—";
  const descriptor = hasBand ? bandDescriptor(band as number) : "Pending";
  const progressScore = hasBand ? (band as number) : 0;

  return (
    <div
      className="rounded-[2rem] border-[3px] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
      style={{
        backgroundColor: light,
        borderColor: border,
        boxShadow: `0 4px 0 rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.5)`,
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <p
          className="text-sm font-bold"
          style={{ color: accent, fontFamily: "var(--font-heading)" }}
        >
          {displaySkillName(skill)}
        </p>
        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {testCount} {testCount === 1 ? "test" : "tests"}
        </p>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-4xl font-bold"
          style={{ color: accent, fontFamily: "var(--font-code)" }}
        >
          {displayBand}
        </span>
        <span
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {descriptor}
        </span>
      </div>

      <div className="mb-3">
        <SkillProgressBar
          skill={displaySkillName(skill)}
          score={progressScore}
          maxScore={9}
          animate
          colorKey={skill}
        />
      </div>

      {accuracy != null && Number.isFinite(accuracy) && (
        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span
            className="font-bold"
            style={{ color: accent, fontFamily: "var(--font-code)" }}
          >
            {Math.round(accuracy)}%
          </span>{" "}
          accuracy
        </p>
      )}
    </div>
  );
}

export default SkillBandCard;
