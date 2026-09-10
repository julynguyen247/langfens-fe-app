"use client";

import VoiceWaveAnimation from "@/components/VoiceWaveAnimation";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PassageView from "./components/reading/PassageView";
import YouTubePlayer from "./components/listening/YouTubePlayer";
import QuestionPanel, {
  QuestionUiKind,
} from "./components/common/QuestionPanel";
import type { Question as UiQuestion } from "@/types/question.type";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import { useLoadingStore } from "@/app/store/loading";
import Modal from "@/components/Modal";
import { useDebouncedAutoSave, buildAnswerPayload } from "@/app/utils/hook";
import { deriveUiKind, isWordListBlank } from "@/lib/deriveUiKind";
import { useReactMediaRecorder } from "react-media-recorder";
import {
  getSpeakingExamsById,
  getWritingExamById,
  gradeSpeaking,
  gradeWriting,
  submitAttempt,
} from "@/utils/api";
import ReactMarkdown from "react-markdown";
import { Group, Panel, Separator } from "react-resizable-panels";
import { motion } from "framer-motion";
import WritingAssistRail from "./components/writing/WritingAssistRail";
import type { RagFeedbackEnvelope } from "@/types/rag";
import { TestV2Runner } from "./_components/TestV2Runner";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

type Skill = "reading" | "listening" | "writing" | "speaking";
type QA = Record<string, string>;

/**
 * Local Question builder — replaces the deleted `mapApiQuestionToUi`
 * wrapper. Uses the canonical `deriveUiKind` + `isWordListBlank`
 * helpers from `@/lib/deriveUiKind`. The MATCHING_INFORMATION
 * sub-dispatch (matching_information vs matching_paragraph) lives
 * inline here.
 */
function buildQuestion(q: any): UiQuestion {
  const uiKind =
    q.type === "MATCHING_INFORMATION"
      ? isWordListBlank(q.promptMd ?? "")
        ? "matching_information"
        : "matching_paragraph"
      : deriveUiKind(q.type);

  const base: UiQuestion = {
    id: q.id,
    idx: q.idx,
    stem: q.promptMd,
    backendType: q.type,
    uiKind,
    explanationMd: q.explanationMd,
    imageUrl: q.imageUrl ?? null,
    modelAnswers: q.modelAnswers ?? null,
    wordList: q.wordList ?? null,
    groupId: q.groupId ?? null,
  };

  if (uiKind === "forice_single" || uiKind === "forice_multiple") {
    return {
      ...base,
      forices: (q.options ?? []).map((opt: any) => ({
        value: opt.id,
        label: String(opt.contentMd).replace(/^[A-Z]\.\s+/, ""),
      })),
    };
  }

  if (uiKind === "flow_chart") {
    return { ...base, flowChartNodes: q.flowChartNodes ?? [] };
  }

  if (uiKind === "matching_heading" && q.options?.length) {
    return {
      ...base,
      forices: q.options.map((opt: any) => ({
        value: String(opt.contentMd).split(".")[0].trim(),
        label: opt.contentMd,
      })),
    };
  }

  return base;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(
    url
  );
}

function getYouTubeId(url: string) {
  try {
    const m1 = url.match(/youtu\.be\/([^?]+)/);
    if (m1?.[1]) return m1[1];

    const m2 = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (m2?.[1]) return m2[1];

    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return v;
  } catch {}
  return "";
}

