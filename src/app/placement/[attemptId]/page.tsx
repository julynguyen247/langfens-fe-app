"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useUserStore } from "@/app/store/userStore";
import { autoSaveAttempt, submitAttempt } from "@/utils/api";
import { useDebouncedAutoSave } from "@/app/utils/hook";
import { mapApiQuestionToUi } from "@/lib/mapApiQuestionToUi";
import { BackendQuestionType } from "@/types/question.type";
import ListeningAudioBar from "../../do-test/[skill]/[attemptId]/components/listening/ListeningAudioBar";
import QuestionPanel from "../../do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import PassageView from "../../do-test/[skill]/[attemptId]/components/reading/PassageView";

type QA = Record<string, string>;
type Tab = "reading" | "listening" | "writing";

type QuestionMeta = {
  sectionId: string;
  type: BackendQuestionType;
  skill: string;
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
  const clearAttempt = useAttemptStore((s) => s.clear);
  const [activeTab, setActiveTab] = useState<Tab>("reading");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<QA>({});
  const lastAnswersRef = useRef<QA>({});
  const initialSecondsLeft = attempt?.timeLeft ?? attempt?.durationSec ?? 3600;
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);

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
        m.set(s.id, {
          sectionId: q.id,
          type: q.type as BackendQuestionType,
          skill: q.skill.toLowerCase(),
        });
      }
    }
    return m;
  }, [sections]);

  const readingQuestionsApi = useMemo(() => {
    const questions = sections
      .map((s) => s.questions)
      .flat()
      .filter((a) => a.skill.toLowerCase() === "reading");
    return questions;
  }, [sections]);

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
    const q = (writingSection.questions ?? []).find(
      (q: any) => String(q.skill).toLowerCase() === "writing"
    );
    return q ?? null;
  }, [writingSection]);

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

  const buildSectionId = (qid: string) => {
    return questionMeta.get(qid)?.sectionId;
  };

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
    const merged = {
      ...lastAnswersRef.current,
      ...partial,
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!attempt) {
    return (
      <div className="p-6">
        Không có dữ liệu đề. Hãy quay lại và Start lại attempt.
      </div>
    );
  }

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

      clearAttempt?.(attemptId);
      router.replace(`/attempts/${attemptId}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      if (!auto) alert("Nộp bài thất bại. Vui lòng thử lại.");
    }
  }

  const readingSection = sections.find((s: any) =>
    (s.questions ?? []).some(
      (q: any) => String(q.skill).toLowerCase() === "reading"
    )
  );

  const listeningAudioUrl = listeningSection?.audioUrl ?? "";
  const writingValue =
    (writingQuestion && answers[String(writingQuestion.id)]) || "";

  const handleWritingChange = (value: string) => {
    if (!writingQuestion) return;
    mergeAndAutoSave({ [String(writingQuestion.id)]: value });
  };

  const examTitle = attempt.paper?.title ?? "English Placement Test";

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

      <div className="border-b bg-slate-50 px-4">
        <div className="flex gap-3 max-w-3xl">
          {[
            { id: "reading", label: "Reading" },
            { id: "listening", label: "Listening" },
            { id: "writing", label: "Writing" },
          ].map((t) => {
            const id = t.id as Tab;
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition
                  ${
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

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "reading" && (
          <div className="flex h-full min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden border-r bg-gray-50 mb-20">
              {readingSection && (
                <PassageView
                  passage={{
                    title: readingSection.title,
                    content: readingSection.instructionsMd,
                  }}
                />
              )}
            </div>

            <div className="w-[480px] flex flex-col h-full min-h-0 overflow-hidden">
              <div className="border-b p-4 bg-white sticky top-0 z-10">
                <h2 className="text-sm font-semibold text-slate-800">
                  Reading questions
                </h2>
                <p className="text-xs text-slate-500">
                  Trả lời 15 câu hỏi nhiều lựa chọn.
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <QuestionPanel
                  attemptId={attemptId}
                  questions={readingUiQuestions}
                  onAnswersChange={(next) => {
                    const casted = next as QA;
                    const merged = {
                      ...lastAnswersRef.current,
                      ...casted,
                    };
                    lastAnswersRef.current = merged;
                    setAnswers(merged);
                    debouncedSave(merged, buildSectionId, buildTextAnswer);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "listening" && (
          <div className="flex flex-col h-full min-h-0 bg-white">
            <div className="border-b p-4 bg-white sticky top-0 z-10 flex flex-col gap-3">
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

            <div className="flex-1 min-h-0 overflow-auto p-6 bg-gray-50">
              <QuestionPanel
                attemptId={attemptId}
                questions={listeningUiQuestions}
                onAnswersChange={(next) => {
                  const casted = next as QA;
                  const merged = {
                    ...lastAnswersRef.current,
                    ...casted,
                  };
                  lastAnswersRef.current = merged;
                  setAnswers(merged);
                  debouncedSave(merged, buildSectionId, buildTextAnswer);
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
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {writingSection.instructionsMd}
                  </p>
                </div>
              )}

              {writingQuestion && (
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Writing task
                  </h3>
                  <p className="text-sm text-slate-700 whitespace-pre-line mb-4 leading-relaxed">
                    {writingQuestion.promptMd}
                  </p>

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
      </div>
    </div>
  );
}
