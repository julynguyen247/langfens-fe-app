"use client";

import { motion } from "framer-motion";
import { MistakeReview } from "./MistakeReview";
import { StrengthsFocus } from "./StrengthsFocus";
import { type StrengthsWeaknesses, type WrongAnswer } from "../_lib/utils";

import { CARD_CLASS } from "../_lib/presentation";

// ---------------------------------------------------------------------------
// 7. Bottom two-column row: strengths/focus + mistake review.
// ---------------------------------------------------------------------------

export function BottomRow({
  strengths,
  wrongAnswers,
}: {
  strengths: StrengthsWeaknesses;
  wrongAnswers: { items: WrongAnswer[]; total: number };
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className={CARD_CLASS}
      >
        <StrengthsFocus
          strengths={strengths.strengths}
          weaknesses={strengths.weaknesses}
        />
      </motion.section>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
        className={CARD_CLASS}
      >
        <MistakeReview
          errors={wrongAnswers.items}
          total={wrongAnswers.total}
          max={5}
        />
      </motion.section>
    </div>
  );
}