function AudioBar({ src }: { src: string }) {
  if (!src) {
    return (
      <div className="text-xs text-[var(--skill-writing)] font-bold p-3">No audio URL available for this test.</div>
    );
  }

  if (isYouTubeUrl(src)) {
    const id = getYouTubeId(src);
    if (!id) {
      return (
        <div className="text-xs text-[var(--destructive)] font-bold p-3">Invalid YouTube URL.</div>
      );
    }
    const embed = `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1`;
    return (
      <div className="rounded-[1rem] overflow-hidden border-[2px] border-[var(--border)] bg-white">
        <iframe
          src={embed}
          title="Listening Audio (YouTube)"
          className="w-full h-16"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <audio className="w-full" controls preload="metadata">
      <source src={src} />
    </audio>
  );
}

export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p className="text-sm text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Loading test... If you refreshed, please go back and re-enter.
        </p>
      </div>
    );
  }

  if (skill === "reading") return <TestV2Runner attemptId={attemptId} />;
  if (skill === "listening") return <TestV2Runner attemptId={attemptId} />;
  if (skill === "speaking") return <SpeakingScreen attemptId={attemptId} />;
  if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6 text-[var(--text-muted)]">Unknown skill: {String(skill)}</div>;
}

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
      return buildQuestion({
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

function ListeningScreen({ attemptId }: { attemptId: string }) {
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
      .map((q: any) => buildQuestion(q));
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

type SpeakingExam = {
  id: string;
  title: string;
  description?: string;
  prompt?: string;
  taskText?: string;
};

type AudioSource = "none" | "record" | "upload";

function SpeakingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { setLoading } = useLoadingStore();

  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const examId =
    (attempt as any)?.paper?.id ?? (attempt as any)?.examId ?? attemptId;

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ audio: true });

  const [seconds, setSeconds] = useState(0);
  const [exam, setExam] = useState<SpeakingExam | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [errorExam, setErrorExam] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const gradingRef = useRef(false);
  const [audioSource, setAudioSource] = useState<AudioSource>("none");

  const isRecording = status === "recording";

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      try {
        setLoadingExam(true);
        setErrorExam(null);
        const res = await getSpeakingExamsById(examId);
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setExam(data ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setErrorExam("Could not load speaking test. Please try again.");
      } finally {
        if (!cancelled) setLoadingExam(false);
      }
    }

    fetchExam();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  useEffect(() => {
    let t: any = null;
    if (isRecording) t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (t) clearInterval(t);
    };
  }, [isRecording]);

  const handleStart = () => {
    if (grading || audioSource === "upload") return;
    setSeconds(0);
    setAudioSource("record");
    startRecording();
  };

  const handleStop = () => {
    if (!isRecording) return;
    stopRecording();
  };

  const resetAudio = () => {
    clearBlobUrl();
    setSeconds(0);
    setAudioSource("none");
    const input = document.getElementById(
      "speaking-upload"
    ) as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleOpenConfirmGrade = () => {
    if (!mediaBlobUrl) {
      alert("No recording to grade yet.");
      return;
    }
    setConfirmOpen(true);
  };

  const doGrade = async () => {
    if (!mediaBlobUrl) {
      alert("No recording to grade yet.");
      return;
    }

    if (gradingRef.current) return;
    gradingRef.current = true;
    try {
      setGrading(true);
      setLoading(true);

      const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const res = await gradeSpeaking({
        examId: exam?.id ?? examId,
        timeSpentSeconds: seconds,
        speech: blob,
      });

      const apiData = res.data?.data ?? res.data;
      const submissionId =
        apiData?.id ?? apiData?.res?.submissionId ?? (apiData as any)?.submissionId;

      if (submissionId)
        router.push(`/attempts/${submissionId}?source=speaking`);
      else alert("Grading complete but submissionId not found.");
    } catch (e) {
      console.error(e);
      alert("Speaking grading failed. Please try again.");
    } finally {
      setGrading(false);
      setLoading(false);
      gradingRef.current = false;
    }
  };

  const handleUploadAudio = async (file: File) => {
    if (grading) return;
    setAudioSource("upload");

    try {
      setLoading(true);

      const res = await gradeSpeaking({
        examId: exam?.id ?? examId,
        timeSpentSeconds: 0,
        speech: file,
      });

      const apiData = res.data?.data ?? res.data;
      const submissionId =
        apiData?.id ?? apiData?.res?.submissionId ?? (apiData as any)?.submissionId;

      if (submissionId)
        router.push(`/attempts/${submissionId}?source=speaking`);
      else alert("Could not find submissionId.");
    } catch (e) {
      console.error(e);
      alert("Upload & grading failed.");
      setAudioSource("none");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGrade = async () => {
    setConfirmOpen(false);
    await doGrade();
  };

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p className="text-sm text-[var(--text-muted)] font-bold">Loading speaking test...</p>
      </div>
    );
  }

  if (errorExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--destructive)] font-bold">{errorExam}</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">
          Speaking test not found. Go back and try again.
        </p>
      </div>
    );
  }

  const title = exam.title || "Speaking test";
  const description =
    exam.description ??
    exam.taskText ??
    "You will speak about the topic below. Try to give full, natural answers.";

  return (
    <>
      <div className="flex h-full min-h-0 bg-[var(--background)]">
        <div className="flex flex-1 max-w-7xl mx-auto my-8 gap-8 w-full px-4 sm:px-6 lg:px-8">
          <main className="flex-1 flex flex-col gap-5 min-h-0">
            {/* Header Card */}
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-8 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  IELTS Speaking
                </p>
                <h2
                  className="text-xl font-bold text-[var(--foreground)] mt-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {title}
                </h2>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-[var(--text-muted)] font-bold">Timer</span>
                  <span
                    className="font-bold text-lg text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatTime(seconds)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full border-[2px] text-xs font-bold ${
                    status === "recording"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : status === "stopped"
                      ? "border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)]"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)]"
                  }`}
                >
                  <span
                    className={`mr-2 h-2.5 w-2.5 rounded-full ${
                      status === "recording"
                        ? "bg-red-500 animate-pulse"
                        : status === "stopped"
                        ? "bg-[var(--skill-speaking)]"
                        : "bg-[var(--text-muted)]"
                    }`}
                  />
                  {status === "idle" && "Ready"}
                  {status === "recording" && "Recording"}
                  {status === "stopped" && "Recorded"}
                </span>
              </div>
            </div>

            <div className="flex flex-1 gap-5 min-h-0">
              {/* Task question card */}
              <section className="flex-1 bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-7 flex flex-col min-h-0">
                <div>
                  <h3
                    className="text-base font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Task question
                  </h3>
                  <p className="text-base text-[var(--text-body)] leading-relaxed whitespace-pre-line mt-2">
                    {description}
                  </p>
                </div>
              </section>

              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg"
                id="speaking-upload"
                className="hidden"
                disabled={
                  isRecording ||
                  grading ||
                  uploading ||
                  audioSource === "record"
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadAudio(file);
                }}
              />

              {/* Recording panel */}
              <section className="w-full max-w-md flex flex-col gap-4">
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 flex flex-col gap-4">
                  <h3
                    className="text-sm font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Recording panel
                  </h3>

                  <div className="flex justify-center my-6">
                    <div className="relative flex items-center justify-center w-64 h-24 bg-slate-50 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
                      {isRecording ? (
                        <VoiceWaveAnimation
                          isRecording={isRecording}
                          barCount={32}
                          height={64}
                          activeColor="#317EFF"
                          idleColor="#94A3B8"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Icon name="mic" className="text-4xl" />
                          <span className="text-xs font-semibold mt-1">Ready</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-3 text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                        {formatTime(seconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <label
                      htmlFor="speaking-upload"
                      className={`flex-1 px-4 py-2.5 rounded-full font-bold text-sm text-center transition-all duration-150 ${
                        isRecording || grading || uploading || !!mediaBlobUrl
                          ? "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed pointer-events-none border-[2px] border-[var(--border)]"
                          : "bg-white text-[var(--primary)] border-[2px] border-[var(--primary)] cursor-pointer hover:-translate-y-0.5 hover:bg-[var(--primary-light)]"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Upload mp3 / wav
                    </label>

                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={
                        isRecording ||
                        grading ||
                        uploading ||
                        audioSource === "upload"
                      }
                      className={`flex-1 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-150 ${
                        isRecording ||
                        grading ||
                        uploading ||
                        audioSource === "upload"
                          ? "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed border-[2px] border-[var(--border)]"
                          : "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Start
                    </button>

                    <button
                      type="button"
                      onClick={handleStop}
                      disabled={!isRecording || grading}
                      className={`flex-1 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-150 ${
                        !isRecording || grading
                          ? "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed border-[2px] border-[var(--border)]"
                          : "bg-[var(--destructive)] text-white border-b-[4px] border-red-700 hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Stop
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenConfirmGrade}
                    disabled={!mediaBlobUrl || grading}
                    className={`mt-3 w-full px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-150 ${
                      mediaBlobUrl && !grading
                        ? "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[2px] border-[var(--skill-speaking-border)] hover:-translate-y-0.5 hover:border-[var(--skill-speaking)]"
                        : "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed border-[2px] border-[var(--border)]"
                    }`}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {grading
                      ? "Grading..."
                      : mediaBlobUrl
                      ? "Grade & generate transcript"
                      : "Record first to grade"}
                  </button>

                  {(mediaBlobUrl || audioSource === "upload") && !grading && (
                    <button
                      type="button"
                      onClick={resetAudio}
                      className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--destructive)] font-bold underline mt-2"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Reset audio & try again
                    </button>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Speaking Grade"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2.5 rounded-full border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold text-sm hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmGrade}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-body)]">
          Are you sure you want to submit your recording for grading?
          <br />
          You will be redirected to the results page after grading.
        </p>
      </Modal>
    </>
  );
}

function WritingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { setLoading } = useLoadingStore();

  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const examId =
    (attempt as any)?.paper?.id ?? (attempt as any)?.examId ?? attemptId;

  const [exam, setExam] = useState<any | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [errorExam, setErrorExam] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [grading, setGrading] = useState(false);
  const submittingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistWord, setAssistWord] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      try {
        setLoadingExam(true);
        setErrorExam(null);

        if (attempt && (attempt as any).taskText) {
          if (!cancelled) setExam(attempt);
          return;
        }

        const res = await getWritingExamById(examId);
        if (cancelled) return;
        setExam(res.data?.data ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setErrorExam("Could not load writing test. Please try again.");
      } finally {
        if (!cancelled) setLoadingExam(false);
      }
    }

    fetchExam();
    return () => {
      cancelled = true;
    };
  }, [examId, attempt]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setAnswer(v);
    setWordCount(v.trim().split(/\s+/).filter(Boolean).length);
  };

  // Capture the word at the caret on double-click so the assist panel can
  // look it up immediately. The native browser selection is what we want
  // (a single token like "education" not the whole sentence).
  const handleTextareaDoubleClick = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const sel = (typeof window !== "undefined"
      ? window.getSelection()
      : null)?.toString();
    const text = (sel && sel.trim()) || answer;
    const match = text.match(/[A-Za-z][A-Za-z'-]*/);
    if (match) {
      setAssistWord(match[0].toLowerCase());
      setAssistOpen(true);
    }
  };

  const handleOpenConfirmSubmit = () => {
    if (!answer.trim()) {
      alert("You haven't written anything yet.");
      return;
    }
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    if (!answer.trim()) {
      alert("You haven't written anything yet.");
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setGrading(true);
      setLoading(true);

      const res = await gradeWriting(exam?.id ?? examId, answer, seconds);
      const payload = res.data?.data;
      const submissionId =
        payload?.submissionId ?? (payload as any)?.submissionId;

      if (submissionId) router.push(`/attempts/${submissionId}?source=writing`);
      else alert("Grading complete but submissionId not found.");
    } catch (e) {
      console.error(e);
      alert("Grading failed!");
    } finally {
      setGrading(false);
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    await doSubmit();
  };

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p className="text-sm text-[var(--text-muted)] font-bold">Loading writing test...</p>
      </div>
    );
  }

  if (errorExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--destructive)] font-bold">{errorExam}</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">
          Writing test not found. Go back and try again.
        </p>
      </div>
    );
  }

  const examTitle: string = exam?.title ?? "Writing Task";
  const writingPrompt: string =
    exam?.taskText ??
    "Write an essay of at least 150 words on the following topic:\n\nDo you think technology improves the quality of life? Why or why not?";

  // Heuristic: Task 2 essays require 250 words; Task 1 requires 150.
  const isTaskTwo = /task\s*2|task2/i.test(examTitle);
  const wordTarget = isTaskTwo ? 250 : 150;
  const wordProgress = Math.min(100, Math.round((wordCount / wordTarget) * 100));
  const reachedTarget = wordCount >= wordTarget;

  const formatTimeLeft = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-[var(--background)]">

        {/* LEFT: PROMPT */}
        <div className="w-1/2 overflow-y-auto p-6">
          {/* Accent strip */}
          <div className="mx-auto max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-[var(--skill-writing-light)] text-[var(--skill-writing)] text-xs font-bold px-4 py-1.5 border-[2px] border-[var(--skill-writing-border)] border-b-[4px]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--skill-writing)]" />
                Step 1 of 1
              </span>
              <span
                className="text-xs font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Target: {wordTarget} words
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
            >
              {/* Task badge */}
              <span
                className="inline-block rounded-full bg-[var(--skill-writing)] text-white text-xs font-bold px-4 py-1.5 mb-5 border-b-[3px] border-[#B45309]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {examTitle}
              </span>

              {/* Prompt heading */}
              <h2
                className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Your task
              </h2>

              {/* Prompt body */}
              <p className="text-lg leading-loose text-[var(--text-body)] whitespace-pre-line">
                {writingPrompt}
              </p>

              {/* Task image */}
              {(exam as any)?.imageUrl && (
                <div className="mt-6">
                  <Image
                    src={(exam as any).imageUrl}
                    alt={`${examTitle} chart`}
                    width={800}
                    height={500}
                    className="w-full h-auto rounded-2xl border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
                  />
                </div>
              )}

              {/* Tips footer */}
              <div className="mt-8 pt-6 border-t-[2px] border-dashed border-[var(--border)]">
                <p
                  className="text-sm font-bold text-[var(--skill-writing)] mb-3 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="w-1.5 h-5 rounded-full bg-[var(--skill-writing)] inline-block" />
                  Quick tips
                </p>
                <ul className="text-sm text-[var(--text-body)] space-y-2">
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">1.</span>
                    <span>Write at least <strong>{wordTarget} words</strong> for a strong response.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">2.</span>
                    <span>Plan your structure: intro, body, conclusion.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">3.</span>
                    <span>Check spelling and grammar before submitting.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="w-1/2 flex flex-col bg-white relative border-l-[3px] border-[var(--border)]">

          {/* Editor header */}
          <div className="shrink-0 h-14 border-b-[2px] border-[var(--border)] bg-[var(--skill-writing-light)] flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-white border-[2px] border-[var(--skill-writing-border)] flex items-center justify-center">
                <span className="text-[var(--skill-writing)] font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>W</span>
              </span>
              <div>
                <p
                  className="text-sm font-bold text-[var(--foreground)] leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Your response
                </p>
                <p
                  className="text-[11px] text-[var(--text-muted)] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Type directly in the box below
                </p>
              </div>
            </div>

            {/* Word target ring + assist toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAssistOpen((v) => !v)}
                title="Open dictionary & translate"
                className={`h-10 px-3 rounded-full font-bold text-xs border-[2px] border-b-[4px] transition-all flex items-center gap-1.5 ${
                  assistOpen
                    ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                    : "bg-white text-[var(--skill-writing)] border-[var(--skill-writing-border)] hover:-translate-y-0.5"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span
                  className="w-5 h-5 rounded-md bg-[var(--skill-writing-light)] border-[2px] border-[var(--skill-writing-border)] flex items-center justify-center text-[10px]"
                  style={{ color: "var(--skill-writing)" }}
                >
                  A
                </span>
                Assist
              </button>
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--skill-writing-border)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--skill-writing)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="94.2"
                    initial={{ strokeDashoffset: 94.2 }}
                    animate={{ strokeDashoffset: 94.2 - (94.2 * wordProgress) / 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--text-muted)]"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {wordProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* Word count progress bar */}
          <div className="shrink-0 px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {reachedTarget
                  ? "Target reached"
                  : `${wordTarget - wordCount} words to go`}
              </span>
              <span
                className={`text-[11px] font-bold ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--text-muted)]"}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {wordCount} / {wordTarget}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--background)] overflow-hidden border-[2px] border-[var(--border)]">
              <motion.div
                className="h-full rounded-full bg-[var(--skill-writing)]"
                initial={{ width: 0 }}
                animate={{ width: `${wordProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Typing area */}
          <div className="relative flex-1 min-h-0">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={handleChange}
              onDoubleClick={handleTextareaDoubleClick}
              className="w-full h-full p-8 resize-none outline-none text-lg text-[var(--foreground)] leading-8 selection:bg-[var(--skill-writing-light)] bg-white placeholder:text-[var(--text-muted)] placeholder:italic"
              placeholder="Start typing your answer here. Tip: outline 2 to 3 main ideas before you begin writing. Double-click a word to look it up."
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Status bar */}
          <div className="shrink-0 h-18 border-t-[3px] border-[var(--border)] bg-[var(--background)] px-6 py-3 flex items-center justify-between z-10">

            {/* Stats */}
            <div className="flex items-center gap-5">
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Words
                </span>
                <span
                  className={`text-2xl font-bold leading-none mt-0.5 ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--foreground)]"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {wordCount}
                </span>
              </div>
              <div className="w-px h-10 bg-[var(--border)]" />
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Time
                </span>
                <span
                  className="text-2xl font-bold text-[var(--foreground)] leading-none mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatTimeLeft(seconds)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleOpenConfirmSubmit}
              disabled={grading}
              whileTap={grading ? undefined : { scale: 0.97 }}
              className={`font-bold py-3 px-8 rounded-full text-sm transition-all duration-150 ${
                grading
                  ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
                  : "bg-[var(--skill-writing)] text-white border-b-[4px] border-[#B45309] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {grading ? "Grading..." : "Submit Answer"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Assist rail (dictionary + translate) */}
      <WritingAssistRail
        open={assistOpen}
        onClose={() => setAssistOpen(false)}
        initialWord={assistWord}
      />

      {/* Confirmation Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Writing Answer"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2.5 rounded-full border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold text-sm hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-5 py-2.5 rounded-full bg-[var(--skill-writing)] text-white font-bold text-sm border-b-[4px] border-[#B45309] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-body)]">
          Are you sure you want to submit your writing for grading?
          <br />
          <span className="text-[var(--text-muted)]">Word count: <strong>{wordCount}</strong> -- Time: <strong>{formatTimeLeft(seconds)}</strong></span>
        </p>
      </Modal>
    </>
  );
}
