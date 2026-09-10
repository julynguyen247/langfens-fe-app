"use client";

import type { SkillId } from "./colors";

type PracticeMetaProps = {
  skill: SkillId;
  durationMin?: number;
  passages?: number;
  sections?: number;
  totalQuestions?: number;
};

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="5" rx="1.5" />
      <rect x="3" y="10" width="18" height="5" rx="1.5" />
      <rect x="3" y="17" width="18" height="4" rx="1.5" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const chipBase =
  "inline-flex items-center gap-1.5 rounded-full border-[2px] border-[var(--border)] " +
  "bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]";

export function PracticeMeta({
  skill,
  durationMin,
  passages,
  sections,
  totalQuestions,
}: PracticeMetaProps) {
  const hasDuration = typeof durationMin === "number" && durationMin >= 1;
  const hasPassages = typeof passages === "number" && passages >= 1;
  const hasSections = typeof sections === "number" && sections >= 1;
  const hasTotal = typeof totalQuestions === "number" && totalQuestions >= 1;

  if (!hasDuration && !hasPassages && !hasSections && !hasTotal) return null;

  // Reading surfaces "passages"; everything else uses "sections".
  const stackValue = skill === "reading"
    ? (hasPassages ? passages : undefined)
    : (hasSections ? sections : undefined);
  const stackLabel = skill === "reading" ? "passages" : "sections";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasDuration && (
        <span className={chipBase} style={{ fontFamily: "var(--font-heading)" }}>
          <ClockIcon />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {durationMin}
          </span>
          <span>min</span>
        </span>
      )}

      {typeof stackValue === "number" && (
        <span className={chipBase} style={{ fontFamily: "var(--font-heading)" }}>
          <StackIcon />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {stackValue}
          </span>
          <span>{stackLabel}</span>
        </span>
      )}

      {hasTotal && (
        <span className={chipBase} style={{ fontFamily: "var(--font-heading)" }}>
          <QuestionIcon />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {totalQuestions}
          </span>
          <span>q</span>
        </span>
      )}
    </div>
  );
}
