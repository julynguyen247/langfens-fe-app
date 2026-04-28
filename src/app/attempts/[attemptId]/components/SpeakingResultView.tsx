"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScoreCounter } from "@/components/ui/ScoreCounter";
import { SkillProgressBar } from "@/components/ui/SkillProgressBar";
import { ConfettiTrigger } from "./ConfettiTrigger";
import { CriterionCard } from "./CriterionCard";
import type { AttemptResult, SpeakingDetail } from "../types";

type Props = {
  attemptData: AttemptResult;
  speakingDetail: SpeakingDetail | null;
  overallBand: number | undefined;
  headerTitle: string;
};

export function SpeakingResultView({
  attemptData,
  speakingDetail,
  overallBand,
  headerTitle,
}: Props) {
  const router = useRouter();

  const speakingBandBreakdowns = [
    speakingDetail?.fluencyAndCoherence && {
      skill: "Fluency",
      score: speakingDetail.fluencyAndCoherence.band,
    },
    speakingDetail?.pronunciation && {
      skill: "Pronunciation",
      score: speakingDetail.pronunciation.band,
    },
    speakingDetail?.lexicalResource && {
      skill: "Vocabulary",
      score: speakingDetail.lexicalResource.band,
    },
    speakingDetail?.grammaticalRangeAndAccuracy && {
      skill: "Grammar",
      score: speakingDetail.grammaticalRangeAndAccuracy.band,
    },
  ].filter(Boolean) as { skill: string; score: number }[];

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Confetti */}
        <ConfettiTrigger
          score={typeof overallBand === "number" ? overallBand : 0}
          targetScore={6}
        />

        {/* Score Reveal Hero */}
        <motion.div
          className="flex flex-col items-center py-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2
            className="text-sm font-bold text-[var(--text-muted)] mb-1"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {headerTitle}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            {speakingDetail?.gradedAt
              ? new Date(speakingDetail.gradedAt).toLocaleString("vi-VN")
              : new Date().toLocaleString("vi-VN")}
          </p>

          {typeof overallBand === "number" ? (
            <ScoreCounter
              value={overallBand}
              duration={1.5}
              decimals={1}
              className="text-6xl font-bold text-[var(--primary)]"
            />
          ) : (
            <span
              className="text-6xl font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              --
            </span>
          )}
          <p
            className="text-sm font-semibold text-[var(--text-muted)] mt-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Overall Band Score
          </p>
          {typeof speakingDetail?.wordCount === "number" && (
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {speakingDetail.wordCount} words spoken
            </p>
          )}
        </motion.div>

        {/* Band Breakdown Bars */}
        <div className="max-w-md mx-auto space-y-3">
          {speakingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={b.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 * idx,
                ease: "easeOut",
              }}
            >
              <SkillProgressBar
                skill={b.skill}
                score={b.score}
                delay={0.2 * idx}
              />
            </motion.div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {speakingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={`card-${b.skill}`}
              className="p-4 rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white text-center hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.6 + idx * 0.1,
                ease: "easeOut",
              }}
            >
              <span
                className="text-3xl font-bold text-[var(--primary)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {b.score?.toFixed(1) ?? "--"}
              </span>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-2">
                {b.skill}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transcript */}
        {speakingDetail?.transcript && (
          <motion.div
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
          >
            <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
              <h2
                className="text-sm font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Interview Transcript
              </h2>
            </div>
            <div className="p-6">
              {speakingDetail?.taskText && (
                <div className="mb-6">
                  <p className="text-[var(--text-muted)] italic text-sm mb-2">
                    Examiner asks:
                  </p>
                  <p className="text-[var(--text-body)] text-sm leading-relaxed">
                    &ldquo;{speakingDetail.taskText}&rdquo;
                  </p>
                </div>
              )}

              <div className="pl-4 border-l-[3px] border-[var(--primary)]">
                <p className="text-[var(--text-muted)] text-xs font-bold mb-2">
                  Your Response:
                </p>
                <p className="text-[var(--foreground)] font-medium text-lg leading-relaxed whitespace-pre-wrap">
                  {speakingDetail.transcript}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed Feedback Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {speakingDetail?.fluencyAndCoherence && (
            <CriterionCard
              title="Fluency & Coherence"
              criterion={speakingDetail.fluencyAndCoherence}
            />
          )}
          {speakingDetail?.lexicalResource && (
            <CriterionCard
              title="Lexical Resource"
              criterion={speakingDetail.lexicalResource}
            />
          )}
          {speakingDetail?.grammaticalRangeAndAccuracy && (
            <CriterionCard
              title="Grammatical Range & Accuracy"
              criterion={speakingDetail.grammaticalRangeAndAccuracy}
            />
          )}
          {speakingDetail?.pronunciation && (
            <CriterionCard
              title="Pronunciation"
              criterion={speakingDetail.pronunciation}
            />
          )}
        </div>

        {/* Suggestions */}
        {speakingDetail?.suggestions &&
          speakingDetail.suggestions.length > 0 && (
            <motion.div
              className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0, ease: "easeOut" }}
            >
              <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
                <h2
                  className="text-sm font-bold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Improvement Suggestions
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {speakingDetail.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-body)]"
                    >
                      <span className="text-[var(--primary)] shrink-0 font-bold">
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

        {/* Model Answer */}
        {speakingDetail?.improvedAnswer && (
          <motion.div
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
          >
            <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
              <h2
                className="text-sm font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Model Answer
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[var(--text-body)] text-sm leading-relaxed whitespace-pre-wrap">
                {speakingDetail.improvedAnswer}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center gap-4 pb-10">
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
