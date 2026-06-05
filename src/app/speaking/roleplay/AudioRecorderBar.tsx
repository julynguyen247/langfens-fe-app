"use client";

import { audioSubmitFromUrl } from "@/utils/api";
import { webmToWavFile } from "@/utils/audio";
import { useEffect, useMemo, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import VoiceWaveAnimation from "@/components/VoiceWaveAnimation";

type AudioRecorderBarProps = {
  disabled?: boolean;
  onTranscript: (transcript: string) => void;
  onSendAudio?: (audioFile: File) => Promise<void>;
};

function formatSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

function extractTranscript(data: any): string {
  const payload = data?.data ?? data;
  return (
    payload?.transcriptRaw ??
    payload?.transcriptNormalized ??
    payload?.transcript ??
    payload?.text ??
    ""
  );
}

export default function AudioRecorderBar({
  disabled = false,
  onTranscript,
  onSendAudio,
}: AudioRecorderBarProps) {
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true });

  const isRecording = status === "recording";
  const canSubmitRecording = Boolean(mediaBlobUrl) && !isRecording && !submitting;
  const statusText = useMemo(() => {
    if (submitting) return "Transcribing...";
    if (isRecording) return "Recording";
    if (mediaBlobUrl) return "Recorded";
    return "Ready";
  }, [isRecording, mediaBlobUrl, submitting]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
    }
  }, [isRecording]);

  const handleRecordToggle = () => {
    setError("");
    setNotice("");
    if (isRecording) {
      stopRecording();
      return;
    }
    clearBlobUrl();
    startRecording();
  };

  const handleSendRecording = async () => {
    if (!mediaBlobUrl) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const file = await webmToWavFile(mediaBlobUrl);
      if (onSendAudio) {
        await onSendAudio(file);
        setNotice("Audio submitted successfully!");
        clearBlobUrl();
      } else {
        const res = await audioSubmitFromUrl(mediaBlobUrl);
        const transcript = extractTranscript(res?.data).trim();
        if (!transcript) {
          setError("No transcript detected from this recording.");
          return;
        }
        onTranscript(transcript);
        setNotice("Transcript inserted from recording.");
        clearBlobUrl();
      }
    } catch (exc) {
      console.error("Audio processing failed:", exc);
      setError("Could not process audio. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-colors duration-300 ${
        isRecording
          ? "border-blue-300 bg-gradient-to-br from-blue-50 to-slate-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      {/* Sound wave visualizer */}
      <div className="mb-3 overflow-hidden rounded-lg">
        <VoiceWaveAnimation
          isRecording={isRecording}
          barCount={52}
          height={56}
          activeColor="#3B82F6"
          idleColor="#94A3B8"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRecordToggle}
          disabled={disabled || submitting}
          className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-200"
              : "bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm"
          } disabled:cursor-not-allowed disabled:bg-slate-300`}
        >
          {isRecording && (
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          )}
          {isRecording ? "Stop" : "Record"}
        </button>

        <button
          type="button"
          onClick={handleSendRecording}
          disabled={disabled || !canSubmitRecording}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {onSendAudio ? "Send Voice" : "Use Recording"}
        </button>

        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium tabular-nums ${
            isRecording
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          {isRecording && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
          {statusText}
          {isRecording && <span className="font-mono">{formatSeconds(seconds)}</span>}
        </span>
      </div>

      {mediaBlobUrl && (
        <audio controls src={mediaBlobUrl} className="mt-3 h-9 w-full" />
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {notice && <p className="mt-2 text-xs text-emerald-700">{notice}</p>}
    </div>
  );
}
