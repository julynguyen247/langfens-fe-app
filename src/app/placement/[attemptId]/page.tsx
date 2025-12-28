"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
    console.log("[handleSubmit] called, auto:", auto, "submitting:", submitting);
    if (submitting) {
      console.log("[handleSubmit] Already submitting, returning early");
      return;
    }

    console.log("[handleSubmit] Starting submission...");
    setLoading(true);
    try {
      setSubmitting(true);
      cancelAutoSave();

      const payload = buildPayload(lastAnswersRef.current);
      console.log("[handleSubmit] payload:", payload);
      
      console.log("[handleSubmit] Calling autoSaveAttempt...");
      await autoSaveAttempt(attemptId, payload);
      console.log("[handleSubmit] autoSaveAttempt done, calling submitAttempt...");
      await submitAttempt(attemptId);
      console.log("[handleSubmit] submitAttempt done, redirecting...");

      // Reset loading before navigation
      setLoading(false);
      router.push(`/attempts/${attemptId}`);
    } catch (e) {
      console.error("[handleSubmit] Error:", e);
      setSubmitting(false);
      setLoading(false);
      if (!auto) alert("Nộp bài thất bại. Vui lòng thử lại.");
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
      alert("Chưa có đoạn ghi âm để tải lên.");
      return;
    }

    try {
      setUploading(true);
      setSpeakingSource("record");

      const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
      const res = await uploadFile({ file: blob });
      const serializedAnswer = res.data?.serializedResponse;

      if (!serializedAnswer) {
        alert("Không nhận được serializedAnswer từ server.");
        return;
      }

      handleSpeakingChange(serializedAnswer);
      alert("Đã tải và lưu câu trả lời speaking.");
    } catch (e) {
      console.error(e);
      alert("Tải audio thất bại.");
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
        alert("Không nhận được serializedAnswer từ server.");
        return;
      }

      handleSpeakingChange(serializedAnswer);
      alert("Đã upload và lưu câu trả lời speaking.");
    } catch (e) {
      console.error(e);
      alert("Upload audio thất bại.");
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

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* EXAM HEADER - Sticky Top */}
      <header className="shrink-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50">
        
        {/* Left: Title */}
        <div className="font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-rounded text-[#3B82F6]">school</span>
          <span>English Placement</span>
        </div>

        {/* Center: Section Pills */}
        <nav className="flex bg-slate-100 p-1 rounded-lg">
          {[
            { id: "reading", label: "Reading", icon: "menu_book" },
            { id: "listening", label: "Listening", icon: "headphones" },
            { id: "writing", label: "Writing", icon: "edit_note" },
            { id: "speaking", label: "Speaking", icon: "mic" },
          ].map((t) => {
            const id = t.id as Tab;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-white text-[#3B82F6] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-rounded text-sm">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Timer & Submit */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="material-symbols-rounded text-base text-slate-400">timer</span>
            {formatTime(secondsLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${
              submitting
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-slate-900 hover:bg-black text-white"
            }`}
          >
            {submitting ? "Submitting..." : "Finish Test"}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        
        {/* READING SECTION - Matching ReadingScreen layout */}
        {activeTab === "reading" && (
          <div className="h-full flex overflow-hidden">
            <Group orientation="horizontal">
              {/* Left Panel: Passage */}
              <Panel defaultSize={55} minSize={35} className="overflow-hidden">
                <div className="h-full border-r border-slate-200">
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

              {/* Right Panel: Questions */}
              <Panel defaultSize={45} minSize={30} className="overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden bg-[#F8FAFC]">
                  {/* Questions Header */}
                  <div className="px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-slate-900">Questions</h2>
                      <span className="text-sm text-slate-500">
                        {readingUiQuestions.length} questions
                      </span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="flex-1 overflow-auto p-4 lg:p-6
                    [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-slate-300
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

        {/* LISTENING SECTION - 2-Column Split Layout (like ListeningScreen) */}
        {activeTab === "listening" && (
          <div className="flex h-full w-full max-h-full bg-white overflow-hidden">
            <Group orientation="horizontal">
              {/* LEFT: Video + Passage */}
              <Panel>
                <div className="h-full flex flex-col overflow-hidden bg-white">
                  {/* Video Player */}
                  <div className="shrink-0 h-[280px] overflow-hidden border-b bg-black relative">
                    {listeningAudioUrl.includes("youtube.com") || listeningAudioUrl.includes("youtu.be") ? (
                      <YouTubePlayer src={listeningAudioUrl} />
                    ) : listeningAudioUrl ? (
                      <div className="h-full flex items-center justify-center bg-slate-900">
                        <audio controls className="w-4/5">
                          <source src={listeningAudioUrl} />
                        </audio>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <span className="material-symbols-rounded text-4xl">headphones</span>
                      </div>
                    )}
                  </div>
                  {/* Passage/Instructions */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-5">
                    {listeningSection?.passageMd && (
                      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="prose prose-sm max-w-none 
                          [&_h1]:text-gray-900 [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-4
                          [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-5 [&_h2]:mb-3
                          [&_h3]:text-gray-900 [&_h3]:font-semibold [&_h3]:text-base
                          [&_p]:text-gray-900 [&_p]:leading-relaxed
                          [&_strong]:text-gray-900 [&_strong]:font-semibold
                          [&_li]:text-gray-900 [&_li]:my-1
                          [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                          <ReactMarkdown>{listeningSection.passageMd}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              
              {/* RIGHT: Questions */}
              <Panel>
                <div className="h-full flex flex-col overflow-hidden border-l bg-white shadow-xl z-20">
                  {/* Header */}
                  <div className="border-b px-5 py-4 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Listening</h2>
                      <p className="text-xs text-slate-500">
                        {listeningUiQuestions.length} questions
                      </p>
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="flex-1 overflow-auto p-5 scroll-smooth bg-[#F8FAFC]">
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

        {/* WRITING SECTION - Split View (Optional) */}
        {activeTab === "writing" && (
          <div className="flex h-full overflow-hidden">
            {/* Left: Prompt (Paper Style) */}
            <div className="w-1/2 h-full overflow-y-auto bg-slate-100 border-r border-slate-300 p-6">
              <div className="bg-white border border-slate-200 shadow-sm p-8 min-h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-block bg-slate-800 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-[0.2em]">
                    Writing Task
                  </span>
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                    Optional
                  </span>
                </div>
                
                {writingSection?.instructionsMd && (
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                      Instructions
                    </p>
                    <div className="prose prose-sm max-w-none text-slate-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {writingSection.instructionsMd}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {writingQuestion && (
                  <div className="prose prose-lg max-w-none font-serif text-slate-800 leading-loose">
                    <ReactMarkdown>{writingQuestion.promptMd}</ReactMarkdown>
                  </div>
                )}

                {!writingQuestion && (
                  <p className="text-sm text-slate-500">No writing task found.</p>
                )}
              </div>
            </div>

            {/* Right: Editor */}
            <div className="w-1/2 flex flex-col bg-white relative">
              {/* Toolbar */}
              <div className="shrink-0 h-10 border-b border-slate-200 bg-[#F1F5F9] flex items-center px-3 gap-1">
                {['undo', 'redo', 'content_cut', 'content_copy'].map(icon => (
                  <button key={icon} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 cursor-default" disabled>
                    <span className="material-symbols-rounded text-lg">{icon}</span>
                  </button>
                ))}
                <div className="w-px h-4 bg-slate-300 mx-2"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Word Processor</span>
              </div>

              {/* Textarea */}
              <textarea
                value={writingValue}
                onChange={(e) => handleWritingChange(e.target.value)}
                placeholder="Start typing your essay here..."
                className="flex-1 w-full p-8 resize-none outline-none text-lg text-slate-800 font-sans leading-8 selection:bg-blue-100"
                spellCheck={false}
              />

              {/* Status Bar */}
              <div className="shrink-0 h-14 border-t border-slate-200 bg-white px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Word Count</span>
                    <span className={`text-lg font-bold ${writingValue.trim().split(/\s+/).filter(Boolean).length >= 150 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {writingValue.trim().split(/\s+/).filter(Boolean).length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("speaking")}
                  className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1"
                >
                  Skip this section
                  <span className="material-symbols-rounded text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SPEAKING SECTION - Modern Recorder (Optional) */}
        {activeTab === "speaking" && (
          <div className="h-full overflow-y-auto bg-[#F8FAFC] p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Topic Card */}
              <div className="bg-white border border-slate-200 p-8 rounded-xl text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="inline-block bg-slate-800 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-[0.2em]">
                    Speaking Task
                  </span>
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                    Optional
                  </span>
                </div>

                {speakingSection?.instructionsMd && (
                  <div className="text-sm text-slate-600 mb-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {speakingSection.instructionsMd}
                    </ReactMarkdown>
                  </div>
                )}

                {speakingQuestion && (
                  <div className="font-serif text-xl text-slate-800 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {speakingQuestion.promptMd}
                    </ReactMarkdown>
                  </div>
                )}

                {!speakingQuestion && (
                  <p className="text-sm text-slate-500">No speaking task found.</p>
                )}
              </div>

              {/* Recorder Panel */}
              <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
                {/* Timer & Status */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
                    <span className="font-mono font-bold text-2xl text-slate-800">{formatTime(seconds)}</span>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      status === "recording"
                        ? "bg-red-100 text-red-700"
                        : status === "stopped"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      <span className={`mr-2 h-2 w-2 rounded-full ${
                        status === "recording"
                          ? "bg-red-500 animate-pulse"
                          : status === "stopped"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`} />
                      {status === "idle" && "Ready"}
                      {status === "recording" && "Recording..."}
                      {status === "stopped" && "Recorded"}
                    </span>
                  </div>
                </div>

                {/* Large Microphone Button */}
                <div className="flex justify-center mb-8">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={uploading || speakingSource === "upload"}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : uploading || speakingSource === "upload"
                        ? "bg-slate-200 cursor-not-allowed"
                        : "bg-[#3B82F6] hover:bg-blue-600"
                    }`}
                  >
                    <span className="material-symbols-rounded text-5xl text-white">
                      {isRecording ? "stop" : "mic"}
                    </span>
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

                  {/* Upload Button */}
                  <label
                    htmlFor="speaking-upload"
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-sm text-center transition flex items-center justify-center gap-2 ${
                      speakingSource === "record" || uploading
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-rounded text-base">upload_file</span>
                    Upload mp3 / wav
                  </label>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleGrade}
                    disabled={!mediaBlobUrl || uploading}
                    className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                      mediaBlobUrl && !uploading
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-symbols-rounded text-base">cloud_upload</span>
                    {uploading
                      ? "Uploading..."
                      : mediaBlobUrl
                      ? "Save & Continue"
                      : "Record first to save"}
                  </button>

                  {/* Reset Button */}
                  {(mediaBlobUrl || speakingSource === "upload") && (
                    <button
                      type="button"
                      onClick={resetSpeaking}
                      className="text-xs text-slate-500 hover:text-red-600 underline"
                    >
                      Clear audio & start over
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
