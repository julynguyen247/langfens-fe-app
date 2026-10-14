"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import YouTubePlayer from "../components/listening/YouTubePlayer";
import QuestionPanel, { QuestionUiKind } from "../components/common/QuestionPanel";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useUserStore } from "@/stores/userStore";
import { useLoadingStore } from "@/stores/loading";
import Modal from "@/components/Modal";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";
import { buildAnswerPayload } from "@/lib/answerPayload";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import { submitAttempt } from "@/services/attempts";
import ReactMarkdown from "react-markdown";
import { Group, Panel } from "react-resizable-panels";

import { type QA } from "./shared";

export function ListeningScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const { setLoading } = useLoadingStore();

  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  const isSubmitting = useAttemptStore((s) => s.isSubmitting);
  const setIsSubmitting = useAttemptStore((s) => s.setIsSubmitting);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sections = useMemo(() => {
    const secs = attempt?.paper?.sections ?? [];
    return [...secs].sort((a: any, b: any) => a.idx - b.idx);
  }, [attempt?.paper?.sections]);

  const listeningSection = useMemo(() => {
    if (!sections.length) return null;
    return sections.find((s: any) => s.audioUrl) ?? sections[0];
  }, [sections]);

  const listeningAudioUrl = listeningSection?.audioUrl ?? "";

  const sectionOfQuestion = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sections as any[]) {
      for (const grp of s.questionGroups ?? []) {
        for (const q of grp.questions ?? []) {
          m.set(String(q.id), s.id);
        }
      }
    }
    return m;
  }, [sections]);

  const allQs = useMemo(() => {
    const flattened = (sections as any[]).flatMap((s) =>
      (s.questionGroups ?? []).flatMap((grp: any) => grp.questions ?? [])
    );
    const seen = new Set<string>();
    return flattened.filter((q: any) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }, [sections]);

  const listeningQs = useMemo(() => {
    const filtered = allQs.filter(
      (q) => String(q.skill ?? "").toLowerCase() === "listening"
    );
    return filtered.length ? filtered : allQs;
  }, [allQs]);

  const panelQuestions = useMemo(() => {
    return listeningQs
      .slice()
      .sort((a: any, b: any) => a.idx - b.idx)
      .map((q: any) => mapApiQuestionToUi(q));
  }, [listeningQs]);

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

  const lastAnswersRef = useRef<QA>({});

  const buildTextAnswer = (qid: string, value: string) => {
    if (!value) return undefined;
    const kind = questionUiKindMap[qid];
    if (kind === "forice_single" || kind === "forice_multiple")
      return undefined;
    return value;
  };

  const doSubmit = async () => {
    try {
      setIsSubmitting(true);
      setLoading(true);
      cancelAutoSave();

      try {
        await saveNow(
          lastAnswersRef.current,
          (qid) => sectionOfQuestion.get(qid),
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
        (qid) => sectionOfQuestion.get(qid),
        buildTextAnswer
      );
      await submitAttempt(attemptId, submitAnswers);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Submit failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Register doSubmit with the global store so the layout's TopBar Submit
  // button can flush the latest in-memory answers (autosave is 2s-debounced)
  // before the BE Submit. We use a ref to always invoke the latest closure
  // without re-registering on every render.
  const listeningDoSubmitRef = useRef(doSubmit);
  listeningDoSubmitRef.current = doSubmit;
  const setListeningSubmitHandler = useAttemptStore((s) => s.setSubmitHandler);
  useEffect(() => {
    const handler = () => listeningDoSubmitRef.current();
    setListeningSubmitHandler(attemptId, handler);
    return () => setListeningSubmitHandler(attemptId, undefined);
  }, [attemptId, setListeningSubmitHandler]);

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">No Listening data available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full max-h-full bg-[var(--background)] overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={50} minSize={30} className="overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden border-r-[2px] border-[var(--border)] bg-white z-20">
              {/* Audio header — chunky Duolingo card with LISTEN badge + title */}
              <div className="shrink-0 p-4 border-b-[2px] border-[var(--border-light)] bg-[var(--background)]">
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-[var(--skill-listening-light)] border-[2px] border-[var(--skill-listening-border)] flex items-center justify-center text-[var(--skill-listening)] font-bold text-xs tracking-wider"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    LISTEN
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Listening audio
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Press play, then answer the questions on the right.
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio player body — YouTube iframe or audio control */}
              <div className="shrink-0 p-4 pb-2 bg-[var(--background)]">
                <YouTubePlayer src={listeningAudioUrl} />
              </div>

              {/* Section instructions / transcript — scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4
                [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
                [&::-webkit-scrollbar-thumb]:rounded-full">
                {listeningSection?.passageMd && (
                  <div className="p-5 bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                    <div
                      className="prose prose-sm max-w-none
                  [&_h1]:text-[var(--foreground)] [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-4
                  [&_h2]:text-[var(--foreground)] [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-5 [&_h2]:mb-3
                  [&_h3]:text-[var(--foreground)] [&_h3]:font-bold [&_h3]:text-base
                  [&_p]:text-[var(--foreground)] [&_p]:leading-relaxed
                  [&_strong]:text-[var(--foreground)] [&_strong]:font-bold
                  [&_li]:text-[var(--foreground)] [&_li]:my-1
                  [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
                  [&_table]:text-[var(--foreground)] [&_table]:w-full
                  [&_th]:text-[var(--foreground)] [&_th]:font-bold [&_th]:text-left [&_th]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--background)]
                  [&_td]:text-[var(--foreground)] [&_td]:p-2 [&_td]:border [&_td]:border-[var(--border)]
                  [&_hr]:border-[var(--border)] [&_hr]:my-4"
                    >
                      <ReactMarkdown>
                        {listeningSection.passageMd}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <Panel defaultSize={50} minSize={30} className="overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden bg-[var(--background)] z-20">
              {/* Questions Header - matches reading layout */}
              <div className="px-6 py-4 bg-white border-b-[2px] border-[var(--border)] flex-shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full bg-[var(--skill-listening-light)] border-[2px] border-[var(--skill-listening-border)] flex items-center justify-center text-[var(--skill-listening)] font-bold text-xs"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Q
                  </div>
                  <h2
                    className="text-lg font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Questions
                  </h2>
                  {allQs.length > 0 &&
                    allQs.filter(
                      (q) =>
                        String(q.skill ?? "").toLowerCase() === "listening"
                    ).length === 0 && (
                      <div className="text-xs text-[var(--skill-writing)] font-bold">
                        All questions (no skill filter)
                      </div>
                    )}
                </div>
                <span
                  className="text-sm text-[var(--text-muted)] font-bold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {panelQuestions.length} questions
                </span>
              </div>

              {/* Questions List */}
              <div
                className="flex-1 overflow-auto p-4 lg:p-6 scroll-smooth
                [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
                [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                {panelQuestions.length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)] font-bold text-center py-10">
                    No questions to display.
                  </div>
                ) : (
                  <QuestionPanel
                    attemptId={attemptId}
                    skill="listening"
                    questions={panelQuestions}
                    questionGroups={listeningSection?.questionGroups}
                    onAnswersChange={(next) => {
                      lastAnswersRef.current = {
                        ...lastAnswersRef.current,
                        ...(next as QA),
                      };
                      debouncedSave(
                        next as QA,
                        (qid) => sectionOfQuestion.get(qid),
                        buildTextAnswer
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Listening Submission"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2.5 rounded-full border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold text-sm hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                doSubmit();
              }}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-body)]">
          Are you sure you want to submit your Listening answers? You cannot change them afterwards.
        </p>
      </Modal>
    </>
  );
}
