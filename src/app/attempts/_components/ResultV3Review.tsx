"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startAttempt } from "@/utils/api";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import {
  AttemptAnswerItem,
  AttemptResultData,
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  QuestionGradeResult,
  ResultFilterType,
  UserAnswerValue,
} from "@/components/exam-v3/types";
import { fetchAttemptResult } from "../_lib/resultApi";
import { ScoreReportModalV3 } from "./ScoreReportModalV3";
import { ResultFilterTabsV3 } from "./ResultFilterTabsV3";
import { PassagePanelV3 } from "@/components/exam-v3/PassagePanelV3";
import { QuestionCardV3 } from "@/components/exam-v3/QuestionCardV3";
import { QuestionNavigatorV3 } from "@/components/exam-v3/QuestionNavigatorV3";
import {
  RESULT_BUTTON_PRIMARY,
  RESULT_BUTTON_SECONDARY,
} from "@/components/exam-v3/resultButtonStyles";
import { parseUserAnswer } from "./parseUserAnswer";

type RetakeSkill = "reading" | "listening" | "writing" | "speaking";

function getRetakeSkill(paper: InternalDeliveryExam): RetakeSkill | null {
  const supportedSkills: RetakeSkill[] = [
    "reading",
    "listening",
    "writing",
    "speaking",
  ];

  for (const section of paper.sections ?? []) {
    const questions = [
      ...(section.questions ?? []),
      ...((section.questionGroups ?? []).flatMap((group) => group.questions ?? [])),
    ];

    for (const question of questions) {
      const skill = question.skill?.trim().toLowerCase();
      if (skill && supportedSkills.includes(skill as RetakeSkill)) {
        return skill as RetakeSkill;
      }
    }
  }

  return null;
}

/**
 * Result-v3 review UI for an attempt: split-screen paper (PassagePanelV3
 * on left, QuestionCardV3 on right) with filter tabs, QuestionNavigatorV3,
 * and a ScoreReportModalV3. Used for reading/listening/generic attempts.
 */
