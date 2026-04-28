"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAttemptResult } from "@/utils/api";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { ReadingScreen } from "../../../do-test/[skill]/[attemptId]/page";
import { motion } from "framer-motion";

export default function ReviewPage() {
  const { attemptId } = useParams() as { attemptId: string };
  const router = useRouter();
  const setAttempt = useAttemptStore((s) => s.setAttempt);

  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<Array<{
    questionId: string;
    isCorrect: boolean | null;
    correctAnswer?: string;
    explanation?: string;
  }>>([]);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({});
  const [skill, setSkill] = useState<"READING" | "LISTENING">("READING");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAttemptResult(attemptId as any);
        const raw = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        const paper = (raw as any).paperWithAnswers ?? (raw as any).paper ?? null;

        const questionMetaById: Record<string, any> = {};
        if (paper?.sections) {
          for (const sec of paper.sections) {
            const qs = sec.questions ?? (sec.questionGroups ?? []).flatMap((g: any) => g.questions ?? []);
            for (const q of qs) {
              if (!q?.id) continue;
              questionMetaById[String(q.id)] = {
                explanationMd: q.explanationMd ?? "",
                questionType: q.type ?? q.questionType ?? "UNKNOWN",
              };
            }
          }
        }

        const answers: any[] = (raw as any).answers ?? (raw as any).items ?? (raw as any).questions ?? [];

        const review: typeof reviewData = [];
        const initAnswers: Record<string, string> = {};

        for (const a of answers) {
          const qid = String(a.questionId ?? a.id);
          const meta = questionMetaById[qid];

          review.push({
            questionId: qid,
            isCorrect: a.isCorrect ?? null,
            correctAnswer: a.correctAnswerText ?? "",
            explanation: a.explanationMd ?? meta?.explanationMd ?? "",
          });

          const qType = (meta?.questionType ?? "").toUpperCase();
          if (qType.includes("MCQ") || qType.includes("TRUE_FALSE") || qType.includes("YES_NO")) {
            const optionIds = a.selectedOptionIds ?? [];
            initAnswers[qid] = Array.isArray(optionIds) ? optionIds.join(",") : String(optionIds);
          } else {
            initAnswers[qid] = a.selectedAnswerText ?? "";
          }
        }

        const firstSkill = paper?.sections?.[0]?.skill ??
          answers[0]?.skill ??
          (raw as any).skill ??
          "READING";
        setSkill(firstSkill.toUpperCase() as "READING" | "LISTENING");

        const correct = answers.filter((a: any) => a.isCorrect === true).length;
        setCorrectCount(correct);
        setWrongCount(answers.length - correct);

        setAttempt({
          attemptId,
          paper,
          startedAt: (raw as any).startedAt ?? new Date().toISOString(),
          durationSec: (raw as any).durationSec ?? 3600,
          timeLeft: 0,
        } as any);

        setReviewData(review);
        setInitialAnswers(initAnswers);
      } catch (e) {
        console.error("Error loading review:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, setAttempt]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p
          className="text-base font-bold text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Loading results...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* TopBar */}
      <motion.header
        className="flex-shrink-0 h-16 bg-white border-b-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] flex items-center justify-between px-4 sm:px-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/attempts/${attemptId}`)}
            className="px-4 py-2 rounded-full bg-[var(--background)] border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold text-sm hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-150"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Back
          </button>
          <div>
            <h1
              className="text-base font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {skill.charAt(0) + skill.slice(1).toLowerCase()} Review
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Attempt {attemptId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] text-sm font-bold">
            {correctCount} correct
          </span>
          <span className="px-4 py-1.5 rounded-full border-[2px] border-red-300 bg-red-50 text-red-600 text-sm font-bold">
            {wrongCount} wrong
          </span>
          <button
            onClick={() => router.push(`/attempts/${attemptId}`)}
            className="px-5 py-2 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            View Details
          </button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <ReadingScreen
          attemptId={attemptId}
          isReviewMode={true}
          reviewData={reviewData}
          initialAnswers={initialAnswers}
        />
      </main>
    </div>
  );
}
