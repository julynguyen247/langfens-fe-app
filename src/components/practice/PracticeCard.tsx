"use client";

import { motion } from "framer-motion";
import { SkillBadge } from "@/components/ui/SkillBadge";
import type { PracticeItem } from "@/components/PracticeBank";
import type { SkillId } from "./colors";
import { SkillPatternHero } from "./SkillPatternHero";
import { PracticeMeta } from "./PracticeMeta";

type PracticeCardProps = {
  item: PracticeItem;
  index: number;
  skill: SkillId;
  onStart: (id: string) => void;
  loading?: boolean;
};

function StartSpinner() {
  return (
    <span
      className="w-4 h-4 border-[2px] border-white/40 border-t-white rounded-full animate-spin"
      aria-hidden
    />
  );
}

export function PracticeCard({
  item,
  index,
  skill,
  onStart,
  loading = false,
}: PracticeCardProps) {
  const hasTotal =
    typeof item.totalQuestions === "number" && item.totalQuestions >= 1;

  const subParts: string[] = [];
  if (item.source) subParts.push(item.source);
  if (typeof item.lastScore === "number") {
    subParts.push(
      `Last attempt: ${String(item.lastScore)}`
    );
  }
  if (typeof item.attempts === "number" && item.attempts > 0) {
    subParts.push(`Attempted ${item.attempts} ${item.attempts === 1 ? "time" : "times"}`);
  }

  // Renders a chip only if any meta data is present, so we can decide
  // whether to draw the divider line below.
  const metaNode = (
    <PracticeMeta
      skill={skill}
      durationMin={item.durationMin}
      passages={item.passages}
      sections={item.sections}
      totalQuestions={item.totalQuestions}
    />
  );
  const hasMeta = Boolean(
    (typeof item.durationMin === "number" && item.durationMin >= 1) ||
      (typeof item.passages === "number" && item.passages >= 1) ||
      (typeof item.sections === "number" && item.sections >= 1) ||
      (typeof item.totalQuestions === "number" && item.totalQuestions >= 1)
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: "easeOut" }}
      className="group relative bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150 h-full flex flex-col overflow-hidden"
    >
      {/* Hero block */}
      <div className="relative aspect-[16/10] bg-[var(--background)]">
        <SkillPatternHero skill={skill} imageUrl={item.imageUrl} />

        {/* Skill badge — top-left */}
        <div className="absolute top-3 left-3 z-10">
          <SkillBadge skill={skill} size="sm" />
        </div>

        {/* Total questions chip — top-right, only if real data */}
        {hasTotal && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold bg-black/55 text-white backdrop-blur-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {item.totalQuestions}q
            </span>
          </div>
        )}

        {/* Bottom gradient + title */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 p-4 z-10">
          <h3
            className="font-bold text-white text-base leading-snug line-clamp-2 drop-shadow-sm"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {item.title}
          </h3>
        </div>
      </div>

      {/* Meta strip */}
      {hasMeta && (
        <div
          className="px-4 pt-3 pb-2 border-b-[2px] border-[var(--border-light)]"
        >
          {metaNode}
        </div>
      )}

      {/* Sub-line */}
      {subParts.length > 0 && (
        <div
          className="px-4 pt-2 pb-1 text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {subParts.map((part, i) => {
            if (i > 0) {
              return (
                <span key={`sep-${i}`}>
                  <span className="mx-1.5">·</span>
                  <SubPart part={part} skill={skill} />
                </span>
              );
            }
            return <SubPart key={`p-${i}`} part={part} skill={skill} />;
          })}
        </div>
      )}

      {/* CTA footer */}
      <div className={`px-4 ${subParts.length > 0 ? "pb-4 pt-2" : "pb-4 pt-3"} mt-auto`}>
        <button
          type="button"
          onClick={() => onStart(item.id)}
          disabled={loading}
          className="w-full rounded-full bg-[var(--primary)] text-white font-bold px-5 py-2.5 border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[3px] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {loading ? (
            <StartSpinner />
          ) : (
            <>
              <span>Start practice</span>
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

function SubPart({ part, skill }: { part: string; skill: SkillId }) {
  // If the part is the "Last attempt: X" line, render the number in
  // the skill's accent color via the mono font.
  const match = part.match(/^Last attempt: (.+)$/);
  if (match) {
    return (
      <>
        <span>Last attempt: </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: `var(--skill-${skill})`,
          }}
        >
          {match[1]}
        </span>
      </>
    );
  }
  return <span>{part}</span>;
}
