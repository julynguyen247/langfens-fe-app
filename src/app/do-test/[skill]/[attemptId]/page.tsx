"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PassageView from "./components/reading/PassageView";
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
  autoSaveAttempt,
  getSpeakingExamsById,
  getWritingExam,
  gradeSpeaking,
  gradeWriting,
  submitAttempt,
} from "@/utils/api";

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
      <div className="text-xs text-amber-600">Đề này chưa có audioUrl.</div>
    );
  }

  if (isYouTubeUrl(src)) {
    const id = getYouTubeId(src);
    if (!id) {
      return (
        <div className="text-xs text-red-600">YouTube URL không hợp lệ.</div>
      );
    }
    const embed = `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1`;
    return (
      <div className="rounded-lg overflow-hidden border bg-white">
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
      <div className="p-6 text-sm text-slate-600">
        Đang tải bài thi… Nếu bạn vừa refresh trang, vui lòng thử quay lại danh
        sách và vào lại bài.
      </div>
    );
  }

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  if (skill === "speaking") return <SpeakingScreen attemptId={attemptId} />;
  if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

function ReadingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useUserStore();
  const { setLoading } = useLoadingStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  const lastAnswersRef = useRef<QA>({});

  const sections = useMemo(() => {
    const secs = attempt?.paper?.sections ?? [];
    return [...secs].sort((a: any, b: any) => a.idx - b.idx);
  }, [attempt?.paper?.sections]);

  const secFromUrl = sp.get("sec");
  const activeSec = sections.find((s) => s.id === secFromUrl) ?? sections[0];

  const panelQuestions = useMemo<UiQuestion[]>(() => {
    return (activeSec?.questions ?? [])
      .slice()
      .sort((a: any, b: any) => a.idx - b.idx)
      .map((q: any) => mapApiQuestionToUi(q));
  }, [activeSec]);

  const questionUiKindMap = useMemo(() => {
    const m: Record<string, QuestionUiKind> = {};
    for (const q of panelQuestions) m[String(q.id)] = q.uiKind;
    return m;
  }, [panelQuestions]);

  const { run: debouncedSave, cancel: cancelAutoSave } = useDebouncedAutoSave(
    user?.id,
    attemptId
  );

  const buildTextAnswer = (qid: string, value: string) => {
    if (!value) return undefined;
    const kind = questionUiKindMap[qid];
    if (kind === "choice_single" || kind === "choice_multiple")
      return undefined;
    return value;
  };

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!attempt?.paper) {
    return (
      <div className="p-6 text-center text-slate-500">Đang tải đề thi…</div>
    );
  }

  const doSubmit = async () => {
    if (!activeSec?.id) return;

    try {
      setSubmitting(true);
      setLoading(true);
      cancelAutoSave();

      const payload = {
        answers: Object.entries(lastAnswersRef.current).map(
          ([questionId, v]) => {
            const textAnswer = buildTextAnswer(questionId, v);
            const hasText = !!textAnswer && textAnswer.trim().length > 0;

            let selectedOptionIds: string[] = [];
            if (!hasText && v) {
              if (typeof v === "string" && v.startsWith("[")) {
                try {
                  const parsed = JSON.parse(v);
                  selectedOptionIds = Array.isArray(parsed) ? parsed : [v];
                } catch {
                  selectedOptionIds = [v];
                }
              } else {
                selectedOptionIds = [v];
              }
            }

            return {
              questionId,
              sectionId: activeSec.id,
              selectedOptionIds,
              textAnswer: hasText ? textAnswer : undefined,
            };
          }
        ),
        clientRevision: Date.now(),
      };

      await autoSaveAttempt(attemptId, payload);
      await submitAttempt(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  if (!attempt || !activeSec) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Không có dữ liệu bài Reading.
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full bg-white rounded-xl shadow overflow-hidden">
        <div className="flex-1 overflow-hidden border-r bg-gray-50 mb-20">
          <PassageView
            passage={{
              title: activeSec.title,
              content: activeSec.instructionsMd,
            }}
          />
        </div>

        <div className="w-[480px] flex flex-col overflow-hidden">
          <div className="border-b p-4 bg-white sticky top-0 z-10 flex justify-between">
            <h2 className="text-lg font-semibold text-black">Questions</h2>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#317EFF] text-white disabled:opacity-60"
            >
              Nộp bài
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <QuestionPanel
              attemptId={attemptId}
              questions={panelQuestions}
              onAnswersChange={(next) => {
                lastAnswersRef.current = {
                  ...lastAnswersRef.current,
                  ...(next as QA),
                };
                debouncedSave(next as QA, () => activeSec.id, buildTextAnswer);
              }}
            />
          </div>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận nộp bài Reading"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg border text-slate-600"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                doSubmit();
              }}
              className="px-4 py-2 rounded-lg bg-[#317EFF] text-white"
            >
              Đồng ý
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn nộp bài Reading? Sau khi nộp, bạn không thể thay
          đổi câu trả lời.
        </p>
      </Modal>
    </>
  );
}

function ListeningScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const { setLoading } = useLoadingStore();

  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  const [submitting, setSubmitting] = useState(false);
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
      for (const q of s.questions ?? []) {
        m.set(String(q.id), s.id);
      }
    }
    return m;
  }, [sections]);

  const allQs = useMemo(() => {
    return (sections as any[]).flatMap((s) => s.questions ?? []);
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

  const { run: debouncedSave, cancel: cancelAutoSave } = useDebouncedAutoSave(
    user?.id,
    attemptId
  );

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
      setSubmitting(true);
      setLoading(true);
      cancelAutoSave();
      await submitAttempt(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch {
      alert("Nộp bài thất bại.");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  if (!attempt) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Không có dữ liệu bài Listening.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl shadow overflow-hidden">
        <div className="border-b p-4 bg-white sticky top-0 z-10">
          <div className="flex justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-black">Listening</h2>
              {allQs.length > 0 &&
                allQs.filter(
                  (q) => String(q.skill ?? "").toLowerCase() === "listening"
                ).length === 0 && (
                  <div className="mt-1 text-xs text-amber-600">
                    Không có câu skill=LISTENING, đang hiển thị toàn bộ câu hỏi.
                  </div>
                )}
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#317EFF] text-white disabled:opacity-60"
            >
              Nộp bài
            </button>
          </div>

          <AudioBar src={listeningAudioUrl} />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {panelQuestions.length === 0 ? (
            <div className="text-sm text-slate-600">
              Không có câu hỏi để hiển thị.
            </div>
          ) : (
            <QuestionPanel
              attemptId={attemptId}
              questions={panelQuestions}
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

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận nộp bài Listening"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg border text-slate-600"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                doSubmit();
              }}
              className="px-4 py-2 rounded-lg bg-[#317EFF] text-white"
            >
              Đồng ý
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn nộp bài Listening? Sau khi nộp, bạn không thể thay
          đổi câu trả lời.
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
          setErrorExam("Không tải được đề Speaking. Hãy thử lại sau.");
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
      alert("Chưa có đoạn ghi âm để chấm điểm.");
      return;
    }
    setConfirmOpen(true);
  };

  const doGrade = async () => {
    if (!mediaBlobUrl) {
      alert("Chưa có đoạn ghi âm để chấm điểm.");
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
      else alert("Đã chấm xong nhưng không tìm thấy submissionId.");
    } catch (e) {
      console.error(e);
      alert("Chấm điểm speaking thất bại, thử lại nhé.");
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
      else alert("Không tìm thấy submissionId.");
    } catch (e) {
      console.error(e);
      alert("Upload & chấm điểm thất bại.");
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
      <div className="p-6 text-sm text-slate-600">Đang tải đề Speaking...</div>
    );
  }

  if (errorExam) {
    return <div className="p-6 text-sm text-red-600">{errorExam}</div>;
  }

  if (!exam) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Không tìm thấy đề Speaking. Hãy quay lại danh sách và thử lại.
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
      <div className="flex h-full min-h-0 bg-slate-50">
        <div className="flex flex-1 max-w-5xl mx-auto my-8 gap-8 w-full px-6">
          <main className="flex-1 flex flex-col gap-5 min-h-0">
            <div className="bg-white border rounded-2xl px-8 py-5 flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  IELTS Speaking
                </p>
                <h2 className="text-xl font-semibold text-slate-800 mt-1">
                  {title}
                </h2>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">Timer</span>
                  <span className="font-mono font-semibold text-lg text-slate-800">
                    {formatTime(seconds)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium ${
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

            <div className="flex flex-1 gap-5 min-h-0">
              <section className="flex-1 bg-white border rounded-2xl p-7 shadow-md flex flex-col min-h-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Task question
                  </h3>
                  <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
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

              <section className="w-full max-w-md flex flex-col gap-4">
                <div className="bg-white border rounded-2xl p-6 shadow-md flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Recording panel
                  </h3>

                  <div className="flex items-center justify-center">
                    <div className="w-52 h-52 rounded-full border-[6px] border-slate-200 flex items-center justify-center relative">
                      <div
                        className={`w-36 h-36 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isRecording
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isRecording ? "Recording…" : "Tap Start to record"}
                      </div>
                      <div className="absolute -bottom-4 text-[11px] text-slate-500 font-mono">
                        {formatTime(seconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-xs text-slate-500 mt-3">
                    <label
                      htmlFor="speaking-upload"
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm text-center transition ${
                        isRecording || grading || uploading || !!mediaBlobUrl
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                          : "bg-white text-[#317EFF] hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                      }`}
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
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                        isRecording ||
                        grading ||
                        uploading ||
                        audioSource === "upload"
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#317EFF] text-white hover:bg-[#74a4f6] active:scale-[0.98]"
                      }`}
                    >
                      Start
                    </button>

                    <button
                      type="button"
                      onClick={handleStop}
                      disabled={!isRecording || grading}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                        !isRecording || grading
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      Stop
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenConfirmGrade}
                    disabled={!mediaBlobUrl || grading}
                    className={`mt-3 w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                      mediaBlobUrl && !grading
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    }`}
                  >
                    {grading
                      ? "Đang chấm..."
                      : mediaBlobUrl
                      ? "Grade & generate transcript"
                      : "Record first to grade"}
                  </button>

                  {(mediaBlobUrl || audioSource === "upload") && !grading && (
                    <button
                      type="button"
                      onClick={resetAudio}
                      className="w-full text-xs text-slate-500 hover:text-red-600 underline mt-2"
                    >
                      Xóa audio & làm lại
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
        title="Xác nhận chấm điểm Speaking"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmGrade}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#317EFF] text-white hover:bg-[#74a4f6]"
            >
              Đồng ý
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn gửi đoạn ghi âm để chấm điểm không?
          <br />
          Sau khi chấm xong, bạn sẽ được chuyển tới trang xem kết quả Speaking.
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
        const res = await getWritingExam(examId);
        if (cancelled) return;
        setExam(res.data?.data ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setErrorExam("Không tải được đề Writing. Hãy thử lại sau.");
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
      alert("Bạn chưa viết gì cả.");
      return;
    }
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    if (!answer.trim()) {
      alert("Bạn chưa viết gì cả.");
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
      else alert("Đã chấm xong nhưng không tìm thấy submissionId.");
    } catch (e) {
      console.error(e);
      alert("Chấm điểm thất bại!");
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
      <div className="p-6 text-sm text-slate-600">Đang tải đề Writing...</div>
    );
  }

  if (errorExam) {
    return <div className="p-6 text-sm text-red-600">{errorExam}</div>;
  }

  if (!exam) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Không tìm thấy đề Writing. Hãy quay lại danh sách và thử lại.
      </div>
    );
  }

  const examTitle: string = exam?.title ?? "Writing";
  const writingPrompt: string =
    exam?.taskText ??
    "Write an essay of at least 150 words on the following topic:\n\nDo you think technology improves the quality of life? Why or why not?";

  return (
    <>
      <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
        <div className="border-b p-4 bg-white sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {examTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Write your essay in the box below
            </p>
          </div>
          <button
            onClick={handleOpenConfirmSubmit}
            disabled={grading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              grading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
            }`}
          >
            {grading ? "Đang chấm…" : "Nộp bài"}
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-semibold text-slate-800 mb-2">Prompt</h3>
          <p className="whitespace-pre-line text-slate-700 leading-relaxed">
            {writingPrompt}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">
              Word count: <span className="font-semibold">{wordCount}</span>
            </p>
            <p className="text-sm text-slate-500">
              Time: <span className="font-mono">{seconds}s</span>
            </p>
          </div>

          <textarea
            value={answer}
            onChange={handleChange}
            placeholder="Type your essay here…"
            className="w-full min-h-[300px] h-full p-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#317EFF] focus:border-transparent text-slate-800"
          />
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận nộp bài Writing"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#317EFF] text-white hover:bg-[#74a4f6]"
            >
              Đồng ý
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Bạn chắc chắn muốn nộp bài Writing để chấm điểm không?
          <br />
          Sau khi chấm xong, bạn sẽ được chuyển tới trang xem kết quả.
        </p>
      </Modal>
    </>
  );
}
