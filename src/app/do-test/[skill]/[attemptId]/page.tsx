"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  gradeWriting,
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
  if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

type SpeakingPartId = "part1" | "part2" | "part3";

const SPEAKING_PARTS: {
  id: SpeakingPartId;
  label: string;
  title: string;
  description: string;
  bulletPoints?: string[];
  recommendedTime: string;
}[] = [
  {
    id: "part1",
    label: "Part 1",
    title: "Introduction & Interview",
    description:
      "The examiner will ask you general questions about yourself, your home, studies, work and interests.",
    bulletPoints: [
      "Where do you live?",
      "Do you work or are you a student?",
      "What do you usually do in your free time?",
    ],
    recommendedTime: "4–5 minutes",
  },
  {
    id: "part2",
    label: "Part 2",
    title: "Individual Long Turn (Cue Card)",
    description:
      "You will receive a task card and have 1 minute to prepare. Then you should speak for 1–2 minutes.",
    bulletPoints: [
      "Describe a memorable trip you have taken.",
      "where you went",
      "who you went with",
      "what you did there",
      "and explain why this trip was memorable for you",
    ],
    recommendedTime: "3–4 minutes",
  },
  {
    id: "part3",
    label: "Part 3",
    title: "Two-way Discussion",
    description:
      "The examiner will ask more abstract questions related to Part 2. You should give longer, thoughtful answers.",
    bulletPoints: [
      "How has tourism changed in your country?",
      "Do you think people travel too much nowadays?",
      "What are the effects of tourism on local culture?",
    ],
    recommendedTime: "4–5 minutes",
  },
];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<
    Record<SpeakingPartId, string>
  >({ part1: "", part2: "", part3: "" });

  const currentPart = SPEAKING_PARTS[currentIndex];
  const isRecording = status === "recording";

  useEffect(() => {
    let t: any = null;
    if (isRecording) {
      t = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isRecording]);

  useEffect(() => {
    setSeconds(0);
  }, [currentIndex]);

  const handleChangePart = (idx: number) => {
    if (isRecording) {
      if (
        !window.confirm("Bạn đang ghi âm. Dừng lại và chuyển sang part khác?")
      )
        return;
      stopRecording();
    }
    setCurrentIndex(idx);
  };

  const submitHandler = async () => {
    if (!mediaBlobUrl) {
      alert("Chưa có đoạn ghi âm để gửi transcript.");
      return;
    }
    try {
      const res = await audioSubmitFromUrl(mediaBlobUrl);
      const newText = res.data?.transcript || "";
      setTranscripts((prev) => ({
        ...prev,
        [currentPart.id]: newText,
      }));
    } catch (e) {
      console.error(e);
      alert("Lỗi khi gửi audio, thử lại nhé.");
    }
  };

  const currentTranscript = transcripts[currentPart.id];

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <div className="flex flex-1 max-w-7xl mx-auto my-8 gap-8 w-full px-6">
        <aside className="w-64 bg-white border rounded-2xl shadow-md p-5 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-1">
            IELTS Speaking
          </p>
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            Test structure
          </h2>

          {SPEAKING_PARTS.map((p, idx) => {
            const isActive = idx === currentIndex;
            const hasTranscript = !!transcripts[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleChangePart(idx)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition flex items-center justify-between
                  ${
                    isActive
                      ? "bg-[#317EFF] text-white border-[#317EFF]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span className="flex flex-col">
                  <span className="font-semibold">{p.label}</span>
                  <span
                    className={`text-[11px] ${
                      isActive ? "text-slate-100" : "text-slate-500"
                    }`}
                  >
                    {p.title}
                  </span>
                </span>
                {hasTranscript && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                      isActive
                        ? "bg-white text-[#317EFF]"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 flex flex-col gap-5 min-h-0">
          <div className="bg-white border rounded-2xl px-8 py-5 flex items-center justify-between shadow-md">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Speaking test
              </p>
              <h2 className="text-xl font-semibold text-slate-800 mt-1">
                {currentPart.label} – {currentPart.title}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Recommended time: {currentPart.recommendedTime}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500">Part timer</span>
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
            <section className="flex-1 bg-white border rounded-2xl p-7 shadow-md flex flex-col gap-4 min-h-0">
              <h3 className="text-base font-semibold text-slate-800">
                Task instructions
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {currentPart.description}
              </p>

              {currentPart.bulletPoints && (
                <ul className="mt-1 list-disc list-inside text-base text-slate-700 space-y-1.5">
                  {currentPart.bulletPoints.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}

              {currentPart.id === "part2" && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800">
                  You will have 1 minute to think about what you are going to
                  say. Then speak for 1–2 minutes.
                </div>
              )}
            </section>

            <section className="w-full max-w-lg flex flex-col gap-4">
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

                <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mt-3">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition
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
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition
                    ${
                      !isRecording
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Stop
                  </button>
                </div>

                <button
                  type="button"
                  onClick={submitHandler}
                  disabled={!mediaBlobUrl}
                  className={`mt-3 w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition
                  ${
                    mediaBlobUrl
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  }`}
                >
                  {mediaBlobUrl
                    ? "Generate transcript for this part"
                    : "Record first to get transcript"}
                </button>
              </div>

              <div className="bg-white border rounded-2xl p-5 shadow-md flex-1 min-h-[220px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Transcript – {currentPart.label}
                  </h3>
                  {currentTranscript && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      AI generated
                    </span>
                  )}
                </div>

                {currentTranscript ? (
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {currentTranscript}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Sau khi ghi âm và bấm <b>Generate transcript</b>, phần nói
                    của bạn trong {currentPart.label} sẽ hiển thị ở đây.
                  </p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* -------------------- WRITING (stub) -------------------- */

function WritingScreen({ attemptId }: { attemptId: string }) {
  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const examId = attempt?.paper?.id;

  const [answer, setAnswer] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setAnswer(v);
    setWordCount(v.trim().split(/\s+/).filter(Boolean).length);
  };

  const handleSubmit = async () => {
    if (!examId) {
      alert("Không tìm thấy examId");
      return;
    }
    if (!answer.trim()) {
      alert("Bạn chưa viết gì cả.");
      return;
    }

    try {
      setGrading(true);
      const res = await gradeWriting(examId, answer, seconds);
      setResult(res.data);
      alert("Đã chấm xong!");
    } catch (e) {
      console.error(e);
      alert("Chấm điểm thất bại!");
    } finally {
      setGrading(false);
    }
  };

  const writingPrompt =
    attempt?.paper?.sections?.[0]?.instructionsMd ??
    "Write an essay of at least 150 words on the following topic:\n\nDo you think technology improves the quality of life? Why or why not?";

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b p-4 bg-white sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Writing</h2>
          <p className="text-xs text-slate-500">
            Write your essay in the box below
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={grading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition
            ${
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
        {result && (
          <div className="mt-6 p-4 bg-white border border-slate-200 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">Kết quả chấm:</h4>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
