"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExamDelivery } from "@/app/admin/_lib/adminApi";
import {
  ExamGradeSummary,
  InternalDeliveryExam,
  InternalDeliveryQuestion,
  UserAnswerValue,
} from "../_lib/types";
import { gradeExamPaper } from "../_lib/grader";
import { TopBar } from "../_components/TopBar";
import { PassagePanel } from "../_components/PassagePanel";
import { QuestionCard } from "../_components/QuestionCard";
import { QuestionNavigator } from "../_components/QuestionNavigator";
import { ScoreModal } from "../_components/ScoreModal";

function extractError(err: unknown): string {
  if (err && typeof err === "object") {
    if ("response" in err && err.response && typeof err.response === "object") {
      const resp = err.response;
      if ("data" in resp && resp.data && typeof resp.data === "object") {
        const data = resp.data;
        if ("message" in data && typeof data.message === "string") {
          return data.message;
        }
      }
    } else if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "Failed to load test paper";
}

export default function TestV2ExamPage({
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
        const data = await getExamDelivery(examId, true);
        if (!data) throw new Error("Exam payload empty or not found");

        setExam(data);
        const durationSeconds = (data.durationMin || 60) * 60;
        setTimeRemaining(durationSeconds);
      } catch (err: unknown) {
        setError(extractError(err));
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

  // All question indices across entire exam
  const allQuestionIndices = useMemo(() => {
    if (!exam) return [];
    const list: number[] = [];
    for (const sec of exam.sections || []) {
      for (const q of sec.questions || []) {
        list.push(q.idx);
      }
      for (const grp of sec.questionGroups || []) {
        for (const q of grp.questions || []) {
          if (!list.includes(q.idx)) {
            list.push(q.idx);
          }
        }
      }
    }
    return list.sort((a, b) => a - b);
  }, [exam]);

  // Handle answering
  const handleAnswerChange = (qIdx: number, val: UserAnswerValue) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  // Toggle question flag
  const handleToggleFlag = (qIdx: number) => {
    setFlaggedIndices((prev) =>
      prev.includes(qIdx) ? prev.filter((i) => i !== qIdx) : [...prev, qIdx]
    );
  };

  // Submit and grade
  const handleSubmitExam = () => {
    if (!exam) return;

    if (!isSubmitted) {
      const unansweredCount =
        allQuestionIndices.length - Object.keys(answers).length;
      if (unansweredCount > 0) {
        if (
          !window.confirm(
            `You still have ${unansweredCount} unanswered questions. Submit exam now?`
          )
        ) {
          return;
        }
      }
    }

    const summary = gradeExamPaper(exam, answers);
    setGradeSummary(summary);
    setIsSubmitted(true);
    setIsScoreModalOpen(true);
  };

  // Retake
  const handleRetake = () => {
    if (!exam) return;
    setAnswers({});
    setFlaggedIndices([]);
    setIsSubmitted(false);
    setGradeSummary(null);
    setIsScoreModalOpen(false);
    setTimeRemaining((exam.durationMin || 60) * 60);
    setActiveSectionIdx(0);
  };

  // Navigation jumping
  const handleSelectQuestion = (qIdx: number) => {
    if (!exam) return;

    // Find which section contains this question
    const secIndex = exam.sections.findIndex((sec) => {
      const inMain = (sec.questions || []).some((q) => q.idx === qIdx);
      const inGroup = (sec.questionGroups || []).some((g) =>
        (g.questions || []).some((q) => q.idx === qIdx)
      );
      return inMain || inGroup;
    });

    if (secIndex >= 0 && secIndex !== activeSectionIdx) {
      setActiveSectionIdx(secIndex);
    }

    setActiveQuestionIdx(qIdx);

    // Smooth scroll to card
    setTimeout(() => {
      const el = document.getElementById(`q-${qIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleExit = () => {
    if (
      !isSubmitted &&
      !window.confirm("Are you sure you want to leave the test? Progress will not be saved.")
    ) {
      return;
    }
    router.push("/admin/exams");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium tracking-wide text-slate-400">
          Loading exam delivery paper...
        </p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-center space-y-4">
          <h2 className="text-lg font-bold text-rose-400">Failed to load exam</h2>
          <p className="text-xs text-slate-400">{error || "Exam not found"}</p>
          <Link
            href="/admin/exams"
            className="inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  const currentSection = exam.sections[activeSectionIdx] || exam.sections[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Bar */}
      <TopBar
        title={exam.title}
        category={exam.category}
        timeRemainingSeconds={timeRemaining}
        isSubmitted={isSubmitted}
        estimatedBand={gradeSummary?.estimatedBand}
        totalScore={gradeSummary?.totalScore}
        maxScore={gradeSummary?.maxScore}
        answeredCount={Object.keys(answers).length}
        totalQuestions={allQuestionIndices.length}
        onOpenScoreModal={() => setIsScoreModalOpen(true)}
        onSubmitExam={handleSubmitExam}
        onExit={handleExit}
      />

      {/* Main Split Screen (Passage on Left, Questions on Right) */}
      <div className="flex-1 pt-16 pb-16 flex overflow-hidden min-h-0">
        {/* Left Column: Passage Panel */}
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanel
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
          {/* Section Questions Header */}
          <div className="pb-4 border-b-2 border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Part {currentSection.idx + 1} Questions
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              {currentSection.title}
            </h3>
          </div>

          {/* Question Groups Instructions if any */}
          {currentSection.questionGroups &&
            currentSection.questionGroups.map((grp) => (
              <div key={grp.id} className="space-y-4">
                <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 text-xs text-slate-800 leading-relaxed font-sans shadow-xs">
                  <span className="font-bold text-[#2563EB] block mb-1">
                    Questions {grp.startIdx} – {grp.endIdx} Instructions:
                  </span>
                  {grp.instructionMd}
                </div>

                {/* Group questions */}
                {grp.questions.map((q) => (
                  <QuestionCard
                    key={q.id || q.idx}
                    question={q}
                    value={answers[q.idx]}
                    isFlagged={flaggedIndices.includes(q.idx)}
                    isReview={isSubmitted}
                    gradeResult={gradeSummary?.resultsByQuestion[q.idx]}
                    onAnswerChange={(val) => handleAnswerChange(q.idx, val)}
                    onToggleFlag={() => handleToggleFlag(q.idx)}
                  />
                ))}
              </div>
            ))}

          {/* Section root questions (ungrouped) */}
          <div className="space-y-4">
            {currentSection.questions.map((q) => (
              <QuestionCard
                key={q.id || q.idx}
                question={q}
                value={answers[q.idx]}
                isFlagged={flaggedIndices.includes(q.idx)}
                isReview={isSubmitted}
                gradeResult={gradeSummary?.resultsByQuestion[q.idx]}
                onAnswerChange={(val) => handleAnswerChange(q.idx, val)}
                onToggleFlag={() => handleToggleFlag(q.idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Question Navigator */}
      <QuestionNavigator
        questionIndices={allQuestionIndices}
        answers={answers}
        flaggedIndices={flaggedIndices}
        activeQuestionIdx={activeQuestionIdx}
        isSubmitted={isSubmitted}
        gradeResults={gradeSummary?.resultsByQuestion}
        onSelectQuestion={handleSelectQuestion}
        onToggleFlag={handleToggleFlag}
      />

      {/* Score Modal */}
      <ScoreModal
        summary={gradeSummary}
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        onRetake={handleRetake}
      />
    </div>
  );
}
