"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import { autoSaveAttempt, submitAttempt, uploadFile } from "@/utils/api";
import { useDebouncedAutoSave } from "@/app/utils/hook";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import { BackendQuestionType } from "@/types/question.type";
import ListeningAudioBar from "../../do-test/[skill]/[attemptId]/components/listening/ListeningAudioBar";
import QuestionPanel from "../../do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import PassageView from "../../do-test/[skill]/[attemptId]/components/reading/PassageView";
import YouTubePlayer from "../../do-test/[skill]/[attemptId]/components/listening/YouTubePlayer";
import { useReactMediaRecorder } from "react-media-recorder";
import { useLoadingStore } from "@/app/store/loading";
import BookmarkButton from "@/components/BookmarkButton";
import { Group, Panel } from "react-resizable-panels";

type QA = Record<string, string>;
type Tab = "reading" | "listening" | "writing" | "speaking";

type QuestionMeta = {
  sectionId: string;
  type: BackendQuestionType;
  skill: string;
};
type SpeakingSource = "none" | "record" | "upload";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: "bg-[var(--skill-speaking-light)]", text: "text-[var(--skill-speaking)]", border: "border-[var(--skill-speaking-border)]" },
  A2: { bg: "bg-[var(--skill-speaking-light)]", text: "text-[var(--skill-speaking)]", border: "border-[var(--skill-speaking-border)]" },
  B1: { bg: "bg-[var(--skill-reading-light)]", text: "text-[var(--skill-reading)]", border: "border-[var(--skill-reading-border)]" },
  B2: { bg: "bg-[var(--primary-light)]", text: "text-[var(--primary)]", border: "border-[var(--border)]" },
  C1: { bg: "bg-[var(--skill-listening-light)]", text: "text-[var(--skill-listening)]", border: "border-[var(--skill-listening-border)]" },
  C2: { bg: "bg-[var(--skill-writing-light)]", text: "text-[var(--skill-writing)]", border: "border-[var(--skill-writing-border)]" },
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MultiSkillAttemptPage() {
  const router = useRouter();
  const { attemptId } = useParams() as { attemptId: string };
  const { user } = useUserStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const { setLoading } = useLoadingStore();
  const [activeTab, setActiveTab] = useState<Tab>("reading");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<QA>({});
  const lastAnswersRef = useRef<QA>({});
  const [speakingSource, setSpeakingSource] = useState<SpeakingSource>("none");
  const initialSecondsLeft = attempt?.timeLeft ?? attempt?.durationSec ?? 3600;
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ audio: true });

  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  const isRecording = status === "recording";

  const resetSpeaking = () => {
    clearBlobUrl();
    setSeconds(0);
    setSpeakingSource("none");
    if (speakingQuestion) {
      const next = { ...lastAnswersRef.current };
      delete next[String(speakingQuestion.id)];

      lastAnswersRef.current = next;
      setAnswers(next);
    }
  };

  const sections = useMemo(
    () =>
      attempt?.paper?.sections
        ? [...attempt.paper.sections].sort((a, b) => a.idx - b.idx)
        : [],
    [attempt?.paper?.sections]
  );

  const questionMeta = useMemo(() => {
    const m = new Map<string, QuestionMeta>();
    for (const s of sections) {
      for (const g of s.questionGroups ?? []) {
        for (const q of g.questions ?? []) {
          m.set(q.id, {
            sectionId: s.id,
            type: q.type as BackendQuestionType,
            skill: q.skill.toLowerCase(),
          });
        }
      }
    }
    return m;
  }, [sections]);

  const readingQuestionsApi = useMemo(
    () =>
      sections
        .flatMap((s) => (s.questionGroups ?? []).flatMap((g) => g.questions ?? []))
        .filter((a) => a?.skill?.toLowerCase() === "reading"),
    [sections]
  );

  const readingSection = useMemo(
    () =>
      sections.find((s: any) =>
        (s.questionGroups ?? []).some((g: any) =>
          (g.questions ?? []).some(
            (q: any) => String(q.skill).toLowerCase() === "reading"
          )
        )
      ),
    [sections]
  );

  const listeningSection = useMemo(
    () =>
      sections.find((s: any) => !!s.audioUrl) ??
      sections.find((s: any) =>
        (s.questionGroups ?? []).some((g: any) =>
          (g.questions ?? []).some(
            (q: any) => String(q.skill).toLowerCase() === "listening"
          )
        )
      ),
    [sections]
  );

  const listeningQuestionsApi = useMemo(
    () =>
      sections
        .flatMap((s: any) => (s.questionGroups ?? []).flatMap((g: any) => g.questions ?? []))
        .filter((q: any) => String(q.skill).toLowerCase() === "listening"),
    [sections]
  );

  const writingSection = useMemo(
    () =>
      sections.find((s: any) =>
        (s.questionGroups ?? []).some((g: any) =>
          (g.questions ?? []).some(
            (q: any) => String(q.skill).toLowerCase() === "writing"
          )
        )
      ),
    [sections]
  );

  const writingQuestion = useMemo(() => {
    if (!writingSection) return null;
    const allQuestions = (writingSection.questionGroups ?? []).flatMap((g: any) => g.questions ?? []);
    return (
      allQuestions.find(
        (q: any) => String(q.skill).toLowerCase() === "writing"
      ) ?? null
    );
  }, [writingSection]);

  const speakingSection = useMemo(
    () =>
      sections.find((s: any) =>
        (s.questionGroups ?? []).some((g: any) =>
          (g.questions ?? []).some(
            (q: any) => String(q.skill).toLowerCase() === "speaking"
          )
        )
      ),
    [sections]
  );

  const speakingQuestion = useMemo(() => {
    if (!speakingSection) return null;
    const allQuestions = (speakingSection.questionGroups ?? []).flatMap((g: any) => g.questions ?? []);
    return (
      allQuestions.find(
        (q: any) => String(q.skill).toLowerCase() === "speaking"
      ) ?? null
    );
  }, [speakingSection]);

  const readingUiQuestions = useMemo(
    () =>
      readingQuestionsApi
        .slice()
        .sort((a: any, b: any) => a.idx - b.idx)
        .map((q: any) => mapApiQuestionToUi(q)),
    [readingQuestionsApi]
  );

  const listeningUiQuestions = useMemo(
    () =>
      listeningQuestionsApi
        .slice()
        .sort((a: any, b: any) => a.idx - b.idx)
        .map((q: any) => mapApiQuestionToUi(q)),
    [listeningQuestionsApi]
  );

  const questionUiKindMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const q of [...readingUiQuestions, ...listeningUiQuestions]) {
      m[String(q.id)] = q.uiKind;
    }
    return m;
  }, [readingUiQuestions, listeningUiQuestions]);

  // Estimate level based on answered questions
  const totalQuestions = readingUiQuestions.length + listeningUiQuestions.length + (writingQuestion ? 1 : 0) + (speakingQuestion ? 1 : 0);
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim()).length;
  const estimatedLevelIdx = useMemo(() => {
    if (totalQuestions === 0) return 0;
    const ratio = answeredCount / totalQuestions;
    return Math.min(LEVELS.length - 1, Math.floor(ratio * LEVELS.length));
  }, [answeredCount, totalQuestions]);
  const estimatedLevel = LEVELS[estimatedLevelIdx];
  const levelStyle = LEVEL_COLORS[estimatedLevel] ?? LEVEL_COLORS.A1;

  const { run: debouncedSave, cancel: cancelAutoSave } = useDebouncedAutoSave(
    user?.id,
    attemptId
  );

  const buildSectionId = (qid: string) => questionMeta.get(qid)?.sectionId;

  const buildTextAnswer = (qid: string, value: string) => {
    if (!value) return undefined;
    const meta = questionMeta.get(qid);
    if (!meta) return undefined;

    const isChoice =
      meta.type === "MULTIPLE_CHOICE_SINGLE" ||
      questionUiKindMap[qid] === "choice_single";

    if (isChoice) return undefined;
    return value;
  };

  const mergeAndAutoSave = (partial: QA) => {
    const merged = { ...lastAnswersRef.current, ...partial };
    lastAnswersRef.current = merged;
    setAnswers(merged);
    debouncedSave(merged, buildSectionId, buildTextAnswer);
  };

  useEffect(() => {
    if (!attempt) return;
    setSecondsLeft(attempt.timeLeft ?? attempt.durationSec ?? 3600);
  }, [attempt?.timeLeft, attempt?.durationSec]);

  useEffect(() => {
    if (!secondsLeft) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const buildPayload = (answersMap: QA) => ({
    answers: Object.entries(answersMap).map(([questionId, value]) => {
      const meta = questionMeta.get(questionId);
      const sectionId = meta?.sectionId ?? "";
      const textAnswer = buildTextAnswer(questionId, value);
      const hasText = !!textAnswer && textAnswer.trim().length > 0;

      return {
        questionId,
        sectionId,
        selectedOptionIds: !hasText && value ? [value] : [],
        textAnswer: hasText ? textAnswer : undefined,
      };
    }),
    clientRevision: Date.now(),
  });

  async function handleSubmit(auto = false) {
    if (submitting) return;

    setLoading(true);
    try {
      setSubmitting(true);
      cancelAutoSave();

      const payload = buildPayload(lastAnswersRef.current);
      await autoSaveAttempt(attemptId, payload);
      await submitAttempt(attemptId);

      setLoading(false);
      router.push(`/attempts/${attemptId}`);
    } catch (e) {
      setSubmitting(false);
      setLoading(false);
      if (!auto) alert("Submission failed. Please try again.");
    }
  }

  const handleStartRecording = () => {
    if (uploading || speakingSource === "upload") return;
    setSeconds(0);
    setSpeakingSource("record");
    startRecording();
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    stopRecording();
  };

  const handleSpeakingChange = (value: string) => {
    if (!speakingQuestion) return;
    mergeAndAutoSave({ [String(speakingQuestion.id)]: value });
  };

  const handleGrade = async () => {
    if (!mediaBlobUrl) {
      alert("No recording available to upload.");
      return;
    }

    try {
      setUploading(true);
      setSpeakingSource("record");

      const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const res = await uploadFile({ file: blob });
      const serializedAnswer = res.data?.serializedResponse;

      if (!serializedAnswer) {
        alert("No serialized answer received from server.");
        return;
      }

      handleSpeakingChange(serializedAnswer);
      alert("Audio uploaded and speaking answer saved.");
    } catch (e) {
      alert("Audio upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    if (!speakingQuestion) return;

    try {
      setUploading(true);
      setSpeakingSource("upload");

      const res = await uploadFile({ file });
      const serializedAnswer = res.data?.serializedResponse;

      if (!serializedAnswer) {
        alert("No serialized answer received from server.");
        return;
      }

      handleSpeakingChange(serializedAnswer);
      alert("Audio uploaded and speaking answer saved.");
    } catch (e) {
      alert("Audio upload failed.");
      setSpeakingSource("none");
    } finally {
      setUploading(false);
    }
  };

  const listeningAudioUrl = listeningSection?.audioUrl ?? "";
  const writingValue =
    (writingQuestion && answers[String(writingQuestion.id)]) || "";

  const handleWritingChange = (value: string) => {
    if (!writingQuestion) return;
    mergeAndAutoSave({ [String(writingQuestion.id)]: value });
  };

  const examTitle = "English Placement Test";

  const TAB_ITEMS: { id: Tab; label: string }[] = [
    { id: "reading", label: "Reading" },
    { id: "listening", label: "Listening" },
    { id: "writing", label: "Writing" },
    { id: "speaking", label: "Speaking" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] overflow-hidden">

      {/* EXAM HEADER */}
      <header className="shrink-0 h-16 bg-white border-b-[3px] border-[var(--border)] flex items-center justify-between px-6 shadow-[0_4px_0_rgba(0,0,0,0.08)] z-50">

        {/* Left: Title + Level badge */}
        <div className="flex items-center gap-3">
          <div
            className="font-bold text-[var(--foreground)] flex items-center gap-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <span className="text-[var(--primary)] font-extrabold">EP</span>
            <span>English Placement</span>
          </div>
          {/* Level indicator badge */}
          <motion.div
            key={estimatedLevel}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-4 py-1.5 rounded-full font-extrabold text-sm border-[2px] ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {estimatedLevel}
          </motion.div>
        </div>

        {/* Center: Section Pills */}
        <nav className="flex gap-1.5">
          {TAB_ITEMS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                  active
                    ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                    : "text-[var(--text-muted)] bg-white border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Timer & Submit */}
        <div className="flex items-center gap-4">
          <div
            className="font-extrabold text-[var(--foreground)] bg-[var(--primary-light)] px-4 py-2 rounded-full border-[2px] border-[var(--border)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatTime(secondsLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              submitting
                ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed border-b-[4px] border-[var(--border)]"
                : "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
            }`}
          >
            {submitting ? "Submitting..." : "Finish Test"}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 min-h-0 overflow-hidden relative">

        {/* READING SECTION */}
        {activeTab === "reading" && (
          <div className="h-full flex overflow-hidden">
            <Group orientation="horizontal">
              <Panel defaultSize={55} minSize={35} className="overflow-hidden">
                <div className="h-full border-r-[2px] border-[var(--border)]">
                  <div className="h-full overflow-hidden bg-white">
                    <PassageView
                      passage={{
                        title: readingSection?.title || "Reading Passage",
                        content: readingSection?.passageMd || "",
                      }}
                      imageUrl={attempt?.paper?.imageUrl}
                      attemptId={attemptId}
                      sectionId={readingSection?.id}
                    />
                  </div>
                </div>
              </Panel>

              <Panel defaultSize={45} minSize={30} className="overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">
                  <div className="px-6 py-4 bg-white border-b-[2px] border-[var(--border)] flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2
                        className="font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        Questions
                      </h2>
                      <span
                        className="text-sm font-bold text-[var(--text-muted)] bg-[var(--primary-light)] px-3 py-1 rounded-full border-[2px] border-[var(--border)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {readingUiQuestions.length} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-4 lg:p-6
                    [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
                    [&::-webkit-scrollbar-thumb]:rounded-full
                  ">
                    <QuestionPanel
                      attemptId={attemptId}
                      questions={readingUiQuestions}
                      questionGroups={readingSection?.questionGroups}
                      initialAnswers={lastAnswersRef.current}
                      onAnswersChange={(next) => {
                        lastAnswersRef.current = {
                          ...lastAnswersRef.current,
                          ...(next as QA),
                        };
                        debouncedSave(next as QA, buildSectionId, buildTextAnswer);
                      }}
                    />
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        )}

        {/* LISTENING SECTION */}
        {activeTab === "listening" && (
          <div className="flex h-full w-full max-h-full bg-white overflow-hidden">
            <Group orientation="horizontal">
              <Panel>
                <div className="h-full flex flex-col overflow-hidden bg-white">
                  <div className="shrink-0 h-[280px] overflow-hidden border-b-[2px] border-[var(--border)] bg-black relative">
                    {listeningAudioUrl.includes("youtube.com") || listeningAudioUrl.includes("youtu.be") ? (
                      <YouTubePlayer src={listeningAudioUrl} />
                    ) : listeningAudioUrl ? (
                      <div className="h-full flex items-center justify-center bg-[var(--foreground)]">
                        <audio controls className="w-4/5">
                          <source src={listeningAudioUrl} />
                        </audio>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--foreground)]">
                        <span className="text-lg font-bold">Audio Player</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto p-5">
                    {listeningSection?.passageMd && (
                      <div className="p-5 bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                        <div className="prose prose-sm max-w-none
                          [&_h1]:text-[var(--foreground)] [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-4
                          [&_h2]:text-[var(--foreground)] [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-5 [&_h2]:mb-3
                          [&_h3]:text-[var(--foreground)] [&_h3]:font-semibold [&_h3]:text-base
                          [&_p]:text-[var(--foreground)] [&_p]:leading-relaxed
                          [&_strong]:text-[var(--foreground)] [&_strong]:font-semibold
                          [&_li]:text-[var(--foreground)] [&_li]:my-1
                          [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                          <ReactMarkdown>{listeningSection.passageMd}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="h-full flex flex-col overflow-hidden border-l-[2px] border-[var(--border)] bg-white z-20">
                  <div className="border-b-[2px] border-[var(--border)] px-5 py-4 bg-white sticky top-0 z-10 flex justify-between items-center">
                    <div>
                      <h2
                        className="text-lg font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        Listening
                      </h2>
                      <p
                        className="text-xs font-bold text-[var(--text-muted)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {listeningUiQuestions.length} questions
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-5 scroll-smooth bg-[var(--background)]">
                    <QuestionPanel
                      attemptId={attemptId}
                      questions={listeningUiQuestions}
                      questionGroups={listeningSection?.questionGroups}
                      initialAnswers={lastAnswersRef.current}
                      onAnswersChange={(next) => {
                        lastAnswersRef.current = { ...lastAnswersRef.current, ...(next as QA) };
                        debouncedSave(next as QA, buildSectionId, buildTextAnswer);
                      }}
                    />
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        )}

        {/* WRITING SECTION */}
        {activeTab === "writing" && (
          <div className="flex h-full overflow-hidden">
            <div className="w-1/2 h-full overflow-y-auto bg-[var(--background)] border-r-[2px] border-[var(--border)] p-6">
              <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 min-h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-xs text-white bg-[var(--foreground)] px-4 py-1.5 rounded-full">
                    Writing Task
                  </span>
                  <span className="text-xs font-bold text-[var(--skill-writing)] bg-[var(--skill-writing-light)] px-3 py-1 rounded-full border-[2px] border-[var(--skill-writing-border)]">
                    Optional
                  </span>
                </div>

                {writingSection?.instructionsMd && (
                  <div className="mb-6 pb-6 border-b-[2px] border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--text-muted)] mb-2">
                      Instructions
                    </p>
                    <div className="prose prose-sm max-w-none text-[var(--text-body)]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {writingSection.instructionsMd}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {writingQuestion && (
                  <div className="prose prose-lg max-w-none text-[var(--foreground)] leading-loose">
                    <ReactMarkdown>{writingQuestion.promptMd}</ReactMarkdown>
                  </div>
                )}

                {!writingQuestion && (
                  <p className="text-sm text-[var(--text-muted)]">No writing task found.</p>
                )}
              </div>
            </div>

            <div className="w-1/2 flex flex-col bg-white relative">
              <div className="shrink-0 h-10 border-b-[2px] border-[var(--border)] bg-[var(--background)] flex items-center px-4 gap-2">
                <span className="text-xs font-bold text-[var(--text-muted)]">Word Processor</span>
              </div>

              <textarea
                value={writingValue}
                onChange={(e) => handleWritingChange(e.target.value)}
                placeholder="Start typing your essay here..."
                className="flex-1 w-full p-8 resize-none outline-none text-lg text-[var(--foreground)] leading-8 selection:bg-[var(--primary-light)]"
                style={{ fontFamily: "var(--font-sans)" }}
                spellCheck={false}
              />

              <div className="shrink-0 h-14 border-t-[2px] border-[var(--border)] bg-white px-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Word Count</span>
                  <span
                    className={`text-lg font-extrabold ${writingValue.trim().split(/\s+/).filter(Boolean).length >= 150 ? 'text-[var(--skill-speaking)]' : 'text-[var(--foreground)]'}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {writingValue.trim().split(/\s+/).filter(Boolean).length}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("speaking")}
                  className="text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] px-4 py-2 rounded-full border-[2px] border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
                >
                  Skip this section
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPEAKING SECTION */}
        {activeTab === "speaking" && (
          <div className="h-full overflow-y-auto bg-[var(--background)] p-8">
            <div className="max-w-3xl mx-auto space-y-8">

              {/* Topic Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="font-bold text-xs text-white bg-[var(--foreground)] px-4 py-1.5 rounded-full">
                    Speaking Task
                  </span>
                  <span className="text-xs font-bold text-[var(--skill-writing)] bg-[var(--skill-writing-light)] px-3 py-1 rounded-full border-[2px] border-[var(--skill-writing-border)]">
                    Optional
                  </span>
                </div>

                {speakingSection?.instructionsMd && (
                  <div className="text-sm text-[var(--text-body)] mb-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {speakingSection.instructionsMd}
                    </ReactMarkdown>
                  </div>
                )}

                {speakingQuestion && (
                  <div className="text-xl font-bold text-[var(--foreground)] leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {speakingQuestion.promptMd}
                    </ReactMarkdown>
                  </div>
                )}

                {!speakingQuestion && (
                  <p className="text-sm text-[var(--text-muted)]">No speaking task found.</p>
                )}
              </motion.div>

              {/* Recorder Panel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
              >
                {/* Timer & Status */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="bg-[var(--primary-light)] rounded-[2rem] px-6 py-3 border-[2px] border-[var(--border)] text-center">
                    <span className="text-xs font-bold text-[var(--text-muted)] block mb-1">Duration</span>
                    <span
                      className="font-extrabold text-2xl text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatTime(seconds)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-[var(--text-muted)] block mb-1">Status</span>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border-[2px] ${
                      status === "recording"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : status === "stopped"
                        ? "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]"
                        : "bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]"
                    }`}>
                      <span className={`mr-2 h-2.5 w-2.5 rounded-full ${
                        status === "recording"
                          ? "bg-[var(--destructive)] animate-pulse"
                          : status === "stopped"
                          ? "bg-[var(--skill-speaking)]"
                          : "bg-[var(--text-muted)]"
                      }`} />
                      {status === "idle" && "Ready"}
                      {status === "recording" && "Recording..."}
                      {status === "stopped" && "Recorded"}
                    </span>
                  </div>
                </div>

                {/* Microphone Button */}
                <div className="flex justify-center mb-8">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={uploading || speakingSource === "upload"}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all font-extrabold text-3xl text-white ${
                      isRecording
                        ? "bg-[var(--destructive)] border-b-[6px] border-red-700 animate-pulse"
                        : uploading || speakingSource === "upload"
                        ? "bg-[var(--border)] cursor-not-allowed border-b-[6px] border-[var(--border)] text-[var(--text-muted)]"
                        : "bg-[var(--primary)] border-b-[6px] border-[var(--primary-dark)] hover:-translate-y-1 hover:border-b-[8px] active:translate-y-[3px] active:border-b-[3px]"
                    }`}
                  >
                    {isRecording ? "STOP" : "REC"}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <input
                    type="file"
                    accept="audio/mp3,audio/wav"
                    id="speaking-upload"
                    className="hidden"
                    disabled={speakingSource === "record" || uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAudio(file);
                    }}
                  />

                  <label
                    htmlFor="speaking-upload"
                    className={`w-full px-4 py-3 rounded-full font-bold text-sm text-center transition-all flex items-center justify-center gap-2 ${
                      speakingSource === "record" || uploading
                        ? "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed border-[2px] border-[var(--border)]"
                        : "bg-white text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 cursor-pointer"
                    }`}
                  >
                    Upload mp3 / wav
                  </label>

                  <button
                    type="button"
                    onClick={handleGrade}
                    disabled={!mediaBlobUrl || uploading}
                    className={`w-full px-4 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      mediaBlobUrl && !uploading
                        ? "bg-[var(--skill-speaking)] text-white border-b-[4px] border-[var(--skill-speaking)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                        : "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed border-[2px] border-[var(--border)]"
                    }`}
                  >
                    {uploading
                      ? "Uploading..."
                      : mediaBlobUrl
                      ? "Save & Continue"
                      : "Record first to save"}
                  </button>

                  {(mediaBlobUrl || speakingSource === "upload") && (
                    <button
                      type="button"
                      onClick={resetSpeaking}
                      className="text-xs font-bold text-[var(--destructive)] hover:underline text-center"
                    >
                      Clear audio & start over
                    </button>
                  )}
                </div>
              </motion.div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
