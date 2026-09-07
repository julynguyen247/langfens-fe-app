"use client";

// Question-type performance, grouped by skill via pill tabs at the top.
// Each row shows the type label, an animated accuracy bar coloured by tier,
// and the right-aligned accuracy number in mono font.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  formatQuestionType,
  getAccuracyTier,
  type QuestionTypeAccuracy,
} from "../_lib/utils";

export interface QuestionTypeBarsProps {
  items: QuestionTypeAccuracy[];
}

type SkillTabKey = "ALL" | "READING" | "LISTENING" | "WRITING" | "SPEAKING";

const SKILL_TABS: { key: SkillTabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "READING", label: "Reading" },
  { key: "LISTENING", label: "Listening" },
  { key: "WRITING", label: "Writing" },
  { key: "SPEAKING", label: "Speaking" },
];

const TAB_ACTIVE =
  "bg-[var(--primary)] text-white border-[var(--primary)] border-b-[4px]";
const TAB_INACTIVE =
  "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)]";

const TIER_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "var(--skill-speaking)",
  mid: "var(--accent-gold)",
  low: "var(--destructive)",
};

export function QuestionTypeBars({ items }: QuestionTypeBarsProps) {
  const [tab, setTab] = useState<SkillTabKey>("ALL");

  const filtered = useMemo(() => {
    const base = tab === "ALL" ? items : items.filter((it) => matchesTab(it.type, tab));
    return [...base].sort((a, b) => b.accuracy - a.accuracy);
  }, [items, tab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SKILL_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-full border-[2px] text-xs font-bold transition-all ${active ? TAB_ACTIVE : TAB_INACTIVE}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] py-8 text-center">
          No question-type data for this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
          {filtered.map((item, idx) => {
            const pct = Math.max(0, Math.min(100, Math.round(item.accuracy)));
            const tier = getAccuracyTier(pct);
            const color = TIER_COLOR[tier];
            return (
              <div key={item.type} className="flex items-center gap-3">
                <span
                  className="w-44 text-sm text-[var(--text-body)] flex-shrink-0 truncate"
                  style={{ fontFamily: "var(--font-heading)" }}
                  title={formatQuestionType(item.type)}
                >
                  {formatQuestionType(item.type)}
                </span>
                <div
                  className="flex-1 h-6 bg-[var(--background)] rounded-full overflow-hidden border-[1px] border-[var(--border)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: Math.min(idx * 0.04, 0.4),
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span
                  className="w-12 text-sm font-bold text-right flex-shrink-0"
                  style={{ fontFamily: "var(--font-code)", color }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Heuristic: question-type enums don't always carry a skill prefix. We map the
 * known READING question-types to "READING", the LISTENING set to "LISTENING",
 * everything else to the "ALL" bucket. This matches what the legacy analytics
 * page did implicitly (no skill grouping was attempted there).
 */
function matchesTab(type: string, tab: SkillTabKey): boolean {
  if (tab === "ALL") return true;
  const upper = type.toUpperCase();
  const listeningTypes = new Set([
    "MCQ_SINGLE_LISTENING",
    "MCQ_MULTIPLE_LISTENING",
    "FORM_COMPLETION",
    "NOTE_COMPLETION",
    "TABLE_COMPLETION_LISTENING",
    "FLOW_CHART_COMPLETION",
    "SENTENCE_COMPLETION_LISTENING",
    "SHORT_ANSWER_LISTENING",
    "MAP_LABEL_LISTENING",
    "DIAGRAM_LABEL_LISTENING",
  ]);
  const readingTypes = new Set([
    "MCQ_SINGLE",
    "MCQ_MULTIPLE",
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "NOT_GIVEN",
    "MATCHING_HEADING",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDING",
    "SUMMARY_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART",
    "DIAGRAM_LABEL",
    "MAP_LABEL",
    "SENTENCE_COMPLETION",
    "SHORT_ANSWER",
  ]);
  if (tab === "LISTENING") return listeningTypes.has(upper) || upper.includes("LISTENING");
  if (tab === "READING") return readingTypes.has(upper) || upper.includes("READING");
  if (tab === "WRITING") return upper.includes("WRITING");
  if (tab === "SPEAKING") return upper.includes("SPEAKING");
  return true;
}

export default QuestionTypeBars;
