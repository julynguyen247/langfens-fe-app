"use client";

import { SkillBadge } from "@/components/ui/SkillBadge";
import type { SkillId } from "./colors";

type PracticePageHeaderProps = {
  skill: SkillId;
  title: string;
  description: string;
};

// IELTS canonical quick-stats per skill. Other / unknown skills render no
// strip — keeps the page calm when the route is misconfigured.
const SKILL_CANON: Record<SkillId, { label: string }[]> = {
  reading: [
    { label: "60 minutes" },
    { label: "3 passages" },
    { label: "40 questions" },
    { label: "Band 4.0–8.5" },
  ],
  listening: [
    { label: "30 min + 10 transfer" },
    { label: "4 sections" },
    { label: "40 questions" },
    { label: "Band 4.0–8.5" },
  ],
  writing: [
    { label: "60 minutes" },
    { label: "Task 1 + Task 2" },
    { label: "Band 4.0–8.5" },
  ],
  speaking: [
    { label: "11–14 minutes" },
    { label: "3 parts" },
    { label: "Band 4.0–8.5" },
  ],
};

export function PracticePageHeader({ skill, title, description }: PracticePageHeaderProps) {
  const pills = SKILL_CANON[skill] ?? [];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <SkillBadge skill={skill} size="md" />
        <span
          className="text-sm font-semibold text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Practice Board
        </span>
      </div>

      <h1
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h1>
      <p className="text-[var(--text-muted)] text-base">{description}</p>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className="rounded-full px-3 py-1.5 text-xs font-bold border-[2px]"
              style={{
                backgroundColor: `var(--skill-${skill}-light)`,
                color: `var(--skill-${skill})`,
                borderColor: `var(--skill-${skill}-border)`,
                fontFamily: "var(--font-heading)",
              }}
            >
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
