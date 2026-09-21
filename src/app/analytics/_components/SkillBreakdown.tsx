"use client";

import { SkillBandCard } from "./SkillBandCard";
import { type AnalyticsSummary } from "../_lib/utils";

import { CARD_CLASS } from "../_lib/presentation";

// ---------------------------------------------------------------------------
// 4. Skill band breakdown.
// ---------------------------------------------------------------------------

export function SkillBreakdown({ summary }: { summary: AnalyticsSummary }) {
  const skillScores = summary.skillScores ?? {};
  const testsBySkill = summary.testsBySkill ?? {};

  const skills: SkillBandCardSkill[] = [
    {
      skill: "READING",
      band: numberOrNull(skillScores["reading"]) ?? numberOrNull(skillScores["Reading"]),
      accuracy: skillBandAccuracy(skillScores, "reading"),
      testCount: numberOrNull(testsBySkill["reading"]) ?? numberOrNull(testsBySkill["Reading"]) ?? 0,
    },
    {
      skill: "LISTENING",
      band:
        numberOrNull(skillScores["listening"]) ??
        numberOrNull(skillScores["Listening"]),
      accuracy: skillBandAccuracy(skillScores, "listening"),
      testCount:
        numberOrNull(testsBySkill["listening"]) ??
        numberOrNull(testsBySkill["Listening"]) ??
        0,
    },
    {
      skill: "WRITING",
      band:
        numberOrNull(skillScores["writing"]) ?? numberOrNull(skillScores["Writing"]),
      accuracy: skillBandAccuracy(skillScores, "writing"),
      testCount:
        numberOrNull(testsBySkill["writing"]) ??
        numberOrNull(testsBySkill["Writing"]) ??
        0,
    },
    {
      skill: "SPEAKING",
      band:
        numberOrNull(skillScores["speaking"]) ??
        numberOrNull(skillScores["Speaking"]),
      accuracy: skillBandAccuracy(skillScores, "speaking"),
      testCount:
        numberOrNull(testsBySkill["speaking"]) ??
        numberOrNull(testsBySkill["Speaking"]) ??
        0,
    },
  ];

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Skill band breakdown
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your estimated IELTS band per skill.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {skills.map((s) => (
          <SkillBandCard
            key={s.skill}
            skill={s.skill}
            band={s.band}
            accuracy={s.accuracy}
            testCount={s.testCount}
          />
        ))}
      </div>
    </section>
  );
}

interface SkillBandCardSkill {
  skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  band: number | null;
  accuracy: number | null;
  testCount: number;
}

function numberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Pull an accuracy figure for a given skill. The backend sometimes returns
 * per-skill accuracy nested under `skillScores.<skill>.accuracy`, sometimes as
 * a flat band, and sometimes not at all — fall back to "—" gracefully.
 */
function skillBandAccuracy(
  skillScores: Record<string, number>,
  key: string,
): number | null {
  const direct = (skillScores as Record<string, unknown>)[key];
  if (direct && typeof direct === "object") {
    const acc = (direct as Record<string, unknown>)["accuracy"];
    if (typeof acc === "number" && Number.isFinite(acc)) return acc;
  }
  return null;
}
