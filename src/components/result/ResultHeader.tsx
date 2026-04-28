"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScoreCounter } from "@/components/ui/ScoreCounter";
import { SkillProgressBar } from "@/components/ui/SkillProgressBar";

const getLabel = (code: string): string => {
  const map: Record<string, string> = {
    TR: "Task Response",
    CC: "Coherence",
    LR: "Vocabulary",
    GRA: "Grammar",
    FC: "Fluency",
    P: "Pronunciation",
    Correct: "Correct",
    Skipped: "Skipped",
    Time: "Time Taken",
    Accuracy: "Accuracy",
  };
  return map[code] || code;
};

export interface MetricItem {
  label: string;
  value: string | number;
}

export interface BandBreakdown {
  skill: string;
  score: number;
}

interface ResultHeaderProps {
  skill: string;
  overallScore: number | string;
  date: string;
  metrics: MetricItem[];
  bandBreakdowns?: BandBreakdown[];
}

export function ResultHeader({
  skill,
  overallScore,
  date,
  metrics,
  bandBreakdowns,
}: ResultHeaderProps) {
  const numericScore =
    typeof overallScore === "number" ? overallScore : parseFloat(overallScore);
  const hasNumericScore = !isNaN(numericScore);

  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated Score Counter */}
      <div className="flex flex-col items-center">
        <p
          className="text-sm font-bold text-[var(--text-muted)] mb-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {skill} Assessment
        </p>
        {hasNumericScore ? (
          <ScoreCounter
            value={numericScore}
            duration={1.5}
            decimals={1}
            className="text-6xl font-bold text-[var(--primary)]"
          />
        ) : (
          <span
            className="text-6xl font-bold text-[var(--primary)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {overallScore}
          </span>
        )}
        <p
          className="text-sm font-semibold text-[var(--text-muted)] mt-3"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Overall Band Score
        </p>
        <div className="mt-4 flex items-center gap-2 bg-[var(--primary-light)] text-[var(--primary)] px-4 py-1.5 rounded-full border-[2px] border-[var(--primary)] text-xs font-bold">
          Official Result
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
          {date}
        </p>
      </div>

      {/* Band Breakdown Bars */}
      {bandBreakdowns && bandBreakdowns.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          {bandBreakdowns.map((b, idx) => (
            <motion.div
              key={b.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 * idx, ease: "easeOut" }}
            >
              <SkillProgressBar
                skill={b.skill}
                score={b.score}
                delay={0.2 * idx}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        {metrics.slice(0, 4).map((m, idx) => (
          <motion.div
            key={`${m.label}-${idx}`}
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
              {m.value}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {getLabel(m.label)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default ResultHeader;
