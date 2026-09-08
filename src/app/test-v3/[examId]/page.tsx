"use client";

import React, { useEffect, useState, use, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  enrichExamWithSequentialNumbers,
  ExamGradeSummary,
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  QuestionGradeResult,
  UserAnswerValue,
} from "@/components/exam-v3/types";
import { fetchExamDeliveryPaper } from "../_lib/examApi";
import { gradeExamPaper } from "../_lib/grader";
import { ExamTopBar } from "../_components/ExamTopBar";
import { ScoreModalV3 } from "../_components/ScoreModalV3";
import { PassagePanelV3 } from "@/components/exam-v3/PassagePanelV3";
import { QuestionCardV3 } from "@/components/exam-v3/QuestionCardV3";
import { QuestionNavigatorV3 } from "@/components/exam-v3/QuestionNavigatorV3";

export default function TestV3ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;
  const router = useRouter();

  const [exam, setExam] = useState<InternalDeliveryExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab index
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // User state
  const [answers, setAnswers] = useState<Record<number, UserAnswerValue>>({});
  const [flaggedIndices, setFlaggedIndices] = useState<number[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);

  // Timer & Submission
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradeSummary, setGradeSummary] = useState<ExamGradeSummary | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Load Exam Delivery
  useEffect(() => {
    async function loadPaper() {
      try {
        setLoading(true);
        setError(null);
        const raw = await fetchExamDeliveryPaper(examId, true);
        if (!raw) throw new Error("Exam payload is empty or not found.");

        const { enrichedExam } = enrichExamWithSequentialNumbers(raw);
        setExam(enrichedExam);
        const durationSeconds = (enrichedExam.durationMin || 60) * 60;
        setTimeRemaining(durationSeconds);
      } catch (err: unknown) {
        let msg = "Failed to load exam paper.";
        if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadPaper();
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || loading || !exam) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, loading, exam]);

  // All question numbers across entire exam
  const allQuestionIndices = useMemo(() => {
    if (!exam) return [];
    const list: number[] = [];
    for (const sec of exam.sections || []) {
      for (const q of sec.questions || []) {
        const num = q.displayIdx ?? q.idx;
        if (!list.includes(num)) list.push(num);
      }
      for (const grp of sec.questionGroups || []) {
        for (const q of grp.questions || []) {
          const num = q.displayIdx ?? q.idx;
          if (!list.includes(num)) list.push(num);
        }
      }
    }
    return list.sort((a, b) => a - b);
  }, [exam]);

  const handleAnswerChange = (qIndex: number, val: UserAnswerValue) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: val,
    }));
  };

  const handleToggleFlag = (qIndex: number) => {
    setFlaggedIndices((prev) =>
      prev.includes(qIndex) ? prev.filter((i) => i !== qIndex) : [...prev, qIndex]
    );
  };

  const handleSubmitExam = () => {
    if (!exam || isSubmitted) return;

    const summary = gradeExamPaper(exam, answers);
    setGradeSummary(summary);
    setIsSubmitted(true);
    setIsScoreModalOpen(true);
  };

  const handleSelectQuestion = (qIndex: number) => {
    if (!exam) return;

    const secIndex = exam.sections.findIndex((sec: InternalDeliverySection) => {
      const inMain = (sec.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIndex);
      const inGroup = (sec.questionGroups || []).some((g: InternalDeliveryQuestionGroup) =>
        (g.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIndex)
      );
      return inMain || inGroup;
    });

    if (secIndex >= 0 && secIndex !== activeSectionIdx) {
      setActiveSectionIdx(secIndex);
    }

    setActiveQuestionIdx(qIndex);

    setTimeout(() => {
      const el = document.getElementById(`q-${qIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleRetake = () => {
    setAnswers({});
    setFlaggedIndices([]);
    setIsSubmitted(false);
    setGradeSummary(null);
    setIsScoreModalOpen(false);
    if (exam) {
      setTimeRemaining((exam.durationMin || 60) * 60);
    }
  };

  const handleExit = () => {
    if (!isSubmitted) {
      const confirmExit = window.confirm(
        "Are you sure you want to exit? Your current test progress will be lost."
      );
      if (!confirmExit) return;
    }
    router.push("/history");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-800 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-[#2563EB] rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-600">
          Loading IELTS exam paper (Engine v3)...
        </p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F9FA] p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-600">Failed to load exam</h2>
          <p className="text-xs text-slate-500">{error || "Exam paper not found"}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/history"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = exam.sections[activeSectionIdx] || exam.sections[0];
  const partNum = (currentSection.idx ?? activeSectionIdx) + 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <ExamTopBar
        title={exam.title}
        category={exam.category}
        timeRemainingSeconds={timeRemaining}
        isSubmitted={isSubmitted}
        answeredCount={Object.keys(answers).length}
        totalQuestions={allQuestionIndices.length}
        estimatedBand={gradeSummary?.estimatedBand}
        onOpenScoreModal={() => setIsScoreModalOpen(true)}
        onSubmitExam={handleSubmitExam}
        onExit={handleExit}
      />

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanelV3
            sections={exam.sections}
            activeSectionIdx={activeSectionIdx}
            onSelectSection={setActiveSectionIdx}
          />
        </div>

        {/* Right Column: Questions Panel */}
        <div
          ref={rightPanelRef}
          className="w-1/2 h-full overflow-y-auto p-6 space-y-6 select-text"
        >
          {/* Section Heading */}
          <div className="pb-3 border-b-2 border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Part {partNum} Questions
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              {currentSection.title}
            </h3>
          </div>

          {/* Question Groups */}
          {currentSection.questionGroups &&
            currentSection.questionGroups.map((grp: InternalDeliveryQuestionGroup) => (
              <div key={grp.id} className="space-y-4">
                {/* Group Instruction Banner (Admin style) */}
                <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-200 text-xs text-slate-800 leading-relaxed font-sans shadow-xs">
                  <span className="font-bold text-[#2563EB] block mb-1">
                    Questions {grp.startIdx} – {grp.endIdx} Instructions:
                  </span>
                  {grp.instructionMd}
                </div>

                {grp.questions.map((q: InternalDeliveryQuestion) => {
                  const num = q.displayIdx ?? q.idx;
                  return (
                    <QuestionCardV3
                      key={q.id || num}
                      question={q}
                      mode={isSubmitted ? "review" : "exam"}
                      value={answers[num]}
                      isFlagged={flaggedIndices.includes(num)}
                      gradeResult={gradeSummary?.resultsByQuestion[num]}
                      onAnswerChange={(val: UserAnswerValue) => handleAnswerChange(num, val)}
                      onToggleFlag={() => handleToggleFlag(num)}
                    />
                  );
                })}
              </div>
            ))}

          {/* Root Section questions (outside groups) */}
          <div className="space-y-4">
            {currentSection.questions.map((q: InternalDeliveryQuestion) => {
              const num = q.displayIdx ?? q.idx;
              return (
                <QuestionCardV3
                  key={q.id || num}
                  question={q}
                  mode={isSubmitted ? "review" : "exam"}
                  value={answers[num]}
                  isFlagged={flaggedIndices.includes(num)}
                  gradeResult={gradeSummary?.resultsByQuestion[num]}
                  onAnswerChange={(val: UserAnswerValue) => handleAnswerChange(num, val)}
                  onToggleFlag={() => handleToggleFlag(num)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigator */}
      <QuestionNavigatorV3
        totalQuestions={allQuestionIndices.length}
        sections={exam.sections}
        mode={isSubmitted ? "review" : "exam"}
        activeIdx={activeQuestionIdx}
        answers={answers}
        flaggedIndices={flaggedIndices}
        answersByDisplayIdx={
          isSubmitted && gradeSummary
            ? Object.fromEntries(
                Object.entries(gradeSummary.resultsByQuestion).map(([k, r]: [string, QuestionGradeResult]) => [
                  k,
                  {
                    questionId: String(k),
                    sectionId: "",
                    idx: Number(k),
                    isCorrect: r.isCorrect,
                    selectedAnswerText: typeof r.userAnswer === "string" ? r.userAnswer : "",
                  },
                ])
              )
            : {}
        }
        onSelect={handleSelectQuestion}
      />

      {/* Score Modal */}
      <ScoreModalV3
        summary={gradeSummary}
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        onRetake={handleRetake}
      />
    </div>
  );
}
