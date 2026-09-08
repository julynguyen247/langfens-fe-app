"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitAttempt } from "@/utils/api";
import {
  useDebouncedAutoSave,
  buildAnswerPayload,
} from "@/app/utils/hook";
import { useUserStore } from "@/app/store/userStore";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import {
  InternalDeliveryExam,
  QuestionType,
  type InternalDeliverySection,
  type InternalDeliveryQuestion,
  UserAnswerValue,
} from "../_lib/types";
import { TopBar } from "./TopBar";
import { PassagePanel } from "./PassagePanel";
import { QuestionCard } from "./QuestionCard";
import { QuestionNavigator } from "./QuestionNavigator";

/**
 * Convert a `UserAnswerValue` (string | string[] | Record<string, string>) into
 * the `string` shape that `buildAnswerPayload` understands.
 */
function answerValueToString(value: UserAnswerValue): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(String));
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value ?? "");
}

/** Convert per-question answers (keyed by displayIdx) to UUID-keyed QA map. */
function buildQAMap(
  answers: Record<number, UserAnswerValue>,
  idxToQid: Record<number, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [idxStr, value] of Object.entries(answers)) {
    const idx = Number(idxStr);
    const qid = idxToQid[idx];
    if (!qid) continue;
    out[qid] = answerValueToString(value);
  }
  return out;
}

/**
 * TestV2Runner — the test-v2 paper-taking UI (TopBar + PassagePanel on left,
 * QuestionCards on right, QuestionNavigator on bottom) repackaged as a
 * reusable component. Reads the started-attempt snapshot from the global
 * `useAttemptStore.byId[attemptId]` instead of calling `startAttempt` itself,
 * because the user lands here AFTER the start page has already initialised
 * the attempt.
 */
