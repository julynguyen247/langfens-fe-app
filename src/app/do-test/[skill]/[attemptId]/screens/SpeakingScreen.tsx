"use client";

import VoiceWaveAnimation from "@/components/VoiceWaveAnimation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useLoadingStore } from "@/stores/loading";
import Modal from "@/components/Modal";
import { useReactMediaRecorder } from "react-media-recorder";
import { getSpeakingExamsById, gradeSpeaking } from "@/services/speaking";

import { formatTime, Icon } from "./shared";

type SpeakingExam = {
  id: string;
  title: string;
  description?: string;
  prompt?: string;
  taskText?: string;
};

type AudioSource = "none" | "record" | "upload";

export function SpeakingScreen({ attemptId }: { attemptId: string }) {
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
