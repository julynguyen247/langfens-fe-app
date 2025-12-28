"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAttemptResult } from "@/utils/api";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { ReadingScreen } from "../../../do-test/[skill]/[attemptId]/page";

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
        
        // Build question metadata and answer mapping
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

        // Get answers and build review data
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
          
          // For choice questions, use selectedOptionIds; for text, use selectedAnswerText
          const qType = (meta?.questionType ?? "").toUpperCase();
          if (qType.includes("MCQ") || qType.includes("TRUE_FALSE") || qType.includes("YES_NO")) {
            const optionIds = a.selectedOptionIds ?? [];
            initAnswers[qid] = Array.isArray(optionIds) ? optionIds.join(",") : String(optionIds);
          } else {
            initAnswers[qid] = a.selectedAnswerText ?? "";
          }
        }

        // Detect skill
        const firstSkill = paper?.sections?.[0]?.skill ?? 
          answers[0]?.skill ?? 
          (raw as any).skill ?? 
          "READING";
        setSkill(firstSkill.toUpperCase() as "READING" | "LISTENING");
        
        // Count correct/wrong
        const correct = answers.filter((a: any) => a.isCorrect === true).length;
        setCorrectCount(correct);
        setWrongCount(answers.length - correct);

        // Populate attempt store so ReadingScreen can access data
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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-slate-600">Đang tải kết quả...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden">
      {/* TopBar */}
      <header className="flex-shrink-0 h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/attempts/${attemptId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Đóng"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-900 uppercase">
              {skill} REVIEW
            </h1>
            <p className="text-xs text-slate-500">
              Attempt {attemptId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            ✓ {correctCount} đúng
          </span>
          <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
            ✗ {wrongCount} sai
          </span>
          <button
            onClick={() => router.push(`/attempts/${attemptId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Xem chi tiết
          </button>
        </div>
      </header>

      {/* Main content - render the actual ReadingScreen */}
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
