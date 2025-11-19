"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import PassageView from "./components/reading/PassageView";
import QuestionPanel, {
  Question as UiQuestion,
  BackendQuestionType,
  QuestionUiKind,
} from "./components/common/QuestionPanel";

import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import {
  audioSubmitFromUrl,
  autoSaveAttempt,
  submitAttempt,
} from "@/utils/api";
import { useDebouncedAutoSave } from "@/app/utils/hook";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import ListeningAudioBar from "./components/listening/ListeningAudioBar";
import { useReactMediaRecorder } from "react-media-recorder";
import { SpeakingRecorderBar } from "./components/speaking/SpeakingRecorderBar";

type Skill = "reading" | "listening" | "writing" | "speaking";
type QA = Record<string, string>;

export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  // if (!attempt)
  // {
  //   return (
  //     <div className="p-6">Không có dữ liệu đề. Hãy quay lại và Start lại.</div>
  //   );
  // }

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  if (skill === "speaking") return <SpeakingScreen />;
  // if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

/* -------------------- READING -------------------- */

function ReadingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId])!;
  const clearAttempt = useAttemptStore((s) => s.clear);

  const sections = useMemo(
    () => [...(attempt.paper.sections ?? [])].sort((a, b) => a.idx - b.idx),
    [attempt.paper.sections]
  );

  const lastAnswersRef = useRef<QA>({});

  const sp = useSearchParams();
  const secFromUrl = sp.get("sec");
  const activeSec = sections.find((s) => s.id === secFromUrl) ?? sections[0];

  const panelQuestions = useMemo<UiQuestion[]>(
    () =>
      (activeSec?.questions ?? [])
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .map((q: any) => mapApiQuestionToUi(q)),
    [activeSec]
  );

  const { run: debouncedSave, cancel: cancelAutoSave } = useDebouncedAutoSave(
    user?.id,
    attemptId
  );
  const buildSectionId = (qid: string) => activeSec?.id;

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

    try {
      setSubmitting(true);
      cancelAutoSave();
      const makePayload = (answers: QA) => ({
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          sectionId: buildSectionId(questionId) ?? "",
          selectedOptionIds: value ? [value] : [],
        })),
        clientRevision: Date.now(),
      });
      await autoSaveAttempt(attemptId, makePayload(lastAnswersRef.current));
      await submitAttempt(attemptId);
      clearAttempt?.(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch (e) {
      setSubmitting(false);
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    }
  }

  if (!activeSec) {
    return <div className="p-6">Không tìm thấy section.</div>;
  }

  return (
    <div className="flex h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden border-r bg-gray-50 mb-20">
        <PassageView
          passage={{
            title: activeSec.title,
            content: activeSec.instructionsMd,
          }}
        />
      </div>

      <div className="w-[480px] flex flex-col h-full min-h-0 overflow-hidden">
        <div className="border-b p-4 bg-white sticky top-0 z-10 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition
                ${
                  submitting
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
                }`}
            >
              {submitting ? "Đang nộp…" : "Nộp bài"}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <QuestionPanel
            attemptId={attemptId}
            questions={panelQuestions}
            onAnswersChange={(next) => {
              const casted = next as QA;
              // lưu lại toàn bộ answer mới nhất để lúc submit có data
              lastAnswersRef.current = {
                ...lastAnswersRef.current,
                ...casted,
              };
              debouncedSave(casted, buildSectionId);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------- LISTENING -------------------- */

function ListeningScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId])!;
  const clearAttempt = useAttemptStore((s) => s.clear);

  const sections = useMemo(
    () => [...(attempt.paper.sections ?? [])].sort((a, b) => a.idx - b.idx),
    [attempt.paper.sections]
  );

  const listeningSection = sections.find((s: any) => s.audioUrl) ?? sections[0];
  const listeningAudioUrl = listeningSection?.audioUrl ?? "";

  const sectionOfQuestion = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sections) {
      for (const q of s.questions ?? []) {
        if (String(q.skill).toLowerCase() === "listening") {
          m.set(String(q.id), s.id);
        }
      }
    }
    return m;
  }, [sections]);

  const qs = sections
    .flatMap((s) => s.questions ?? [])
    .filter((q) => q.skill?.toLowerCase() === "listening");

  const panelQuestions: UiQuestion[] = qs
    .slice()
    .sort((a, b) => a.idx - b.idx)
    .map((q: any) => mapApiQuestionToUi(q));

  const { run: debouncedSave, cancel: cancelAutoSave } = useDebouncedAutoSave(
    user?.id,
    attemptId
  );
  const buildSectionId = (qid: string) => sectionOfQuestion.get(qid);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    const ok = window.confirm("Bạn chắc chắn muốn nộp bài?");
    if (!ok) return;

    try {
      setSubmitting(true);
      cancelAutoSave();
      await submitAttempt(attemptId);
      clearAttempt?.(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch (e) {
      console.error("Submit failed:", e);
      setSubmitting(false);
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b p-4 bg-white sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Listening</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition
              ${
                submitting
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
              }`}
            >
              {submitting ? "Đang nộp…" : "Nộp bài"}
            </button>
          </div>
        </div>

        <ListeningAudioBar src={listeningAudioUrl} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-6">
        <QuestionPanel
          attemptId={attemptId}
          questions={panelQuestions}
          onAnswersChange={(next) => debouncedSave(next as QA, buildSectionId)}
        />
      </div>
    </div>
  );
}

/* -------------------- SPEAKING (UI only) -------------------- */

function SpeakingScreen() {
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [text, setText] = useState("");

  const isRecording = status === "recording";

  const submitHandler = async (media: any) => {
    const res = await audioSubmitFromUrl(media);
    console.log(res);
    setText(res.data.transcript);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b p-4 bg-white sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800">Speaking</h2>
            <p className="text-xs text-slate-500">
              Speaking test • {status === "idle" && "Ready"}
              {status === "recording" && "Recording…"}
              {status === "stopped" && "Recorded"}
            </p>
          </div>

          <button
            onClick={() => alert("TODO: Submit Speaking logic")}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#317EFF] text-white hover:bg-[#74a4f6] transition"
          >
            Nộp bài
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-3 w-3 rounded-full ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-slate-300"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">
                {isRecording ? "Recording…" : "Ready to record"}
              </span>
              <span className="text-xs text-slate-500">
                Microphone • click {isRecording ? "Stop" : "Start"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-white px-2 py-1 shadow-sm border border-slate-200">
              ⏱ <span className="ml-1 font-mono">00:00</span>
            </span>

            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording}
              className={`px-3 py-2 rounded-lg font-semibold transition
                ${
                  isRecording
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#317EFF] text-white hover:bg-[#74a4f6]"
                }`}
            >
              Start
            </button>

            <button
              type="button"
              onClick={() => {
                stopRecording();
              }}
              disabled={!isRecording}
              className={`px-3 py-2 rounded-lg font-semibold transition
                ${
                  !isRecording
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => {
                submitHandler(mediaBlobUrl);
              }}
              className={`px-3 py-2 rounded-lg font-semibold transition bg-blue-50
              `}
            >
              Xuất transcript
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-6 bg-gray-50 flex flex-col items-center justify-center gap-4 text-black">
        {text}
      </div>
    </div>
  );
}

/* -------------------- WRITING (stub) -------------------- */

function WritingScreen() {
  return <div className="p-6">Bind prompt viết từ sections nếu có.</div>;
}
