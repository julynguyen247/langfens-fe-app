"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreCounter } from "@/components/ui/ScoreCounter";
import { SkillProgressBar } from "@/components/ui/SkillProgressBar";
import { ConfettiTrigger } from "./ConfettiTrigger";
import { CriterionCard } from "./CriterionCard";
import { WritingComparativeTab } from './writing/WritingComparativeTab';
import { GrammarBatchView } from './grammar/GrammarBatchView';
import type { AttemptResult, WritingDetail } from "../types";

type Props = {
  attemptData: AttemptResult;
  writingDetail: WritingDetail;
  attemptId: string;
};

export function WritingResultView({
  attemptData,
  writingDetail,
  attemptId,
}: Props) {
  const router = useRouter();
  const [showModel, setShowModel] = useState(false);
  const [writingTab, setWritingTab] = useState<'grading' | 'comparative' | 'grammar'>('grading');

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (writingDetail.taskResponse) {
    if (writingDetail.taskResponse.band >= 6)
      strengths.push("Task Response");
    else weaknesses.push("Task Response");
  }
  if (writingDetail.coherenceAndCohesion) {
    if (writingDetail.coherenceAndCohesion.band >= 6)
      strengths.push("Coherence");
    else weaknesses.push("Coherence");
  }
  if (writingDetail.lexicalResource) {
    if (writingDetail.lexicalResource.band >= 6)
      strengths.push("Vocabulary");
    else weaknesses.push("Vocabulary");
  }
  if (writingDetail.grammaticalRangeAndAccuracy) {
    if (writingDetail.grammaticalRangeAndAccuracy.band >= 6)
      strengths.push("Grammar");
    else weaknesses.push("Grammar");
  }

  const writingBandBreakdowns = [
    writingDetail.taskResponse && {
      skill: "WRITING",
      score: writingDetail.taskResponse.band,
      label: "Task",
    },
    writingDetail.coherenceAndCohesion && {
      skill: "READING",
      score: writingDetail.coherenceAndCohesion.band,
      label: "Coherence",
    },
    writingDetail.lexicalResource && {
      skill: "LISTENING",
      score: writingDetail.lexicalResource.band,
      label: "Lexical",
    },
    writingDetail.grammaticalRangeAndAccuracy && {
      skill: "SPEAKING",
      score: writingDetail.grammaticalRangeAndAccuracy.band,
      label: "Grammar",
    },
  ].filter(Boolean) as { skill: string; score: number; label: string }[];

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Confetti */}
        <ConfettiTrigger
          score={writingDetail.overallBand}
          targetScore={6}
        />

        {/* Score Reveal */}
        <motion.div
          className="flex flex-col items-center py-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p
            className="text-sm font-bold text-[var(--text-muted)] mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Writing Assessment
          </p>
          <ScoreCounter
            value={writingDetail.overallBand}
            duration={1.5}
            decimals={1}
            className="text-6xl font-bold text-[var(--primary)]"
          />
          <p
            className="text-sm font-semibold text-[var(--text-muted)] mt-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Overall Band Score
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {writingDetail.gradedAt &&
              new Date(writingDetail.gradedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
          </p>
        </motion.div>

        {/* Band Breakdown Bars */}
        <div className="max-w-md mx-auto space-y-3">
          {writingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 * idx,
                ease: "easeOut",
              }}
            >
              <SkillProgressBar
                skill={b.label}
                score={b.score}
                delay={0.2 * idx}
              />
            </motion.div>
          ))}
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {writingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={`card-${b.label}`}
              className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-4 flex flex-col items-center justify-center text-center hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.6 + idx * 0.1,
                ease: "easeOut",
              }}
            >
              <span
                className="text-3xl font-bold text-[var(--foreground)] mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {b.score.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {b.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Task Prompt */}
        <motion.div
          className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
        >
          <h3
            className="text-sm font-bold text-[var(--text-muted)] mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Task Prompt
          </h3>
          <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-wrap">
            {writingDetail.taskText || (
              <span className="italic text-[var(--text-muted)]">
                (No task text)
              </span>
            )}
          </p>
          {writingDetail.imageUrl && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={writingDetail.imageUrl}
                alt="Writing task chart"
                className="w-full rounded-2xl border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              />
            </div>
          )}
        </motion.div>

        {/* Feedback Body */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
        >
          {/* LEFT: The Essay */}
          <div className="lg:col-span-2">
            <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8">
              <h3
                className="text-sm font-bold text-[var(--text-muted)] mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Your Submission
              </h3>
              <div className="text-lg leading-loose text-[var(--foreground)] whitespace-pre-wrap">
                {writingDetail.essayRaw || (
                  <span className="italic text-[var(--text-muted)]">
                    (No essay content)
                  </span>
                )}
              </div>
              <div className="mt-6 pt-6 border-t-[2px] border-[var(--border)] flex justify-between text-sm text-[var(--text-muted)]">
                <span>{writingDetail.wordCount} words</span>
                <span className="text-xs">
                  {writingDetail.gradedAt &&
                    new Date(writingDetail.gradedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-6">
            {/* Critique */}
            <div className="rounded-[2rem] border-[3px] border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--primary-light)] p-6">
              <h3
                className="font-bold text-[var(--primary-dark)] mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Examiner&apos;s Critique
              </h3>
              <div className="space-y-4 text-sm text-[var(--text-body)] leading-relaxed">
                {strengths.length > 0 && (
                  <div>
                    <p className="font-bold text-[var(--skill-speaking)] mb-1">
                      Strengths
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[var(--text-body)] text-xs">
                      {strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div>
                    <p className="font-bold text-[var(--skill-writing)] mb-1">
                      Areas to Improve
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[var(--text-body)] text-xs">
                      {weaknesses.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {writingDetail.suggestions.length > 0 && (
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                <h3
                  className="font-bold text-[var(--foreground)] mb-3"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Tips
                </h3>
                <ul className="text-xs text-[var(--text-body)] space-y-2">
                  {writingDetail.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[var(--text-muted)]">
                        {i + 1}.
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Answer Toggle */}
            {writingDetail.improvedParagraph && (
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                <h3
                  className="font-bold text-[var(--foreground)] mb-2"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Better Version?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  See how an improved version would look.
                </p>
                <button
                  onClick={() => setShowModel(!showModel)}
                  className="w-full py-2.5 rounded-full bg-[var(--foreground)] text-white font-bold text-sm border-b-[4px] border-black hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {showModel ? "Hide Model Answer" : "View Model Answer"}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Model Answer (Expandable) */}
        <AnimatePresence>
          {showModel && writingDetail.improvedParagraph && (
            <motion.div
              className="bg-[var(--foreground)] text-white rounded-[2rem] border-[3px] border-[var(--foreground)] shadow-[0_4px_0_rgba(0,0,0,0.3)] p-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3
                className="font-bold mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Improved Version
              </h3>
              <p className="text-lg leading-loose opacity-90 whitespace-pre-wrap">
                {writingDetail.improvedParagraph}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Criteria Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {writingDetail.taskResponse && (
            <CriterionCard
              title="Task Response"
              criterion={writingDetail.taskResponse}
            />
          )}
          {writingDetail.coherenceAndCohesion && (
            <CriterionCard
              title="Coherence & Cohesion"
              criterion={writingDetail.coherenceAndCohesion}
            />
          )}
          {writingDetail.lexicalResource && (
            <CriterionCard
              title="Lexical Resource"
              criterion={writingDetail.lexicalResource}
            />
          )}
          {writingDetail.grammaticalRangeAndAccuracy && (
            <CriterionCard
              title="Grammatical Range & Accuracy"
              criterion={writingDetail.grammaticalRangeAndAccuracy}
            />
          )}
        </div>

        {/* Writing Analysis Tabs */}
        <motion.div
          className="flex justify-center rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.0, ease: 'easeOut' }}
        >
          {(['grading', 'comparative', 'grammar'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setWritingTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-150 ${
                writingTab === tab
                  ? 'text-[var(--primary)] border-b-[3px] border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-[3px] border-transparent'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {tab === 'grading' ? 'Grading' : tab === 'comparative' ? 'Comparative' : 'Grammar'}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        {writingTab === 'comparative' && (
          <WritingComparativeTab submissionId={attemptId || ''} />
        )}
        {writingTab === 'grammar' && (
          <GrammarBatchView
            results={[]}
            errorTexts={[]}
            isLoading={false}
            isError={false}
            failedCount={0}
            totalCount={0}
            onRetry={() => {}}
          />
        )}

        {/* Footer */}
        <div className="flex justify-center gap-4 pt-4 pb-10">
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
