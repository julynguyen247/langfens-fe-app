"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAttemptResult } from "@/utils/api";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useUserStore } from "@/app/store/userStore";

type AttemptResult = {
  attemptId: string;
  status: "GRADED" | "PENDING" | string;
  finishedAt: string;
  timeUsedSec: number;
  correctCount: number;
  totalPoints: number;
  awardedTotal: number;
  needsManualReview: number;
  bandScore?: number;
  questions: AttemptQuestionResult[];
  totalTime: string;
};

type AttemptQuestionResult = {
  questionId: string;
  index: number;
  promptMd?: string;
  selectedOptionIds?: string[];
  selectedAnswerText?: string;
  correctAnswerText?: string;
  isCorrect?: boolean | null;
  explanationMd?: string;
  timeSpentSec?: number;
};

export default function AttemptResultPage() {
  const { attemptId } = useParams() as { attemptId: string; skill?: string };
  const [data, setData] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await getAttemptResult(attemptId as any);
        const raw = res?.data?.data ?? res?.data ?? res;
        const answers: any[] = raw.answers ?? raw.items ?? raw.questions ?? [];
        const totalTimeSec =
          parseSecondsAny(raw.totalTime) ??
          parseTimeTaken(raw.timeTaken) ??
          parseSecondsAny(raw.timeUsedSec) ??
          0;

        const mapped: AttemptResult = {
          attemptId: raw.attemptId ?? raw.id ?? String(attemptId),
          status: raw.status ?? "GRADED",
          finishedAt:
            raw.gradedAt ??
            raw.finishedAt ??
            raw.submittedAt ??
            new Date().toISOString(),
          timeUsedSec: totalTimeSec,
          correctCount: raw.correct ?? 0,
          totalPoints: raw.scoreRaw ?? raw.totalPoints ?? 0,
          awardedTotal: raw.scorePct ?? raw.awardedTotal ?? 0,
          needsManualReview: raw.needsManualReview ?? 0,
          bandScore: raw.ieltsBand,
          questions: answers.map(
            (a: any, i: number): AttemptQuestionResult => ({
              questionId: String(a.questionId ?? a.id ?? i + 1),
              index: a.index ?? i + 1,
              promptMd: a.promptMd ?? a.prompt ?? "",
              selectedOptionIds: a.selectedOptionIds ?? [],
              selectedAnswerText: a.selectedAnswerText ?? "",
              correctAnswerText: a.correctAnswerText ?? "",
              isCorrect: typeof a.isCorrect === "boolean" ? a.isCorrect : null,
              explanationMd: a.explanationMd ?? a.explanation ?? "",
              timeSpentSec:
                a.timeSpentSec ?? a.elapsedSec ?? a.time ?? undefined,
            })
          ),
          totalTime: fmtMinSec(totalTimeSec),
        };

        setData(mapped);
      } catch (e) {
        console.error("error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading)
    return (
      <div className="p-6 text-center text-slate-500">Đang tải kết quả…</div>
    );

  if (!data)
    return (
      <div className="p-6 text-center text-slate-500">
        Không tìm thấy kết quả{" "}
        <button
          onClick={() => router.push("/home")}
          className="text-blue-600 underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );

  const answeredCount = data.questions.filter(
    (q) => !!q.selectedAnswerText || (q.selectedOptionIds?.length ?? 0) > 0
  ).length;
  const blankCount = data.questions.length - answeredCount;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden text-black">
      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">
          IELTS Result
        </h1>
        <p className="text-sm opacity-90">
          {new Date(data.finishedAt).toLocaleString("vi-VN")}
        </p>
      </div>

      <div className="flex flex-col items-center py-10">
        <div className="relative w-40 h-40 rounded-full bg-gradient-to-b from-emerald-400 to-blue-400 text-white flex items-center justify-center shadow-lg">
          <span className="text-6xl font-extrabold">
            {typeof data.bandScore === "number"
              ? data.bandScore.toFixed(1)
              : "--"}
          </span>
        </div>
        <p className="mt-4 text-lg text-slate-700">Overall Band Score</p>
      </div>

      <div className="px-8 pb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-700">
        <Stat label="Trạng thái">
          {data.status === "GRADED" ? (
            <span className="flex items-center gap-2 text-emerald-600 font-semibold">
              <FiCheckCircle /> Đã chấm xong
            </span>
          ) : data.status === "PENDING" ? (
            <span className="flex items-center gap-2 text-amber-600 font-semibold">
              <FiAlertCircle /> Đang chờ chấm tay
            </span>
          ) : (
            <span className="flex items-center gap-2 text-rose-600 font-semibold">
              <FiXCircle /> Không xác định
            </span>
          )}
        </Stat>

        <Stat label="Số câu đã trả lời">{answeredCount}</Stat>
        <Stat label="Câu bỏ trống">{blankCount}</Stat>
        <Stat label="Tổng thời gian">{data.totalTime}</Stat>
        <Stat label="Số câu đúng">{data.correctCount}</Stat>
        <Stat label="Điểm nội bộ">
          {data.awardedTotal}/{data.totalPoints}
        </Stat>
      </div>

      {data.needsManualReview > 0 && (
        <div className="mx-8 mb-8 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          ⚠️ Có {data.needsManualReview} câu cần chấm tay — band có thể thay đổi
          sau khi hoàn tất chấm.
        </div>
      )}

      <QuestionReview details={data.questions} />

      <div className="flex justify-center gap-4 pb-10">
        <button
          onClick={() => router.push("/home")}
          className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-lg border p-4">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <div className="text-xl font-semibold">{children}</div>
    </div>
  );
}

function QuestionReview({ details }: { details: AttemptQuestionResult[] }) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "none">(
    "all"
  );

  const normalized = useMemo(
    () => (details ?? []).map(normalizeDetail),
    [details]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return normalized;
    if (filter === "correct")
      return normalized.filter((d) => d.isCorrect === true);
    if (filter === "wrong")
      return normalized.filter((d) => d.isCorrect === false);
    return normalized.filter((d) => d.state === "none");
  }, [normalized, filter]);

  return (
    <div className="px-8 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Review chi tiết
        </h2>
        <div className="flex gap-2">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            Tất cả ({normalized.length})
          </FilterBtn>
          <FilterBtn
            active={filter === "correct"}
            onClick={() => setFilter("correct")}
          >
            Đúng ({normalized.filter((d) => d.isCorrect === true).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "wrong"}
            onClick={() => setFilter("wrong")}
          >
            Sai ({normalized.filter((d) => d.isCorrect === false).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "none"}
            onClick={() => setFilter("none")}
          >
            Chưa trả lời ({normalized.filter((d) => d.state === "none").length})
          </FilterBtn>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-slate-500 border rounded-lg bg-slate-50">
          Không có dữ liệu chi tiết câu hỏi.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((d) => (
            <ReviewItem key={d.questionId} data={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewItem({ data }: { data: ReturnType<typeof normalizeDetail> }) {
  const [open, setOpen] = useState(false);

  const badge =
    data.state === "none" ? (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border">
        Chưa trả lời
      </span>
    ) : data.isCorrect ? (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        Đúng
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
        Sai
      </span>
    );

  return (
    <li className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-mono text-slate-500">
              Q{data.index ?? "?"}
            </span>
            {badge}
            {typeof data.timeSpentSec === "number" && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border text-slate-600">
                {fmtMinSec(data.timeSpentSec)}
              </span>
            )}
          </div>

          <div className="text-slate-800 whitespace-pre-wrap">
            {data.prompt}
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded p-3">
              <p className="text-xs text-slate-500 mb-1">Bạn chọn</p>
              <div className="text-sm">
                {data.selectedText ? (
                  <span>{data.selectedText}</span>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded p-3">
              <p className="text-xs text-slate-500 mb-1">Đáp án đúng</p>
              <div className="text-sm">
                {data.correctText ? (
                  <span>{data.correctText}</span>
                ) : (
                  <span className="text-slate-400 italic">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border hover:bg-slate-50"
        >
          {open ? <FiChevronUp /> : <FiChevronDown />}
          Giải thích
        </button>
      </div>

      {open && data.explanation && (
        <div className="mt-3 p-3 rounded bg-emerald-50 border border-emerald-100 text-emerald-900 text-sm whitespace-pre-wrap">
          {data.explanation}
        </div>
      )}
    </li>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function normalizeDetail(d: AttemptQuestionResult) {
  const hasAnswer =
    !!d.selectedAnswerText || (d.selectedOptionIds?.length ?? 0) > 0;
  let state: "answered" | "none" = hasAnswer ? "answered" : "none";
  let isCorrect: boolean | null =
    typeof d.isCorrect === "boolean" ? d.isCorrect : null;

  return {
    questionId: d.questionId,
    index: d.index,
    prompt: d.promptMd ?? "",
    selectedText: d.selectedAnswerText ?? "",
    correctText: d.correctAnswerText ?? "",
    explanation: d.explanationMd ?? "",
    isCorrect,
    state,
    timeSpentSec: d.timeSpentSec,
  };
}

function fmtMinSec(totalSec: number) {
  if (!totalSec || totalSec < 0) return "—";
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}m${String(s).padStart(2, "0")}s`;
}

function parseTimeTaken(s: string | undefined): number | null {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!m) return null;
  const hh = Number(m[1] ?? 0);
  const mm = Number(m[2] ?? 0);
  const ss = Number(m[3] ?? 0);
  return hh * 3600 + mm * 60 + ss;
}

function parseSecondsAny(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (m) {
    const hh = Number(m[1] ?? 0);
    const mm = Number(m[2] ?? 0);
    const ss = Number(m[3] ?? 0);
    return hh * 3600 + mm * 60 + ss;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
