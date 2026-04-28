"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ResultHeader } from "@/components/result/ResultHeader";
import { ConfettiTrigger } from "./ConfettiTrigger";
import { ProductiveBandSection } from "./ProductiveBandSection";
import { QuestionReview } from "./QuestionReview";
import type { AttemptResult } from "../types";

type Props = {
  attemptData: AttemptResult;
  activeSkill: "READING" | "LISTENING" | "WRITING" | "SPEAKING";
  setActiveSkill: (skill: "READING" | "LISTENING" | "WRITING" | "SPEAKING") => void;
  overallBand: number | undefined;
};

export function AttemptResultView({
  attemptData,
  activeSkill,
  setActiveSkill,
  overallBand,
}: Props) {
  const router = useRouter();

  const skillFiltered = attemptData.questions.filter(
    (q) => q.skill === activeSkill
  );

  const answeredCount = skillFiltered.filter(
    (q) => !!q.selectedAnswerText || (q.selectedOptionIds?.length ?? 0) > 0
  ).length;

  const blankCount = skillFiltered.length - answeredCount;

  const accuracy =
    skillFiltered.length > 0
      ? Math.round(
          (attemptData.correctCount / skillFiltered.length) * 100
        )
      : 0;

  const isProductiveSkill =
    activeSkill === "WRITING" || activeSkill === "SPEAKING";

  const writingCriteria = attemptData.writingGrade
    ? [
        {
          code: "TR",
          name: "Task Response",
          score: attemptData.writingGrade.taskResponse?.band,
        },
        {
          code: "CC",
          name: "Coherence",
          score: attemptData.writingGrade.coherenceAndCohesion?.band,
        },
        {
          code: "LR",
          name: "Lexical",
          score: attemptData.writingGrade.lexicalResource?.band,
        },
        {
          code: "GRA",
          name: "Grammar",
          score:
            attemptData.writingGrade.grammaticalRangeAndAccuracy?.band,
        },
      ].filter((c) => c.score !== undefined)
    : [];

  const speakingCriteria = attemptData.speakingGrade
    ? [
        {
          code: "FC",
          name: "Fluency",
          score: attemptData.speakingGrade.fluencyAndCoherence?.band,
        },
        {
          code: "LR",
          name: "Lexical",
          score: attemptData.speakingGrade.lexicalResource?.band,
        },
        {
          code: "GRA",
          name: "Grammar",
          score:
            attemptData.speakingGrade.grammaticalRangeAndAccuracy?.band,
        },
        {
          code: "P",
          name: "Pronunciation",
          score: attemptData.speakingGrade.pronunciation?.band,
        },
      ].filter((c) => c.score !== undefined)
    : [];

  const productiveBand =
    activeSkill === "WRITING"
      ? attemptData.writingBand
      : attemptData.speakingBand;
  const productiveCriteria =
    activeSkill === "WRITING" ? writingCriteria : speakingCriteria;

  const metrics = isProductiveSkill
    ? productiveCriteria.map((c) => ({
        label: c.code,
        value: c.score?.toFixed(1) ?? "--",
      }))
    : [
        {
          label: "Correct",
          value: `${attemptData.correctCount}/${skillFiltered.length}`,
        },
        { label: "Skipped", value: String(blankCount) },
        { label: "Time", value: attemptData.totalTime },
        { label: "Accuracy", value: `${accuracy}%` },
      ];

  // Build band breakdowns for the progress bars
  const bandBreakdowns = isProductiveSkill
    ? productiveCriteria.map((c) => ({
        skill: c.name,
        score: c.score ?? 0,
      }))
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Score Reveal Section */}
        <ConfettiTrigger
          score={
            isProductiveSkill
              ? typeof productiveBand === "number"
                ? productiveBand
                : 0
              : typeof overallBand === "number"
              ? overallBand
              : 0
          }
          targetScore={6}
        />

        <ResultHeader
          skill={activeSkill}
          overallScore={
            isProductiveSkill
              ? typeof productiveBand === "number"
                ? productiveBand
                : "--"
              : typeof overallBand === "number"
              ? overallBand
              : "--"
          }
          date={new Date(attemptData.finishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          metrics={metrics}
          bandBreakdowns={bandBreakdowns}
        />

        {/* Skill Tabs */}
        <motion.div
          className="flex justify-center rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
        >
          {["READING", "LISTENING", "WRITING", "SPEAKING"].map((sk) => (
            <button
              key={sk}
              onClick={() => setActiveSkill(sk as any)}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-150 ${
                activeSkill === sk
                  ? "text-[var(--primary)] border-b-[3px] border-[var(--primary)] bg-[var(--primary-light)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-[3px] border-transparent"
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {sk.charAt(0) + sk.slice(1).toLowerCase()}
            </button>
          ))}
        </motion.div>

        {/* Manual Review Warning */}
        {!isProductiveSkill && attemptData.needsManualReview > 0 && (
          <motion.div
            className="p-4 rounded-[2rem] border-[3px] border-[var(--skill-writing-border)] bg-[var(--skill-writing-light)] text-[var(--skill-writing)] text-sm font-bold shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            {attemptData.needsManualReview} questions need manual review --
            band may change.
          </motion.div>
        )}

        {/* Content Body */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
        >
          {isProductiveSkill ? (
            <ProductiveBandSection
              skill={activeSkill}
              band={productiveBand}
              writingGrade={attemptData.writingGrade}
              speakingGrade={attemptData.speakingGrade}
            />
          ) : (
            <QuestionReview details={skillFiltered} />
          )}

          {!isProductiveSkill && skillFiltered.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
              <span>No data for {activeSkill}</span>
            </div>
          )}
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          className="text-center space-y-4 pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Take New Placement Test
          </button>

          <div className="flex justify-center gap-4">
            <button
              onClick={() =>
                router.push(`/attempts/${attemptData.attemptId}/review`)
              }
              className="text-[var(--text-muted)] font-bold text-sm hover:text-[var(--primary)] transition-colors"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Review All Answers
            </button>
            <span className="text-[var(--border)]">|</span>
            <button
              onClick={() => router.push("/practice")}
              className="text-[var(--text-muted)] font-bold text-sm hover:text-[var(--primary)] transition-colors"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Back to Library
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
