"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Group, Panel } from "react-resizable-panels";
import PassageView from "@/features/exam/components/PassageView";
import QuestionPanel from "@/features/exam/components/QuestionPanel";
import { normalizeExamPaper, sectionQuestions } from "@/features/exam/contract";
import { useExamSession } from "@/features/exam/useExamSession";
import type { InternalDeliveryExam } from "@/features/exam/types";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useLoadingStore } from "@/stores/loading";

export function ReadingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const attempt = useAttemptStore(s => s.byId[attemptId]);
  const setSubmitHandler = useAttemptStore(s => s.setSubmitHandler);
  const setIsSubmitting = useAttemptStore(s => s.setIsSubmitting);
  const setLoading = useLoadingStore(s => s.setLoading);
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");
  const paper = useMemo(() => attempt?.paper ? normalizeExamPaper(attempt.paper as unknown as InternalDeliveryExam) : null, [attempt?.paper]);
  const questions = useMemo(() => paper?.sections.flatMap(sectionQuestions) ?? [], [paper]);
  const session = useExamSession(attemptId, questions);
  const activeSection = paper?.sections.find(s => s.id === search.get("sec")) ?? paper?.sections[0];
  const panelQuestions = useMemo(() => activeSection ? sectionQuestions(activeSection) : [], [activeSection]);
  const doSubmit = useCallback(async () => {
    setIsSubmitting(true); setLoading(true);
    try {
      await session.submit();
      router.replace(`/attempts/${attemptId}`);
    } finally { setIsSubmitting(false); setLoading(false); }
  }, [session.submit, attemptId, router, setLoading, setIsSubmitting]);
  useEffect(() => {
    setSubmitHandler(attemptId, session.ready && !session.error ? doSubmit : undefined);
    return () => setSubmitHandler(attemptId, undefined);
  }, [attemptId, session.ready, session.error, doSubmit, setSubmitHandler]);

  if (session.error) return <p role="alert" className="p-6 text-red-600">{session.error}</p>;
  if (!paper || !activeSection || !session.ready) return <p role="status" className="p-6">Loading test and saved answers...</p>;
  const title = activeSection.title || paper.title;
  const passageContent = <div className="h-full overflow-hidden bg-white"><PassageView passage={{ title, content: activeSection.passageMd ?? "" }} imageUrl={paper.imageUrl ?? undefined} attemptId={attemptId} sectionId={activeSection.id} /></div>;
  const questionsContent = (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
      <div className="hidden lg:flex items-center justify-between bg-white border-b-2 border-[var(--border)] px-6 py-4"><h2 className="font-bold">Questions</h2><span className="text-sm">{panelQuestions.length} questions</span></div>
      <div className="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
        <QuestionPanel attemptId={attemptId} skill="reading" questions={panelQuestions} questionGroups={activeSection.questionGroups} answers={session.answers} onAnswersChange={session.changeAnswers} />
      </div>
    </div>
  );
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="lg:hidden flex border-b-2 border-[var(--border)] bg-white">
        {(["passage", "questions"] as const).map(tab => <button key={tab} type="button" onClick={() => setMobileTab(tab)} aria-pressed={mobileTab === tab} className={`flex-1 px-4 py-3 font-bold ${mobileTab === tab ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>{tab === "passage" ? "Passage" : `Questions (${panelQuestions.length})`}</button>)}
      </div>
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden">{mobileTab === "passage" ? passageContent : questionsContent}</div>
      <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
        <Group orientation="horizontal"><Panel defaultSize={55} minSize={35}><div className="h-full border-r-2 border-[var(--border)]">{passageContent}</div></Panel><Panel defaultSize={45} minSize={30}>{questionsContent}</Panel></Group>
      </div>
    </div>
  );
}