export function TestV2Runner({ attemptId }: { attemptId: string }) {
  const router = useRouter();

  const user = useUserStore((s) => s.user);
  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const setSubmitHandler = useAttemptStore((s) => s.setSubmitHandler);

  // Active section tab index
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // User state
  const [answers, setAnswers] = useState<Record<number, UserAnswerValue>>({});
  const [flaggedIndices, setFlaggedIndices] = useState<number[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);

  // Submission flag (true while submit-in-flight or post-submit)
  const [isSubmitted, setIsSubmitted] = useState(false);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  const exam = (attempt?.paper as InternalDeliveryExam | undefined) ?? null;
  const startedAt = attempt?.startedAt ?? null;
  const durationSec =
    typeof attempt?.durationSec === "number"
      ? attempt.durationSec
      : typeof exam?.durationMin === "number"
        ? exam.durationMin * 60
        : null;

  // Dedupe sections: legacy PaperJson snapshots can contain duplicated sections
  // (e.g. when a backend merge bug appended instead of replacing repeated fields).
  // Dedup by Idx+Title to keep deterministic ordering while dropping repeats.
  const dedupedSections = useMemo(() => {
    const sections = exam?.sections ?? [];
    const seen = new Set<string>();
    const out: InternalDeliverySection[] = [];
    for (const sec of sections) {
      const key = `${sec.idx ?? "x"}-${sec.title ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(sec);
    }
    return out;
  }, [exam]);

  // Client-side countdown (display only — backend tracks authoritative timer)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Build qid <-> idx maps + question type lookup from loaded paper snapshot.
  const { idxToQid, qidToType, qidToSectionId } = useMemo(() => {
    const idxMap: Record<number, string> = {};
    const typeMap: Record<string, string> = {};
    const secMap: Record<string, string> = {};
    if (exam) {
      const walk = (sec: InternalDeliverySection) => {
        const sectionId = sec.id;
        const handle = (q: InternalDeliveryQuestion) => {
          const num = q.displayIdx ?? q.idx;
          if (q.id) {
            idxMap[num] = q.id;
            typeMap[q.id] = q.type;
            if (sectionId) secMap[q.id] = sectionId;
          }
        };
        for (const q of sec.questions || []) handle(q);
        for (const g of sec.questionGroups || []) {
          for (const q of g.questions || []) handle(q);
        }
      };
      for (const sec of exam.sections || []) walk(sec);
    }
    return { idxToQid: idxMap, qidToType: typeMap, qidToSectionId: secMap };
  }, [exam]);

  // All question indices across entire exam (1, 2, 3 ... N)
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

  // Resolver: sectionId for a given question UUID.
  const buildSectionId = useCallback(
    (qid: string): string | undefined => qidToSectionId[qid],
    [qidToSectionId]
  );

  // Resolver: textAnswer for a given question UUID + value string.
  // For MCQ-family types, the value is one or more option UUIDs and the
  // backend uses `selectedOptionIds`; return undefined so the builder routes
  // it through selectedOptionIds. For all other types (completion,
  // short-answer, matching, etc.) return the value as-is.
  const buildTextAnswer = useCallback(
    (qid: string, value: string): string | undefined => {
      if (!value) return undefined;
      const type = qidToType[qid];
      if (
        type === QuestionType.MultipleChoiceSingle ||
        type === QuestionType.MultipleChoiceSingleImage ||
        type === QuestionType.MultipleChoiceMultiple
      ) {
        return undefined;
      }
      return value;
    },
    [qidToType]
  );

  // Debounced autosave hook (2s debounce).
  const {
    run: debouncedSave,
    saveNow,
    cancel: cancelAutoSave,
  } = useDebouncedAutoSave(user?.id ?? undefined, attemptId);

  // Track the latest answers for the submit handler (which fires after render).
  const answersRef = useRef<Record<number, UserAnswerValue>>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Handle answering — autosave via debounced hook.
  const handleAnswerChange = (qIdx: number, val: UserAnswerValue) => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const next = { ...prev, [qIdx]: val };
      if (attemptId) {
        const qaMap = buildQAMap(next, idxToQid);
        debouncedSave(qaMap, buildSectionId, buildTextAnswer);
      }
      return next;
    });
  };

  // Toggle question flag
  const handleToggleFlag = (qIdx: number) => {
    setFlaggedIndices((prev) =>
      prev.includes(qIdx) ? prev.filter((i) => i !== qIdx) : [...prev, qIdx]
    );
  };

  // Flush pending answers and submit. Idempotent — only the first call lands.
  const doSubmit = useCallback(async (): Promise<boolean> => {
    if (isSubmitted) return true;
    setIsSubmitted(true);
    try {
      cancelAutoSave();
      const qaMap = buildQAMap(answersRef.current, idxToQid);
      try {
        await saveNow(qaMap, buildSectionId, buildTextAnswer);
      } catch (e) {
        // Autosave failure shouldn't block submit — the inline answers below
        // carry the latest state.
        console.warn("Autosave before submit failed:", e);
      }
      const { answers: submitAnswers } = buildAnswerPayload(
        qaMap,
        buildSectionId,
        buildTextAnswer
      );
      await submitAttempt(attemptId, submitAnswers);
      return true;
    } catch (e) {
      console.error("Submit failed:", e);
      setIsSubmitted(false);
      return false;
    }
  }, [
    isSubmitted,
    attemptId,
    cancelAutoSave,
    saveNow,
    idxToQid,
    buildSectionId,
    buildTextAnswer,
  ]);

  // Client-side countdown (display only — backend tracks authoritative timer)
  useEffect(() => {
    if (!startedAt || !durationSec) return;
    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return;
    const elapsedMs = Date.now() - startMs;
    const remaining = Math.max(0, durationSec - Math.floor(elapsedMs / 1000));
    setTimeRemaining(remaining);
    if (isSubmitted || remaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitted) {
            // Time's up — best-effort submit, then redirect.
            handleSubmitExam();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationSec, isSubmitted]);

  // Submit handler wired into useAttemptStore so any external Submit trigger
  // (e.g. layout buttons) can flush-then-submit.
  const doSubmitRef = useRef(doSubmit);
  doSubmitRef.current = doSubmit;
  useEffect(() => {
    const handler = async () => {
      const ok = await doSubmitRef.current();
      if (ok) {
        router.replace(`/attempts/${attemptId}`);
      }
    };
    setSubmitHandler(attemptId, handler);
    return () => setSubmitHandler(attemptId, undefined);
  }, [attemptId, setSubmitHandler, router]);

  const handleSubmitExam = useCallback(async (): Promise<void> => {
    if (!exam) return;
    if (!isSubmitted) {
      const unansweredCount =
        allQuestionIndices.length - Object.keys(answersRef.current).length;
      if (unansweredCount > 0) {
        if (
          typeof window !== "undefined" &&
          !window.confirm(
            `You still have ${unansweredCount} unanswered questions. Submit exam now?`
          )
        ) {
          return;
        }
      }
    }
    const ok = await doSubmit();
    if (ok && attemptId) {
      router.replace(`/attempts/${attemptId}`);
    }
  }, [exam, isSubmitted, allQuestionIndices, doSubmit, attemptId, router]);

  // Navigation jumping
  const handleSelectQuestion = (qIdx: number) => {
    if (!exam) return;

    // Find which section contains this question
    const secIndex = exam.sections.findIndex((sec) => {
      const inMain = (sec.questions || []).some(
        (q) => (q.displayIdx ?? q.idx) === qIdx
      );
      const inGroup = (sec.questionGroups || []).some((g) =>
        (g.questions || []).some((q) => (q.displayIdx ?? q.idx) === qIdx)
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
      typeof window !== "undefined" &&
      !isSubmitted &&
      !window.confirm("Are you sure you want to leave the test? Your latest answers will be saved.")
    ) {
      return;
    }
    // Best-effort: flush a final autosave before leaving so the in-flight
    // answers land on the server.
    if (!isSubmitted && attemptId) {
      const qaMap = buildQAMap(answersRef.current, idxToQid);
      saveNow(qaMap, buildSectionId, buildTextAnswer).catch(() => {
        // ignore — answers were autosaved on each change
      });
    }
    router.replace(`/history`);
  };

  if (!attempt || !exam) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-800 font-sans">
        <p className="text-sm font-bold text-slate-600 mb-4">
          Test session not found. If you refreshed, please go back and start again.
        </p>
        <Link
          href="/history"
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          Back to History
        </Link>
      </div>
    );
  }

  const currentSection = dedupedSections[activeSectionIdx] || dedupedSections[0];
  const displayTime = timeRemaining ?? durationSec ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Bar */}
      <TopBar
        title={exam.title}
        category={exam.category}
        timeRemainingSeconds={displayTime}
        isSubmitted={isSubmitted}
        answeredCount={Object.keys(answers).length}
        totalQuestions={allQuestionIndices.length}
        onSubmitExam={handleSubmitExam}
        onExit={handleExit}
      />

      {/* Main Split Screen (Passage on Left, Questions on Right) */}
      <div className="flex-1 pt-16 pb-16 flex overflow-hidden min-h-0">
        {/* Left Column: Passage Panel */}
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanel
            sections={dedupedSections}
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
                {(grp.questions ?? []).map((q) => {
                  const num = q.displayIdx ?? q.idx;
                  return (
                    <QuestionCard
                      key={q.id || num}
                      question={q}
                      value={answers[num]}
                      isFlagged={flaggedIndices.includes(num)}
                      isReview={isSubmitted}
                      onAnswerChange={(val) => handleAnswerChange(num, val)}
                      onToggleFlag={() => handleToggleFlag(num)}
                    />
                  );
                })}
              </div>
            ))}

          {/* Section root questions (ungrouped) */}
          <div className="space-y-4">
            {(currentSection.questions ?? []).map((q) => {
              const num = q.displayIdx ?? q.idx;
              return (
                <QuestionCard
                  key={q.id || num}
                  question={q}
                  value={answers[num]}
                  isFlagged={flaggedIndices.includes(num)}
                  isReview={isSubmitted}
                  onAnswerChange={(val) => handleAnswerChange(num, val)}
                  onToggleFlag={() => handleToggleFlag(num)}
                />
              );
            })}
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
        onSelectQuestion={handleSelectQuestion}
        onToggleFlag={handleToggleFlag}
      />
    </div>
  );
}

export default TestV2Runner;
