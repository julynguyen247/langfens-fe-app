"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PassageView from "./components/reading/PassageView";
import YouTubePlayer from "./components/listening/YouTubePlayer";
import QuestionPanel, {
  Question as UiQuestion,
  QuestionUiKind,
} from "./components/common/QuestionPanel";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import { useLoadingStore } from "@/app/store/loading";
import Modal from "@/components/Modal";
import { useDebouncedAutoSave } from "@/app/utils/hook";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import { useReactMediaRecorder } from "react-media-recorder";
import {
  getSpeakingExamsById,
  getWritingExam,
  gradeSpeaking,
  gradeWriting,
  submitAttempt,
} from "@/utils/api";
import ReactMarkdown from "react-markdown";
import { Group, Panel, Separator } from "react-resizable-panels";

type Skill = "reading" | "listening" | "writing" | "speaking";
type QA = Record<string, string>;

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
        <p className="text-sm text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-sans)" }}>
          Loading test... If you refreshed, please go back and re-enter.
        </p>
      </div>
    );
  }

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
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
  reviewData?: Array<{ questionId: string; isCorrect: boolean | null; correctAnswer?: string; explanation?: string }>;
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
    return [...secs].sort((a: any, b: any) => a.idx - b.idx);
  }, [attempt?.paper?.sections]);

  const secFromUrl = sp.get("sec");
  const activeSec = sections.find((s) => s.id === secFromUrl) ?? sections[0];

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
    return uniqueQuestions
      .slice()
      .sort((a: any, b: any) => a.idx - b.idx)
      .map((q: any) => mapApiQuestionToUi(q));
  }, [activeSec]);

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
    if (kind === "choice_single" || kind === "choice_multiple")
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

      await submitAttempt(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

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
            style={{ fontFamily: "var(--font-sans)" }}
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
          style={{ fontFamily: "var(--font-sans)" }}
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
          style={{ fontFamily: "var(--font-sans)" }}
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
    if (kind === "choice_single" || kind === "choice_multiple")
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

      await submitAttempt(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Submit failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">No Listening data available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full max-h-full bg-white overflow-hidden">
        <Group orientation="horizontal">
          <Panel>
            <div className="h-full flex flex-col overflow-hidden border-r-[2px] border-[var(--border)] bg-white z-20">
              <div className="shrink-0 h-[280px] overflow-hidden border-b-[2px] border-[var(--border)] bg-black relative">
                <YouTubePlayer src={listeningAudioUrl} />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                {listeningSection?.passageMd && (
                  <div className="mb-6 p-5 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
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
          <Panel>
            <div className="h-full flex flex-col overflow-hidden bg-white z-20">
              <div className="border-b-[3px] border-[var(--border)] px-5 py-4 bg-white sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <h2
                      className="text-lg font-bold text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Listening
                    </h2>
                    {allQs.length > 0 &&
                      allQs.filter(
                        (q) =>
                          String(q.skill ?? "").toLowerCase() === "listening"
                      ).length === 0 && (
                        <div className="mt-1 text-xs text-[var(--skill-writing)] font-bold">
                          All questions (no skill filter)
                        </div>
                      )}
                  </div>
                </div>

                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-150 ${
                    isSubmitting
                      ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
                      : "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                  }`}
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-5 scroll-smooth">
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
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                doSubmit();
              }}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-sans)" }}
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

    try {
      setGrading(true);
      setLoading(true);

      const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const res = await gradeSpeaking({
        examId: exam?.id ?? examId,
        timeSpentSeconds: seconds,
        speech: blob,
      });

      const payload = res.data?.data?.res;
      const submissionId =
        payload?.submissionId ?? (payload as any)?.submissionId;

      if (submissionId)
        router.push(`/attempts/${submissionId}?source=speaking`);
      else alert("Grading complete but submissionId not found.");
    } catch (e) {
      console.error(e);
      alert("Speaking grading failed. Please try again.");
    } finally {
      setGrading(false);
      setLoading(false);
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

      const payload = res.data?.data?.res;
      const submissionId =
        payload?.submissionId ?? (payload as any)?.submissionId;

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
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-8 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  IELTS Speaking
                </p>
                <h2
                  className="text-xl font-bold text-[var(--foreground)] mt-1"
                  style={{ fontFamily: "var(--font-sans)" }}
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
              <section className="flex-1 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-7 flex flex-col min-h-0">
                <div>
                  <h3
                    className="text-base font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-sans)" }}
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
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 flex flex-col gap-4">
                  <h3
                    className="text-sm font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Recording panel
                  </h3>

                  <div className="flex items-center justify-center">
                    <div className="w-52 h-52 rounded-full border-[6px] border-[var(--border)] flex items-center justify-center relative">
                      <div
                        className={`w-36 h-36 rounded-full flex items-center justify-center text-sm font-bold ${
                          isRecording
                            ? "bg-[var(--destructive)] text-white"
                            : "bg-[var(--background)] text-[var(--text-body)]"
                        }`}
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {isRecording ? "Recording..." : "Tap Start to record"}
                      </div>
                      <div
                        className="absolute -bottom-4 text-xs text-[var(--text-muted)] font-bold"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
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
                      style={{ fontFamily: "var(--font-sans)" }}
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
                      style={{ fontFamily: "var(--font-sans)" }}
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
                      style={{ fontFamily: "var(--font-sans)" }}
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
                    style={{ fontFamily: "var(--font-sans)" }}
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
                      style={{ fontFamily: "var(--font-sans)" }}
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
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmGrade}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-sans)" }}
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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

        const res = await getWritingExam(examId);
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

  const formatTimeLeft = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Split-screen exam interface */}
      <div className="flex h-full w-full overflow-hidden">

        {/* Left Panel: The Prompt */}
        <div className="w-1/2 bg-[var(--background)] border-r-[3px] border-[var(--border)] overflow-y-auto p-6">
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 min-h-[90%]">
            {/* Task Type Badge */}
            <span className="inline-block rounded-full bg-[var(--foreground)] text-white text-xs font-bold px-4 py-1.5 mb-6 border-b-[3px] border-black">
              {examTitle}
            </span>

            {/* Prompt Text */}
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-loose text-[var(--foreground)] whitespace-pre-line">
                {writingPrompt}
              </p>
            </div>

            {/* Instructions Footer */}
            <div className="mt-8 pt-6 border-t-[2px] border-[var(--border)]">
              <p
                className="text-sm font-bold text-[var(--text-muted)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Instructions
              </p>
              <ul className="text-sm text-[var(--text-body)] space-y-1">
                <li>Write at least <strong>150 words</strong> for Task 1, or <strong>250 words</strong> for Task 2.</li>
                <li>You should spend about <strong>20 minutes</strong> on Task 1, or <strong>40 minutes</strong> on Task 2.</li>
                <li>Write your response in the editor on the right.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel: The Editor */}
        <div className="w-1/2 flex flex-col bg-white relative">

          {/* Toolbar */}
          <div className="shrink-0 h-12 border-b-[2px] border-[var(--border)] bg-[var(--background)] flex items-center px-4 gap-2">
            <span
              className="text-xs text-[var(--text-muted)] font-bold"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Word Processor
            </span>
          </div>

          {/* Typing Area */}
          <textarea
            value={answer}
            onChange={handleChange}
            className="flex-1 w-full p-8 resize-none outline-none text-lg text-[var(--foreground)] leading-8 selection:bg-[var(--primary-light)]"
            placeholder="Start typing your answer here..."
            spellCheck={false}
            autoFocus
          />

          {/* Status Bar */}
          <div className="shrink-0 h-16 border-t-[3px] border-[var(--border)] bg-white px-6 flex items-center justify-between z-10">

            {/* Left Stats */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--text-muted)]">Word Count</span>
                <span
                  className={`text-xl font-bold ${wordCount >= 150 ? 'text-[var(--skill-speaking)]' : 'text-[var(--foreground)]'}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {wordCount}
                </span>
              </div>
              <div className="w-px h-8 bg-[var(--border)]"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--text-muted)]">Time Elapsed</span>
                <span
                  className="text-xl font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatTimeLeft(seconds)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleOpenConfirmSubmit}
              disabled={grading}
              className={`font-bold py-2.5 px-8 rounded-full transition-all duration-150 ${
                grading
                  ? 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                  : 'bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]'
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {grading ? 'Grading...' : 'Submit Answer'}
            </button>

          </div>
        </div>

      </div>

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
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-sans)" }}
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
