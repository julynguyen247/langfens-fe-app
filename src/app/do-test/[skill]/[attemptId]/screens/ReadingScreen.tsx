"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PassageView from "../components/reading/PassageView";
import QuestionPanel, { Question as UiQuestion, QuestionUiKind } from "../components/common/QuestionPanel";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useUserStore } from "@/stores/userStore";
import { useLoadingStore } from "@/stores/loading";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";
import { buildAnswerPayload } from "@/lib/answerPayload";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import { submitAttempt } from "@/services/attempts";
import { Group, Panel } from "react-resizable-panels";
import type { RagFeedbackEnvelope } from "@/types/rag";

import { type QA } from "./shared";

export function ReadingScreen({
  attemptId,
  isReviewMode = false,
  reviewData = [],
  initialAnswers = {},
}: {
  attemptId: string;
  isReviewMode?: boolean;
  reviewData?: Array<{ questionId: string; isCorrect: boolean | null; correctAnswer?: string; explanation?: string; ragFeedback?: RagFeedbackEnvelope }>;
  initialAnswers?: Record<string, string>;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useUserStore();
  const { setLoading } = useLoadingStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  const lastAnswersRef = useRef<QA>(initialAnswers);

  const sections = useMemo(() => {
    const secs = attempt?.paper?.sections ?? [];
    return [...secs].sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0));
  }, [attempt?.paper?.sections]);

  const secFromUrl = sp.get("sec");
  const activeSec = sections.find((s) => s.id === secFromUrl) ?? sections[0];

  const activeSecIndex = sections.findIndex((s) => s.id === activeSec?.id);
  const questionsBefore = useMemo(() => {
    if (activeSecIndex <= 0) return 0;
    return sections.slice(0, activeSecIndex).reduce((total, sec) => {
      const qs = (sec.questionGroups ?? []).flatMap((g: any) => g.questions ?? []);
      return total + qs.length;
    }, 0);
  }, [sections, activeSecIndex]);

  const panelQuestions = useMemo<UiQuestion[]>(() => {
    const allQuestions = (activeSec?.questionGroups ?? []).flatMap(
      (grp) => grp.questions ?? []
    );
    const seen = new Set<string>();
    const uniqueQuestions = allQuestions.filter((q: any) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
    return uniqueQuestions.map((q: any, idxInSec: number) => {
      const continuousIdx = questionsBefore + idxInSec + 1;
      return mapApiQuestionToUi({
        ...q,
        idx: continuousIdx,
      });
    });
  }, [activeSec, questionsBefore]);

  const questionUiKindMap = useMemo(() => {
    const m: Record<string, QuestionUiKind> = {};
    for (const q of panelQuestions) m[String(q.id)] = q.uiKind;
    return m;
  }, [panelQuestions]);

  const {
    run: debouncedSave,
    cancel: cancelAutoSave,
    saveNow,
  } = useDebouncedAutoSave(user?.id, attemptId);

  const buildTextAnswer = (qid: string, value: string) => {
    if (!value) return undefined;
    const kind = questionUiKindMap[qid];
    if (kind === "forice_single" || kind === "forice_multiple")
      return undefined;
    return value;
  };

  const isSubmitting = useAttemptStore((s) => s.isSubmitting);
  const setIsSubmitting = useAttemptStore((s) => s.setIsSubmitting);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!attempt?.paper) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">Loading test paper...</p>
      </div>
    );
  }

  const doSubmit = async () => {
    if (!activeSec?.id) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      cancelAutoSave();

      try {
        await saveNow(
          lastAnswersRef.current,
          () => activeSec.id,
          buildTextAnswer
        );
      } catch (e) {
        console.warn(
          "Autosave before submit failed, continuing with submit:",
          e
        );
      }

      // Build the submit payload from the same answer map (defensive — the BE
      // already has the answers via autosave, but we also send them inline so
      // a missed autosave doesn't silently drop the user's selection). Use
      // the same payload builder as the autosave path so MCQ UUIDs end up in
      // `selectedOptionIds` (and only completion-style answers land in
      // `textAnswer`).
      const { answers: submitAnswers } = buildAnswerPayload(
        lastAnswersRef.current,
        () => activeSec.id,
        buildTextAnswer
      );
      await submitAttempt(attemptId, submitAnswers);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Nộp bài thất bai. Vui lòng thử lai.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Register doSubmit with the global store so the layout's TopBar Submit
  // button can flush the latest in-memory answers (autosave is 2s-debounced)
  // before the BE Submit. We use a ref to always invoke the latest closure
  // without re-registering on every render.
  const doSubmitRef = useRef(doSubmit);
  doSubmitRef.current = doSubmit;
  const setSubmitHandler = useAttemptStore((s) => s.setSubmitHandler);
  useEffect(() => {
    const handler = () => doSubmitRef.current();
    setSubmitHandler(attemptId, handler);
    return () => setSubmitHandler(attemptId, undefined);
  }, [attemptId, setSubmitHandler]);

  if (!attempt || !activeSec) {
    return (
      <div className="p-6 text-sm text-[var(--text-muted)]">
        No Reading data available.
      </div>
    );
  }

  const testTitle = activeSec?.title || attempt?.paper?.title || "Reading Test";
  const totalQuestions = panelQuestions.length;

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");

  // Passage content component
  const passageContent = (
    <div className="h-full overflow-hidden bg-white">
      <PassageView
        passage={{
          title: testTitle,
          content: activeSec?.passageMd || "",
        }}
        imageUrl={attempt?.paper?.imageUrl}
        attemptId={attemptId}
        sectionId={activeSec?.id}
      />
    </div>
  );

  // Questions content component
  const questionsContent = (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Questions Header - Desktop only */}
      <div className="hidden lg:block px-6 py-4 bg-white border-b-[2px] border-[var(--border)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2
            className="font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isReviewMode ? "Questions - Review Mode" : "Questions"}
          </h2>
          <span className="text-sm text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            {totalQuestions} questions
          </span>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-auto p-4 lg:p-6
        [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
        [&::-webkit-scrollbar-thumb]:rounded-full
      ">
        <QuestionPanel
          attemptId={attemptId}
          skill="reading"
          questions={panelQuestions}
          questionGroups={activeSec?.questionGroups}
          initialAnswers={isReviewMode ? initialAnswers : undefined}
          isReviewMode={isReviewMode}
          reviewData={reviewData}
          onAnswersChange={isReviewMode ? undefined : (next) => {
            lastAnswersRef.current = {
              ...lastAnswersRef.current,
              ...(next as QA),
            };
            debouncedSave(
              next as QA,
              () => activeSec.id,
              buildTextAnswer
            );
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex bg-white border-b-[3px] border-[var(--border)] flex-shrink-0">
        <button
          onClick={() => setMobileTab("passage")}
          className={`flex-1 py-3 px-4 text-sm font-bold transition-all duration-150 relative ${
            mobileTab === "passage"
              ? "text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Passage
          {mobileTab === "passage" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--primary)] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-3 px-4 text-sm font-bold transition-all duration-150 relative ${
            mobileTab === "questions"
              ? "text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
          }`}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Questions ({totalQuestions})
          {mobileTab === "questions" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--primary)] rounded-full" />
          )}
        </button>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden flex-1 overflow-hidden">
        {mobileTab === "passage" ? passageContent : questionsContent}
      </div>

      {/* Desktop Split View */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={55} minSize={35} className="overflow-hidden">
            <div className="h-full border-r-[2px] border-[var(--border)]">
              {passageContent}
            </div>
          </Panel>

          <Panel defaultSize={45} minSize={30} className="overflow-hidden">
            {questionsContent}
          </Panel>
        </Group>
      </div>
    </div>
  );
}
