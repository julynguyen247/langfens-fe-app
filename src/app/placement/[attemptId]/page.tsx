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
import { useReactMediaRecorder } from "react-media-recorder";
import { useLoadingStore } from "@/app/store/loading";

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
      for (const q of s.questions) {
        m.set(q.id, {
          sectionId: s.id,
          type: q.type as BackendQuestionType,
          skill: q.skill.toLowerCase(),
        });
      }
    }
    return m;
  }, [sections]);

  const readingQuestionsApi = useMemo(
    () =>
      sections
        .map((s) => s.questions)
        .flat()
        .filter((a) => a.skill.toLowerCase() === "reading"),
    [sections]
  );

  const listeningSection = useMemo(
    () =>
      sections.find((s: any) => !!s.audioUrl) ??
      sections.find((s: any) =>
        (s.questions ?? []).some(
          (q: any) => String(q.skill).toLowerCase() === "listening"
        )
      ),
    [sections]
  );

  const listeningQuestionsApi = useMemo(
    () =>
      sections
        .flatMap((s: any) => s.questions ?? [])
        .filter((q: any) => String(q.skill).toLowerCase() === "listening"),
    [sections]
  );

  const writingSection = useMemo(
    () =>
      sections.find((s: any) =>
        (s.questions ?? []).some(
          (q: any) => String(q.skill).toLowerCase() === "writing"
        )
      ),
    [sections]
  );

  const writingQuestion = useMemo(() => {
    if (!writingSection) return null;
    return (
      (writingSection.questions ?? []).find(
        (q: any) => String(q.skill).toLowerCase() === "writing"
      ) ?? null
    );
  }, [writingSection]);

  const speakingSection = useMemo(
    () =>
      sections.find((s: any) =>
        (s.questions ?? []).some(
          (q: any) => String(q.skill).toLowerCase() === "speaking"
        )
      ),
    [sections]
  );

  const speakingQuestion = useMemo(() => {
    if (!speakingSection) return null;
    return (
      (speakingSection.questions ?? []).find(
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
    setLoading(true);
    if (submitting) return;
    if (!auto) {
      const ok = window.confirm("Bạn chắc chắn muốn nộp toàn bộ bài test?");
      if (!ok) return;
    }

    try {
      setSubmitting(true);
      cancelAutoSave();

      const payload = buildPayload(lastAnswersRef.current);
      await autoSaveAttempt(attemptId, payload);
      await submitAttempt(attemptId);

      router.replace(`/attempts/${attemptId}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      if (!auto) alert("Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b p-4 bg-white sticky top-0 z-20 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Placement Test
          </p>
          <h1 className="text-lg font-semibold text-slate-800">{examTitle}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500">Thời gian còn lại</span>
            <span className="font-mono font-semibold text-lg text-slate-800">
              {formatTime(secondsLeft)}
            </span>
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              submitting
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
            }`}
          >
            {submitting ? "Đang nộp…" : "Nộp bài"}
          </button>
        </div>
      </div>

      <div className="border-b bg-slate-50 px-4">
        <div className="flex gap-3 max-w-3xl">
          {[
            { id: "reading", label: "Reading" },
            { id: "listening", label: "Listening" },
            { id: "writing", label: "Writing" },
            { id: "speaking", label: "Speaking" },
          ].map((t) => {
            const id = t.id as Tab;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                  active
                    ? "border-[#317EFF] text-[#317EFF] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1  min-h-0 overflow-hidden">
        {activeTab === "reading" && (
          <div className="flex flex-col h-full min-h-0 bg-white justify-center items-center">
            <div className=" flex flex-col h-full min-h-0  overflow-hidden w-2/3 shadow-xl rounded-2xl">
              <div className="border-b p-4 bg-white sticky top-0 z-10 ">
                <h2 className="text-sm font-semibold text-slate-800">
                  Reading questions
                </h2>
                <p className="text-xs text-slate-500">
                  Trả lời 15 câu hỏi nhiều lựa chọn.
                </p>

                <div className="flex-1 min-h-0 overflow-auto">
                  <QuestionPanel
                    attemptId={attemptId}
                    questions={readingUiQuestions}
                    initialAnswers={lastAnswersRef.current}
                    onAnswersChange={(next) => {
                      lastAnswersRef.current = next;
                      debouncedSave(next, buildSectionId, buildTextAnswer);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "listening" && (
          <div className="flex flex-col h-full min-h-0 bg-white items-center">
            <div className="border-b p-4 bg-white sticky top-0 z-10 flex flex-col gap-3 w-full ">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Listening – Online course
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nghe đoạn hội thoại và chọn đáp án đúng A, B, C hoặc D.
                  </p>
                </div>
              </div>
              <ListeningAudioBar src={listeningAudioUrl} />
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-6 bg-gray-50 w-2/3">
              <QuestionPanel
                attemptId={attemptId}
                questions={listeningUiQuestions}
                initialAnswers={lastAnswersRef.current}
                onAnswersChange={(next) => {
                  lastAnswersRef.current = next;
                  debouncedSave(next, buildSectionId, buildTextAnswer);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "writing" && (
          <div className="flex flex-col h-full min-h-0 bg-gray-50">
            <div className="border-b p-4 bg-white sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Writing – Short essay (optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Recommended time: 15–20 minutes. Bạn có thể bỏ qua nếu chỉ cần
                  đánh giá Reading/Listening.
                </p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {writingSection && (
                <div className="mb-4 bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Instructions
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {writingSection.instructionsMd}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {writingQuestion && (
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Writing task
                  </h3>
                  <div className="text-sm text-slate-700 whitespace-pre-line mb-4 leading-relaxed">
                    <ReactMarkdown>{writingQuestion.promptMd}</ReactMarkdown>
                  </div>

                  <textarea
                    value={writingValue}
                    onChange={(e) => handleWritingChange(e.target.value)}
                    placeholder="Type your essay here…"
                    className="w-full min-h-[260px] p-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#317EFF] focus:border-transparent text-slate-800 text-sm"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>
                      Word count:{" "}
                      <b>
                        {
                          writingValue.trim().split(/\s+/).filter(Boolean)
                            .length
                        }
                      </b>
                    </span>
                    <span>Writing là optional trong placement test.</span>
                  </div>
                </div>
              )}

              {!writingQuestion && (
                <p className="text-sm text-slate-500">
                  Không tìm thấy câu hỏi Writing trong paper.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "speaking" && (
          <div className="flex flex-col h-full min-h-0 bg-gray-50">
            <div className="border-b p-4 bg-white sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Speaking – Task (optional)
                </h2>
                <p className="text-xs text-slate-500">
                  Nói to theo gợi ý bên dưới. Bạn có thể dùng nút ghi âm để
                  luyện nói, tải audio lên và lưu câu trả lời.
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">Speaking timer</span>
                  <span className="font-mono font-semibold text-lg text-slate-800">
                    {formatTime(seconds)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                    status === "recording"
                      ? "bg-red-100 text-red-700"
                      : status === "stopped"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`mr-2 h-2.5 w-2.5 rounded-full ${
                      status === "recording"
                        ? "bg-red-500 animate-pulse"
                        : status === "stopped"
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {status === "idle" && "Ready"}
                  {status === "recording" && "Recording"}
                  {status === "stopped" && "Recorded"}
                </span>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {speakingSection && (
                <div className="mb-4 bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Instructions
                  </h3>
                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {speakingSection.instructionsMd}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {speakingQuestion && (
                <div className="bg-white border rounded-lg p-5 shadow-sm flex  gap-6 item">
                  <div className="flex-1/2">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      Speaking task
                    </h3>
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {speakingQuestion.promptMd}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 items-center flex-1/2 justify-center">
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
                    <section className="w-full lg:w-1/2 flex flex-col gap-4">
                      <div className="flex w-full gap-3 text-xs text-slate-500">
                        <label
                          htmlFor="speaking-upload"
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm text-center cursor-pointer transition ${
                            speakingSource === "record" || uploading
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-white text-[#317EFF] hover:bg-indigo-100 border border-indigo-200"
                          }`}
                        >
                          Upload mp3 / wav
                        </label>
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          disabled={
                            isRecording ||
                            uploading ||
                            speakingSource === "upload"
                          }
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer ${
                            isRecording ||
                            uploading ||
                            speakingSource === "upload"
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
                          }`}
                        >
                          Start
                        </button>

                        <button
                          type="button"
                          onClick={handleStopRecording}
                          disabled={!isRecording || uploading}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                            !isRecording || uploading
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                        >
                          Stop
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleGrade}
                        disabled={!mediaBlobUrl || uploading}
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                          mediaBlobUrl && !uploading
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                      >
                        {uploading
                          ? "Đang tải lên..."
                          : mediaBlobUrl
                          ? "Tải lên & lưu câu trả lời"
                          : "Ghi âm xong để tải lên"}
                      </button>
                      {(mediaBlobUrl || speakingSource === "upload") && (
                        <button
                          type="button"
                          onClick={resetSpeaking}
                          className="w-full text-xs text-slate-500 hover:text-red-600 underline mt-2"
                        >
                          Xóa audio & làm lại
                        </button>
                      )}
                    </section>
                  </div>
                </div>
              )}

              {!speakingQuestion && (
                <p className="text-sm text-slate-500">
                  Không tìm thấy câu hỏi Speaking trong paper.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
