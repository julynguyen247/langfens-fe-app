"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import PassageView from "./components/reading/PassageView";
import QuestionPanel from "./components/common/QuestionPanel";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import { autoSaveAttempt, submitAttempt } from "@/utils/api";
import { useDebouncedAutoSave } from "@/app/utils/hook";

type Skill = "reading" | "listening" | "writing";
type QA = Record<string, string>;
export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  if (!attempt)
    return (
      <div className="p-6">Không có dữ liệu đề. Hãy quay lại và Start lại.</div>
    );

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  // if (skill === "writing") return <WritingScreen attemptId={attemptId} />;
  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

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

  const panelQuestions = useMemo(
    () =>
      (activeSec?.questions ?? [])
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .map((q) => ({
          id: String(q.id),
          stem: q.promptMd,
          choices: (q.options ?? [])
            .slice()
            .sort((a, b) => a.idx - b.idx)
            .map((op) => ({
              value: String(op.id ?? op.idx),
              label: op.contentMd,
            })),
        })),
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
      <div className="flex-1 min-h-0 overflow-hidden border-r bg-gray-50">
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
              lastAnswersRef.current = next as QA;
              debouncedSave(next as QA, buildSectionId);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** --------------- Listening ---------------- */
function ListeningScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { user } = useUserStore();
  const attempt = useAttemptStore((s) => s.byId[attemptId])!;
  const clearAttempt = useAttemptStore((s) => s.clear);
  const { skill } = useParams() as { skill: Skill; attemptId: string };
  const sectionOfQuestion = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of attempt.paper.sections ?? []) {
      for (const q of s.questions ?? []) {
        if (String(q.skill).toLowerCase() === "listening") {
          m.set(String(q.id), s.id);
        }
      }
    }
    return m;
  }, [attempt.paper.sections]);

  const qs = attempt.paper.sections
    .flatMap((s) => s.questions ?? [])
    .filter((q) => q.skill?.toLowerCase() === "listening");

  const panelQuestions = qs
    .slice()
    .sort((a, b) => a.idx - b.idx)
    .map((q) => ({
      id: String(q.id),
      stem: q.promptMd,
      choices: (q.options ?? [])
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .map((op) => ({ value: String(op.id ?? op.idx), label: op.contentMd })),
    }));

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
      router.replace(`/attempt/${attemptId}/result`);
    } catch (e) {
      console.error("Submit failed:", e);
      setSubmitting(false);
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
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

function WritingScreen() {
  return <div className="p-6">Bind prompt viết từ sections nếu có.</div>;
}
