"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Group, Panel } from "react-resizable-panels";
import ReactMarkdown from "react-markdown";
import AudioPlayer from "@/features/exam/components/AudioPlayer";
import QuestionPanel from "@/features/exam/components/QuestionPanel";
import { normalizeExamPaper, sectionQuestions } from "@/features/exam/contract";
import { useExamSession } from "@/features/exam/useExamSession";
import type { InternalDeliveryExam } from "@/features/exam/types";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useLoadingStore } from "@/stores/loading";

export function ListeningScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const attempt = useAttemptStore(s => s.byId[attemptId]);
  const setSubmitHandler = useAttemptStore(s => s.setSubmitHandler);
  const setIsSubmitting = useAttemptStore(s => s.setIsSubmitting);
  const setLoading = useLoadingStore(s => s.setLoading);
  const paper = useMemo(() => attempt?.paper ? normalizeExamPaper(attempt.paper as unknown as InternalDeliveryExam) : null, [attempt?.paper]);
  const questions = useMemo(() => paper?.sections.flatMap(sectionQuestions) ?? [], [paper]);
  const panelQuestions = questions;
  const session = useExamSession(attemptId, questions);
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
  if (!paper || !session.ready) return <p role="status" className="p-6">Loading test and saved answers...</p>;
  return (
    <div className="h-full w-full overflow-hidden bg-[var(--background)]">
      <Group orientation="horizontal">
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full overflow-auto border-r-2 border-[var(--border)] bg-white p-4 space-y-5">
            <h1 className="font-bold">Listening audio</h1>
            {paper.sections.map((section, index) => <section key={section.id ?? index} className="space-y-3">
              <h2 className="font-semibold">{section.title || `Part ${index + 1}`}</h2>
              {section.audioUrl && <AudioPlayer src={section.audioUrl} />}
              {section.passageMd && <div className="prose prose-sm max-w-none"><ReactMarkdown>{section.passageMd}</ReactMarkdown></div>}
            </section>)}
          </div>
        </Panel>
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex shrink-0 justify-between bg-white border-b-2 border-[var(--border)] px-6 py-4"><h2 className="font-bold">Questions</h2><span className="text-sm">{panelQuestions.length} questions</span></div>
            <div className="flex-1 min-h-0 overflow-auto p-4 lg:p-6"><QuestionPanel attemptId={attemptId} skill="listening" questions={panelQuestions} questionGroups={paper.sections.flatMap(s => s.questionGroups ?? [])} answers={session.answers} onAnswersChange={session.changeAnswers} /></div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
