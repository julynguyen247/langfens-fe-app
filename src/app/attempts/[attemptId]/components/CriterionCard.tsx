import { motion } from "framer-motion";
import type { WritingCriterion, SpeakingCriterion } from "../types";

export function CriterionCard({
  title,
  criterion,
}: {
  title: string;
  criterion: WritingCriterion | SpeakingCriterion;
}) {
  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3
          className="text-sm font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {title}
        </h3>
        <span
          className="px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] text-sm font-bold"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Band {criterion.band.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
        {criterion.comment}
      </p>
    </motion.div>
  );
}