export function ResultV3Review({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const setAttempt = useAttemptStore((state) => state.setAttempt);

  const [result, setResult] = useState<AttemptResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState<string | null>(null);

  // Active section tab & filter
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ResultFilterType>("ALL");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  const handleRetake = async () => {
    if (!result?.examId || isRetaking) return;

    const skill = getRetakeSkill(result.paper);
    if (!skill) {
      setRetakeError(
        "Could not determine this exam's skill. Please return to history and start it there."
      );
      return;
    }

    setIsRetaking(true);
    setRetakeError(null);
    try {
      const response = await startAttempt(result.examId);
      const payload = response?.data?.data ?? response?.data;
      const nextAttemptId = payload?.attemptId ?? payload?.id;
      if (typeof nextAttemptId !== "string" || !nextAttemptId) {
        throw new Error("The attempt service did not return an attempt ID.");
      }

      setAttempt({ ...payload, attemptId: nextAttemptId });
      router.replace(`/do-test/${skill}/${nextAttemptId}`);
    } catch {
      setRetakeError("Could not start the exam. Please try again.");
    } finally {
      setIsRetaking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAttemptResult(attemptId);
        if (cancelled) return;
        setResult(data);
      } catch (err: unknown) {
        if (cancelled) return;
        let msg = "Failed to load attempt results";
        if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
          msg = err.message;
        }
        setError(msg);
      } finally {
        if (cancelled) return;
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, 800 - elapsed);
        setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, remaining);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [attemptId]);

  // Index answers by question ID and sequential display index
  const { answersByDisplayIdx, gradeResultsByDisplayIdx, allFlattenedQuestions } =
    useMemo(() => {
      if (!result) {
        return {
          answersByDisplayIdx: {} as Record<number, AttemptAnswerItem>,
          gradeResultsByDisplayIdx: {} as Record<number, QuestionGradeResult>,
          allFlattenedQuestions: [] as InternalDeliveryQuestion[],
        };
      }

      const answerByQId = new Map<string, AttemptAnswerItem>();
      const answerByIdx = new Map<number, AttemptAnswerItem>();
      for (const a of result.answers) {
        if (a.questionId) answerByQId.set(a.questionId, a);
        answerByIdx.set(a.idx, a);
      }

      const answersByDisp: Record<number, AttemptAnswerItem> = {};
      const gradesByDisp: Record<number, QuestionGradeResult> = {};
      const flattened: InternalDeliveryQuestion[] = [];

      for (const sec of result.paper.sections || []) {
        for (const q of sec.questions || []) {
          flattened.push(q);
        }
        for (const grp of sec.questionGroups || []) {
          for (const q of grp.questions || []) {
            if (!flattened.some((x: InternalDeliveryQuestion) => x.displayIdx === q.displayIdx)) {
              flattened.push(q);
            }
          }
        }
      }

      flattened.sort((a, b) => (a.displayIdx ?? a.idx) - (b.displayIdx ?? b.idx));

      for (const q of flattened) {
        const dIdx = q.displayIdx ?? q.idx;
        const matchedAns = (q.id ? answerByQId.get(q.id) : null) || answerByIdx.get(q.idx);

        if (matchedAns) {
          answersByDisp[dIdx] = matchedAns;
          gradesByDisp[dIdx] = {
            questionIdx: dIdx,
            isCorrect: matchedAns.isCorrect === true,
            score: matchedAns.isCorrect ? 1 : 0,
            maxScore: 1,
            userAnswer: parseUserAnswer(matchedAns),
            correctAnswerText: matchedAns.correctAnswerText || "See explanation",
          };
        } else {
          gradesByDisp[dIdx] = {
            questionIdx: dIdx,
            isCorrect: false,
            score: 0,
            maxScore: 1,
            correctAnswerText: "Unanswered",
          };
        }
      }

      return {
        answersByDisplayIdx: answersByDisp,
        gradeResultsByDisplayIdx: gradesByDisp,
        allFlattenedQuestions: flattened,
      };
    }, [result]);

  // Counts for filter tabs
  const { correctCount, incorrectCount, unansweredCount } = useMemo(() => {
    let c = 0;
    let inc = 0;
    let un = 0;

    for (const q of allFlattenedQuestions) {
      const dIdx = q.displayIdx ?? q.idx;
      const ans = answersByDisplayIdx[dIdx];
      if (!ans || (ans.textAnswer === null && (!ans.selectedOptionIds || ans.selectedOptionIds.length === 0))) {
        un++;
      } else if (ans.isCorrect === true) {
        c++;
      } else {
        inc++;
      }
    }

    return { correctCount: c, incorrectCount: inc, unansweredCount: un };
  }, [allFlattenedQuestions, answersByDisplayIdx]);

  // Filter helper for questions
  const isQuestionMatchingFilter = (q: InternalDeliveryQuestion): boolean => {
    if (activeFilter === "ALL") return true;
    const dIdx = q.displayIdx ?? q.idx;
    const ans = answersByDisplayIdx[dIdx];

    if (activeFilter === "CORRECT") {
      return ans?.isCorrect === true;
    }
    if (activeFilter === "INCORRECT") {
      return ans?.isCorrect === false;
    }
    if (activeFilter === "UNANSWERED") {
      return !ans || (ans.textAnswer === null && (!ans.selectedOptionIds || ans.selectedOptionIds.length === 0));
    }
    return true;
  };

  // Scroll jump from navigator
  const handleSelectQuestion = (qIdx: number) => {
    if (!result) return;

    const secIndex = result.paper.sections.findIndex((sec: InternalDeliverySection) => {
      const inMain = (sec.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx);
      const inGroup = (sec.questionGroups || []).some((g: InternalDeliveryQuestionGroup) =>
        (g.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx)
      );
      return inMain || inGroup;
    });

    if (secIndex >= 0 && secIndex !== activeSectionIdx) {
      setActiveSectionIdx(secIndex);
    }

    setActiveQuestionIdx(qIdx);

    const targetQ = allFlattenedQuestions.find((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx);
    if (targetQ && !isQuestionMatchingFilter(targetQ)) {
      setActiveFilter("ALL");
    }

    setTimeout(() => {
      const el = document.getElementById(`q-${qIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Paragraph Locator
  const handleLocateParagraph = (letter: string) => {
    const targetEl = document.getElementById(`para-${letter}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("ring-4", "ring-amber-400", "bg-amber-100/60");
      setTimeout(() => {
        targetEl.classList.remove("ring-4", "ring-amber-400", "bg-amber-100/60");
      }, 2500);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] font-sans">
        <div className="w-12 h-12 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">
          Loading attempt review & score analysis (Engine v3)...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-[2rem] bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] text-center space-y-4">
          <h2 className="text-xl font-bold text-[var(--destructive)]">Failed to load review</h2>
          <p className="text-xs text-[var(--text-muted)]">{error || "Attempt not found"}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/history"
              className={`${RESULT_BUTTON_PRIMARY} px-5 py-2.5 text-xs no-underline`}
            >
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = result.paper.sections[activeSectionIdx] || result.paper.sections[0];
  const partNum = (currentSection.idx ?? activeSectionIdx) + 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b-2 border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-between shrink-0 shadow-xs z-30 font-sans">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/history")}
            className={`${RESULT_BUTTON_SECONDARY} h-9 w-9 p-0 text-[var(--text-muted)]`}
            title="Back to history"
            aria-label="Back to history"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="bg-[#D32F2F] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
              IELTS
            </span>
            <div>
              <span className="font-bold text-sm text-[var(--foreground)] truncate max-w-xs sm:max-w-md block">
                {result.paper.title}
              </span>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">
                Official Review Mode (v3)
              </span>
            </div>
          </div>
        </div>

        {/* Score Capsule & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 p-1 rounded-full bg-[var(--background)] border border-[var(--border)]">
            <div className="px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Band</span>
              <span className="font-mono text-sm font-extrabold text-[var(--primary)]">
                {result.ieltsBand ? result.ieltsBand.toFixed(1) : "N/A"}
              </span>
            </div>

            <div className="px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Score</span>
              <span className="font-mono text-sm font-bold text-[var(--foreground)]">
                {result.correctCount} / {result.totalQuestion}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsScoreModalOpen(true)}
              className={`${RESULT_BUTTON_SECONDARY} h-8 px-3 text-xs`}
            >
              <span>📊</span>
              <span>Score Report</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsScoreModalOpen(true)}
            className={`${RESULT_BUTTON_SECONDARY} md:hidden h-8 px-3 text-xs`}
          >
            <span>📊</span>
            <span>Band {result.ieltsBand ? result.ieltsBand.toFixed(1) : "N/A"}</span>
          </button>

          {result.examId && (
            <button
              type="button"
              onClick={() => void handleRetake()}
              disabled={isRetaking}
              aria-busy={isRetaking}
              className={`${RESULT_BUTTON_PRIMARY} h-9 px-5 text-xs`}
            >
              {isRetaking ? "Starting..." : "Retake Exam"}
            </button>
          )}
          {retakeError && (
            <span role="alert" className="max-w-48 text-[10px] font-semibold text-[var(--destructive)]">
              {retakeError}
            </span>
          )}
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanelV3
            sections={result.paper.sections}
            activeSectionIdx={activeSectionIdx}
            onSelectSection={setActiveSectionIdx}
          />
        </div>

        {/* Right Column: Questions Panel */}
        <div
          ref={rightPanelRef}
          className="w-1/2 h-full overflow-y-auto p-6 space-y-6 select-text"
        >
          {/* Section Heading & Filter Tabs */}
          <div className="space-y-3 pb-3 border-b-2 border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  Part {partNum} Questions Review
                </span>
                <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight mt-0.5">
                  {currentSection.title}
                </h3>
              </div>
            </div>

            <ResultFilterTabsV3
              activeFilter={activeFilter}
              totalCount={allFlattenedQuestions.length}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
              onChange={setActiveFilter}
            />
          </div>

          {/* Question Groups */}
          {currentSection.questionGroups &&
            currentSection.questionGroups.map((grp: InternalDeliveryQuestionGroup) => {
              const matchingQuestions = grp.questions.filter(isQuestionMatchingFilter);
              if (matchingQuestions.length === 0 && activeFilter !== "ALL") return null;

              return (
                <div key={grp.id} className="space-y-4">
                  {/* Admin-like Group Instruction Banner */}
                  <div className="p-5 rounded-2xl bg-[var(--primary-light)] border-2 border-[var(--skill-reading-border)] text-xs text-[var(--text-body)] leading-relaxed font-sans shadow-xs">
                    <span className="font-bold text-[var(--primary)] block mb-1">
                      Questions {grp.startIdx} – {grp.endIdx} Instructions:
                    </span>
                    {grp.instructionMd}
                  </div>

                  {matchingQuestions.map((q: InternalDeliveryQuestion) => {
                    const num = q.displayIdx ?? q.idx;
                    const ans = answersByDisplayIdx[num];
                    return (
                      <QuestionCardV3
                        key={q.id || num}
                        question={q}
                        mode="review"
                        value={parseUserAnswer(ans)}
                        gradeResult={gradeResultsByDisplayIdx[num]}
                        onLocateParagraph={handleLocateParagraph}
                      />
                    );
                  })}
                </div>
              );
            })}

          {/* Root Section questions */}
          <div className="space-y-4">
            {currentSection.questions
              .filter(isQuestionMatchingFilter)
              .map((q: InternalDeliveryQuestion) => {
                const num = q.displayIdx ?? q.idx;
                const ans = answersByDisplayIdx[num];
                return (
                  <QuestionCardV3
                    key={q.id || num}
                    question={q}
                    mode="review"
                    value={parseUserAnswer(ans)}
                    gradeResult={gradeResultsByDisplayIdx[num]}
                    onLocateParagraph={handleLocateParagraph}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Navigator */}
      <QuestionNavigatorV3
        totalQuestions={allFlattenedQuestions.length}
        sections={result.paper.sections}
        mode="review"
        activeIdx={activeQuestionIdx}
        answersByDisplayIdx={answersByDisplayIdx}
        onSelect={handleSelectQuestion}
      />

      {/* Score Modal */}
      <ScoreReportModalV3
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        result={result}
      />
    </div>
  );
}

export default ResultV3Review;
