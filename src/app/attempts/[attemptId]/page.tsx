"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getAttemptResult,
  getWritingHistoryById,
  getSpeakingHistoryById,
} from "@/utils/api";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import BookmarkButton from "@/components/BookmarkButton";

type PageSource = "attempt" | "writing" | "speaking";

type AttemptResult = {
  attemptId: string;
  status: string;
  finishedAt: string;
  timeUsedSec: number;
  correctCount: number;
  totalPoints: number;
  awardedTotal: number;
  needsManualReview: number;
  bandScore?: number;
  writingBand?: number;
  speakingBand?: number;
  writingGrade?: WritingDetail;
  speakingGrade?: SpeakingDetail;
  questions: AttemptQuestionResult[];
  totalTime: string;
};

type AttemptQuestionResult = {
  questionId: string;
  index: number;
  skill: string;
  questionType?: string;
  promptMd?: string;
  selectedOptionIds?: string[];
  selectedAnswerText?: string;
  correctAnswerText?: string;
  isCorrect?: boolean | null;
  explanationMd?: string;
  timeSpentSec?: number;
};

type WritingCriterion = {
  band: number;
  comment: string;
};

type WritingDetail = {
  submissionId: string;
  taskText: string;
  essayRaw: string;
  essayNormalized: string;
  wordCount: number;
  overallBand: number;
  taskResponse?: WritingCriterion;
  coherenceAndCohesion?: WritingCriterion;
  lexicalResource?: WritingCriterion;
  grammaticalRangeAndAccuracy?: WritingCriterion;
  suggestions: string[];
  improvedParagraph?: string;
  gradedAt?: string;
};

type SpeakingCriterion = {
  band: number;
  comment: string;
};

type SpeakingDetail = {
  submissionId?: string;
  overallBand?: number;
  taskText?: string;
  wordCount?: number;
  fluencyAndCoherence?: SpeakingCriterion;
  lexicalResource?: SpeakingCriterion;
  grammaticalRangeAndAccuracy?: SpeakingCriterion;
  pronunciation?: SpeakingCriterion;
  suggestions?: string[];
  transcript?: string;
  transcriptRaw?: string;
  transcriptNormalized?: string;
  improvedAnswer?: string;
  gradedAt?: string;
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/Not Given",
  "YES_NO_NOT_GIVEN": "Yes/No/Not Given",
  "MCQ_SINGLE": "Multiple Choice",
  "MCQ_MULTIPLE": "Multiple Selection",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Information",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Summary Completion",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Labelling",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Labelling",
};

function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function AttemptResultPage() {
  const { attemptId } = useParams() as { attemptId: string };
  const searchParams = useSearchParams();
  const source = (searchParams.get("source") ?? "attempt") as PageSource;

  const [attemptData, setAttemptData] = useState<AttemptResult | null>(null);
  const [writingDetail, setWritingDetail] = useState<WritingDetail | null>(
    null
  );
  const [speakingDetail, setSpeakingDetail] = useState<SpeakingDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [activeSkill, setActiveSkill] = useState<
    "READING" | "LISTENING" | "WRITING" | "SPEAKING"
  >("READING");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (source === "attempt") {
          const res = await getAttemptResult(attemptId as any);
          const raw = (res as any)?.data?.data ?? (res as any)?.data ?? res;

          const paper =
            (raw as any).paperWithAnswers ?? (raw as any).paper ?? null;
          const questionMetaById: Record<string, any> = {};

          if (paper?.sections) {
            for (const sec of paper.sections) {
              // Support both direct questions and questionGroups structure
              const questions = sec.questions ?? 
                (sec.questionGroups ?? []).flatMap((g: any) => g.questions ?? []);
              for (const q of questions) {
                if (!q?.id) continue;
                questionMetaById[String(q.id)] = {
                  idx: q.idx,
                  promptMd: q.promptMd ?? "",
                  explanationMd: q.explanationMd ?? "",
                  options: q.options ?? null,
                  skill: q.skill ?? sec.skill ?? "UNKNOWN",
                  questionType: q.type ?? q.questionType ?? "UNKNOWN",
                };
              }
            }
          }

          const answers: any[] =
            (raw as any).answers ??
            (raw as any).items ??
            (raw as any).questions ??
            [];

          const totalTimeSec =
            parseSecondsAny((raw as any).totalTime) ??
            parseTimeTaken((raw as any).timeTaken) ??
            parseSecondsAny((raw as any).timeUsedSec) ??
            0;

          const mapped: AttemptResult = {
            attemptId:
              (raw as any).attemptId ?? (raw as any).id ?? String(attemptId),
            status: (raw as any).status ?? "GRADED",
            finishedAt:
              (raw as any).gradedAt ??
              (raw as any).finishedAt ??
              (raw as any).submittedAt ??
              new Date().toISOString(),
            timeUsedSec: totalTimeSec,
            correctCount:
              (raw as any).correct ?? (raw as any).correctCount ?? 0,
            totalPoints: (raw as any).scoreRaw ?? (raw as any).totalPoints ?? 0,
            awardedTotal:
              (raw as any).scorePct ?? (raw as any).awardedTotal ?? 0,
            needsManualReview: (raw as any).needsManualReview ?? 0,
            bandScore: (raw as any).ieltsBand ?? (raw as any).bandScore,
            writingBand: (raw as any).writingBand,
            speakingBand: (raw as any).speakingBand,
            writingGrade: (raw as any).writingGrade ?? undefined,
            speakingGrade: (raw as any).speakingGrade ?? undefined,
            questions: answers.map((a: any, i: number) => {
              const qid = String(a.questionId ?? a.id ?? i + 1);
              const meta = questionMetaById[qid];
              const optionMap = meta?.options
                ? mapOptionsById(meta.options)
                : null;

              const selectedOptionIds = Array.isArray(a.selectedOptionIds)
                ? a.selectedOptionIds.map((v: any) => String(v))
                : [];

              const selectedText = mapAnswerContent({
                optionMap,
                ids: selectedOptionIds,
                fallbackText:
                  a.selectedAnswerText !== undefined &&
                  a.selectedAnswerText !== null
                    ? String(a.selectedAnswerText)
                    : "",
              });

              const correctOptionIds = Array.isArray(
                (a as any).correctOptionIds
              )
                ? (a as any).correctOptionIds.map((v: any) => String(v))
                : [];

              const correctText = mapAnswerContent({
                optionMap,
                ids: correctOptionIds,
                fallbackText:
                  a.correctAnswerText !== undefined &&
                  a.correctAnswerText !== null
                    ? String(a.correctAnswerText)
                    : "",
              });

              return {
                questionId: qid,
                skill: meta?.skill ?? "UNKNOWN",
                questionType: meta?.questionType ?? "UNKNOWN",
                index: a.index ?? meta?.idx ?? i + 1,
                promptMd: a.promptMd ?? meta?.promptMd ?? "",
                selectedOptionIds,
                selectedAnswerText: selectedText,
                correctAnswerText: correctText,
                isCorrect:
                  typeof a.isCorrect === "boolean" ? a.isCorrect : null,
                explanationMd: a.explanationMd ?? meta?.explanationMd ?? "",
                timeSpentSec:
                  a.timeSpentSec ?? a.elapsedSec ?? a.time ?? undefined,
              };
            }),
            totalTime: fmtMinSec(totalTimeSec),
          };

          setAttemptData(mapped);
          // Auto-detect skill from questions (e.g., LISTENING for listening exams)
          const firstSkill = mapped.questions?.[0]?.skill ?? "READING";
          setActiveSkill(firstSkill as any);
        } else if (source === "writing") {
          // ========= CASE 2: WRITING DETAIL =========
          const res = await getWritingHistoryById(attemptId);
          const raw = (res as any)?.data?.data ?? (res as any)?.data ?? res;

          const totalTimeSec = parseSecondsAny((raw as any).timeUsedSec) ?? 0;
          const overallBand = Number(raw.overallBand ?? 0);

          const mappedAttempt: AttemptResult = {
            attemptId: String(raw.submissionId ?? attemptId),
            status: "GRADED",
            finishedAt: raw.gradedAt ?? new Date().toISOString(),
            timeUsedSec: totalTimeSec,
            correctCount: 0,
            totalPoints: 0,
            awardedTotal: 0,
            needsManualReview: 0,
            bandScore: overallBand,
            writingBand: overallBand,
            speakingBand: undefined,
            questions: [],
            totalTime: fmtMinSec(totalTimeSec),
          };

          const detail: WritingDetail = {
            submissionId: String(raw.submissionId ?? attemptId),
            taskText: raw.taskText ?? "",
            essayRaw: raw.essayRaw ?? "",
            essayNormalized: raw.essayNormalized ?? "",
            wordCount: Number(raw.wordCount ?? 0),
            overallBand,
            taskResponse: raw.taskResponse,
            coherenceAndCohesion: raw.coherenceAndCohesion,
            lexicalResource: raw.lexicalResource,
            grammaticalRangeAndAccuracy: raw.grammaticalRangeAndAccuracy,
            suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
            improvedParagraph: raw.improvedParagraph ?? "",
            gradedAt: raw.gradedAt,
          };

          setAttemptData(mappedAttempt);
          setWritingDetail(detail);
        } else {
          const res = await getSpeakingHistoryById(attemptId);
          const raw = (res as any)?.data?.data ?? (res as any)?.data ?? res;

          const totalTimeSec = parseSecondsAny((raw as any).timeUsedSec) ?? 0;

          const overallBand = Number(
            raw.overallBand ?? raw.band ?? raw.speakingBand ?? 0
          );

          const mappedAttempt: AttemptResult = {
            attemptId: String(raw.submissionId ?? attemptId),
            status: "GRADED",
            finishedAt: raw.gradedAt ?? new Date().toISOString(),
            timeUsedSec: totalTimeSec,
            correctCount: 0,
            totalPoints: 0,
            awardedTotal: 0,
            needsManualReview: 0,
            bandScore: overallBand,
            writingBand: undefined,
            speakingBand: overallBand,
            questions: [],
            totalTime: fmtMinSec(totalTimeSec),
          };

          const detail: SpeakingDetail = {
            submissionId: raw.submissionId,
            overallBand,
            taskText: raw.taskText ?? "",
            wordCount: Number(raw.wordCount ?? 0),
            fluencyAndCoherence: raw.fluencyAndCoherence,
            lexicalResource: raw.lexicalResource,
            grammaticalRangeAndAccuracy: raw.grammaticalRangeAndAccuracy,
            pronunciation: raw.pronunciation,
            suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
            transcript:
              raw.transcript ??
              raw.transcriptNormalized ??
              raw.transcriptRaw ??
              "",
            transcriptRaw: raw.transcriptRaw ?? "",
            transcriptNormalized: raw.transcriptNormalized ?? "",
            improvedAnswer: raw.improvedAnswer ?? "",
            gradedAt: raw.gradedAt,
          };

          setAttemptData(mappedAttempt);
          setSpeakingDetail(detail);
        }
      } catch (e) {
        console.error("error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, source]);

  if (loading)
    return (
      <div className="p-6 text-center text-slate-500">Đang tải kết quả…</div>
    );

  if (!attemptData)
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

  const headerTitle =
    source === "attempt"
      ? "IELTS Result"
      : source === "writing"
      ? "Writing Result"
      : "Speaking Result";

  const overallBand =
    attemptData.bandScore ??
    attemptData.writingBand ??
    attemptData.speakingBand;

  if (source === "attempt") {
    const skillFiltered = attemptData.questions.filter(
      (q) => q.skill === activeSkill
    );

    const answeredCount = skillFiltered.filter(
      (q) => !!q.selectedAnswerText || (q.selectedOptionIds?.length ?? 0) > 0
    ).length;

    const blankCount = skillFiltered.length - answeredCount;

    const isProductiveSkill =
      activeSkill === "WRITING" || activeSkill === "SPEAKING";

    return (
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden text-black">
        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">
            {headerTitle}
          </h1>
          <p className="text-sm opacity-90">
            {new Date(attemptData.finishedAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="flex flex-col items-center py-10">
          <div className="relative w-40 h-40 rounded-full bg-gradient-to-b from-emerald-400 to-blue-400 text-white flex items-center justify-center shadow-lg">
            <span className="text-6xl font-extrabold">
              {typeof overallBand === "number" ? overallBand.toFixed(1) : "--"}
            </span>
          </div>
          <p className="mt-4 text-lg text-slate-700">Overall Band Score</p>
        </div>

        <div className="px-8 mb-6 flex gap-2 justify-center">
          {["READING", "LISTENING", "WRITING", "SPEAKING"].map((sk) => (
            <button
              key={sk}
              onClick={() => setActiveSkill(sk as any)}
              className={`px-4 py-2 rounded-lg text-sm border ${
                activeSkill === sk
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {sk}
            </button>
          ))}
        </div>

        {!isProductiveSkill && (
          <>
            <div className="px-8 pb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-700">
              <Stat label="Số câu đã trả lời">{answeredCount}</Stat>
              <Stat label="Câu bỏ trống">{blankCount}</Stat>
              <Stat label="Tổng thời gian">{attemptData.totalTime}</Stat>
              <Stat label="Số câu đúng">{attemptData.correctCount}</Stat>
            </div>

            {attemptData.needsManualReview > 0 && (
              <div className="mx-8 mb-8 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
                ⚠️ Có {attemptData.needsManualReview} câu cần chấm tay — band có
                thể thay đổi.
              </div>
            )}
          </>
        )}

        {isProductiveSkill ? (
          <ProductiveBandSection
            skill={activeSkill}
            band={
              activeSkill === "WRITING"
                ? attemptData.writingBand
                : attemptData.speakingBand
            }
            writingGrade={attemptData.writingGrade}
            speakingGrade={attemptData.speakingGrade}
          />
        ) : (
          <QuestionReview details={skillFiltered} />
        )}

        <div className="flex justify-center gap-4 pb-10">
          <button
            onClick={() => router.push(`/attempts/${attemptData.attemptId}/review`)}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Xem lại bài làm
          </button>
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

  if (source === "writing" && writingDetail) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden text-black">
        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-8 text-center">
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">
            {headerTitle}
          </h1>
          <p className="text-sm opacity-90">
            {writingDetail.gradedAt
              ? new Date(writingDetail.gradedAt).toLocaleString("vi-VN")
              : new Date().toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="flex flex-col items-center py-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-b from-emerald-400 to-blue-400 text-white flex items-center justify-center shadow-lg">
            <span className="text-4xl font-extrabold">
              {writingDetail.overallBand.toFixed(1)}
            </span>
          </div>
          <p className="mt-4 text-lg text-slate-700">Overall Writing Band</p>
          <p className="mt-1 text-sm text-slate-500">
            Word count: {writingDetail.wordCount}
          </p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <section className="bg-slate-50 border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              Task prompt
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {writingDetail.taskText || (
                <span className="italic text-slate-400">(Không có đề bài)</span>
              )}
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Bài viết của bạn
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {writingDetail.essayRaw || (
                  <span className="italic text-slate-400">
                    (Không có nội dung)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Phiên bản đã chuẩn hoá
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {writingDetail.essayNormalized || (
                  <span className="italic text-slate-400">
                    (Không có nội dung)
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            {writingDetail.taskResponse && (
              <CriterionCard
                title="Task Response"
                criterion={writingDetail.taskResponse}
              />
            )}
            {writingDetail.coherenceAndCohesion && (
              <CriterionCard
                title="Coherence & Cohesion"
                criterion={writingDetail.coherenceAndCohesion}
              />
            )}
            {writingDetail.lexicalResource && (
              <CriterionCard
                title="Lexical Resource"
                criterion={writingDetail.lexicalResource}
              />
            )}
            {writingDetail.grammaticalRangeAndAccuracy && (
              <CriterionCard
                title="Grammatical Range & Accuracy"
                criterion={writingDetail.grammaticalRangeAndAccuracy}
              />
            )}
          </section>

          {writingDetail.suggestions.length > 0 && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-emerald-900 mb-2">
                Gợi ý cải thiện
              </h2>
              <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                {writingDetail.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {writingDetail.improvedParagraph && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">
                Đoạn cải thiện gợi ý
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {writingDetail.improvedParagraph}
              </div>
            </section>
          )}
        </div>

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

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden text-black">
      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">
          {headerTitle}
        </h1>
        <p className="text-sm opacity-90">
          {speakingDetail?.gradedAt
            ? new Date(speakingDetail.gradedAt).toLocaleString("vi-VN")
            : new Date().toLocaleString("vi-VN")}
        </p>
      </div>

      <div className="flex flex-col items-center py-10">
        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-emerald-400 to-blue-400 text-white flex items-center justify-center shadow-lg">
          <span className="text-4xl font-extrabold">
            {typeof overallBand === "number" ? overallBand.toFixed(1) : "--"}
          </span>
        </div>
        <p className="mt-4 text-lg text-slate-700">Overall Speaking Band</p>
        {typeof speakingDetail?.wordCount === "number" && (
          <p className="mt-1 text-sm text-slate-500">
            Word count: {speakingDetail.wordCount}
          </p>
        )}
      </div>

      <div className="px-8 pb-8 space-y-6">
        {speakingDetail?.taskText && (
          <section className="bg-slate-50 border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              Task prompt
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {speakingDetail.taskText}
            </div>
          </section>
        )}

        {speakingDetail?.transcript && (
          <section className="bg-slate-50 border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              Transcript / Nội dung nói
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {speakingDetail.transcript}
            </div>
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-4">
          {speakingDetail?.fluencyAndCoherence && (
            <CriterionCard
              title="Fluency & Coherence"
              criterion={speakingDetail.fluencyAndCoherence}
            />
          )}
          {speakingDetail?.lexicalResource && (
            <CriterionCard
              title="Lexical Resource"
              criterion={speakingDetail.lexicalResource}
            />
          )}
          {speakingDetail?.grammaticalRangeAndAccuracy && (
            <CriterionCard
              title="Grammatical Range & Accuracy"
              criterion={speakingDetail.grammaticalRangeAndAccuracy}
            />
          )}
          {speakingDetail?.pronunciation && (
            <CriterionCard
              title="Pronunciation"
              criterion={speakingDetail.pronunciation}
            />
          )}
        </section>

        {speakingDetail?.suggestions &&
          speakingDetail.suggestions.length > 0 && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-emerald-900 mb-2">
                Gợi ý cải thiện
              </h2>
              <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                {speakingDetail.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

        {speakingDetail?.improvedAnswer && (
          <section className="bg-slate-50 border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              Câu trả lời gợi ý / cải thiện
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {speakingDetail.improvedAnswer}
            </div>
          </section>
        )}
      </div>

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

function ProductiveBandSection({
  skill,
  band,
  writingGrade,
  speakingGrade,
}: {
  skill: "WRITING" | "SPEAKING";
  band?: number;
  writingGrade?: WritingDetail;
  speakingGrade?: SpeakingDetail;
}) {
  const label = skill === "WRITING" ? "Writing band" : "Speaking band";

  return (
    <div className="px-8 pb-10">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">{label}</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-emerald-400 to-blue-400 text-white flex items-center justify-center shadow-lg">
          <span className="text-4xl font-extrabold">
            {typeof band === "number" ? band.toFixed(1) : "--"}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {typeof band === "number"
            ? "Điểm band cho kỹ năng này."
            : "Chưa có điểm band cho kỹ năng này."}
        </p>
      </div>

      {/* Writing Grade Details */}
      {skill === "WRITING" && writingGrade && (
        <div className="space-y-6">
          {writingGrade.taskText && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Task prompt</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{writingGrade.taskText}</div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            {writingGrade.taskResponse && (
              <CriterionCard title="Task Response" criterion={writingGrade.taskResponse} />
            )}
            {writingGrade.coherenceAndCohesion && (
              <CriterionCard title="Coherence & Cohesion" criterion={writingGrade.coherenceAndCohesion} />
            )}
            {writingGrade.lexicalResource && (
              <CriterionCard title="Lexical Resource" criterion={writingGrade.lexicalResource} />
            )}
            {writingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard title="Grammatical Range & Accuracy" criterion={writingGrade.grammaticalRangeAndAccuracy} />
            )}
          </section>

          {writingGrade.suggestions && writingGrade.suggestions.length > 0 && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2">Gợi ý cải thiện</h3>
              <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                {writingGrade.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {writingGrade.improvedParagraph && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Đoạn cải thiện gợi ý</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{writingGrade.improvedParagraph}</div>
            </section>
          )}
        </div>
      )}

      {/* Speaking Grade Details */}
      {skill === "SPEAKING" && speakingGrade && (
        <div className="space-y-6">
          {speakingGrade.taskText && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Task prompt</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{speakingGrade.taskText}</div>
            </section>
          )}

          {speakingGrade.transcript && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Transcript</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{speakingGrade.transcript}</div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            {speakingGrade.fluencyAndCoherence && (
              <CriterionCard title="Fluency & Coherence" criterion={speakingGrade.fluencyAndCoherence} />
            )}
            {speakingGrade.lexicalResource && (
              <CriterionCard title="Lexical Resource" criterion={speakingGrade.lexicalResource} />
            )}
            {speakingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard title="Grammatical Range & Accuracy" criterion={speakingGrade.grammaticalRangeAndAccuracy} />
            )}
            {speakingGrade.pronunciation && (
              <CriterionCard title="Pronunciation" criterion={speakingGrade.pronunciation} />
            )}
          </section>

          {speakingGrade.suggestions && speakingGrade.suggestions.length > 0 && (
            <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-2">Gợi ý cải thiện</h3>
              <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                {speakingGrade.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {speakingGrade.improvedAnswer && (
            <section className="bg-slate-50 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Câu trả lời cải thiện</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{speakingGrade.improvedAnswer}</div>
            </section>
          )}
        </div>
      )}
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
    () =>
      (details ?? [])
        .map(normalizeDetail)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
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
  
  // Track which items are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        <div className="space-y-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filtered.slice(0, 10).map((d) => (
            <ReviewItem 
              key={d.questionId} 
              data={d} 
              isExpanded={expandedIds.has(d.questionId)}
              onToggleExpand={() => toggleExpand(d.questionId)}
            />
          ))}
          {filtered.length > 10 && (
            <LoadMoreReviewItems 
              items={filtered.slice(10)} 
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Lazy load remaining items to avoid initial render bottleneck
function LoadMoreReviewItems({ 
  items, 
  expandedIds,
  onToggleExpand 
}: { 
  items: ReturnType<typeof normalizeDetail>[]; 
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  
  useEffect(() => {
    // Load 5 more items every 100ms for smooth progressive loading
    if (visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 5, items.length));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, items.length]);
  
  return (
    <>
      {items.slice(0, visibleCount).map((d) => (
        <ReviewItem 
          key={d.questionId} 
          data={d} 
          isExpanded={expandedIds.has(d.questionId)}
          onToggleExpand={() => onToggleExpand(d.questionId)}
        />
      ))}
      {visibleCount < items.length && (
        <div className="p-4 text-center text-slate-500">
          Đang tải thêm câu hỏi... ({visibleCount}/{items.length})
        </div>
      )}
    </>
  );
}

function ReviewItem({ 
  data, 
  isExpanded, 
  onToggleExpand 
}: { 
  data: ReturnType<typeof normalizeDetail>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  // Fall back to internal state if props not provided
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isExpanded !== undefined ? isExpanded : internalOpen;
  const toggleOpen = onToggleExpand || (() => setInternalOpen((v) => !v));

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
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-sm font-mono text-slate-500">
              Q{data.index ?? "?"}
            </span>
            {badge}
            {data.skill && data.skill !== "UNKNOWN" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {data.skill}
              </span>
            )}
            {data.questionType && data.questionType !== "UNKNOWN" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                {formatQuestionType(data.questionType)}
              </span>
            )}
            {typeof data.timeSpentSec === "number" && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-50 border text-slate-600">
                {fmtMinSec(data.timeSpentSec)}
              </span>
            )}
            <BookmarkButton 
              questionId={data.questionId} 
              questionContent={data.prompt}
              skill={data.skill}
              questionType={data.questionType}
            />
          </div>
          <div className="prose prose-slate max-w-none text-sm">
            <ReactMarkdown>{data.prompt}</ReactMarkdown>
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
          onClick={toggleOpen}
          className="shrink-0 inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md border hover:bg-slate-50"
        >
          {open ? <FiChevronUp /> : <FiChevronDown />}
          Giải thích
        </button>
      </div>

      {open && data.explanation && (
        <div className="mt-3 p-3 rounded bg-emerald-50 border border-emerald-100 text-sm text-emerald-900">
          <div className="prose prose-sm prose-emerald max-w-none prose-p:my-1 prose-strong:text-emerald-900">
            <ReactMarkdown>{data.explanation}</ReactMarkdown>
          </div>
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

function CriterionCard({
  title,
  criterion,
}: {
  title: string;
  criterion: WritingCriterion | SpeakingCriterion;
}) {
  return (
    <div className="bg-slate-50 border rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="text-sm font-bold text-emerald-700">
          Band {criterion.band.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">
        {criterion.comment}
      </p>
    </div>
  );
}

function normalizeDetail(d: AttemptQuestionResult) {
  const hasAnswer =
    !!d.selectedAnswerText || (d.selectedOptionIds?.length ?? 0) > 0;

  return {
    questionId: d.questionId,
    index: d.index,
    skill: d.skill ?? "UNKNOWN",
    questionType: d.questionType ?? "UNKNOWN",
    prompt: cleanQuestion(d.promptMd ?? ""),
    selectedText: d.selectedAnswerText ?? "",
    correctText: cleanAnswer(d.correctAnswerText ?? ""),
    explanation: d.explanationMd ?? "",
    isCorrect: typeof d.isCorrect === "boolean" ? d.isCorrect : null,
    state: hasAnswer ? "answered" : "none",
    timeSpentSec: d.timeSpentSec,
  };
}

function cleanQuestion(s: string) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "____ ")
    .replace(/\[blank[-_]\w+\]/gi, "____")
    .replace(/(label|step|flow|node)[-_ ]*\d*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAnswer(s: string) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/\[blank[-_]\w+\]/gi, "")
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    .replace(
      /^\s*(?:paragraph|info|step|flow|node|part|section)?[-_ ]*\w*:\s*/i,
      ""
    )
    .replace(/\b(?:paragraph|info)[-_ ]*\w*:\s*/gi, "")
    .replace(/^\s*[\w-]+:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtMinSec(totalSec: number) {
  if (!totalSec || totalSec < 0) return "—";
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}m${String(s).padStart(2, "0")}s`;
}

function parseTimeTaken(s: string | undefined) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

function parseSecondsAny(v: any) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;

  const m = v.match(/^(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type OptionMap = Record<string, any>;

function mapOptionsById(options: any[]): OptionMap {
  return options.reduce((acc, opt) => {
    if (opt?.id === undefined || opt?.id === null) return acc;
    acc[String(opt.id)] = opt;
    return acc;
  }, {} as OptionMap);
}

function extractOptionIdsFromText(
  text: string | undefined,
  optionMap: OptionMap
) {
  if (!text) return [];
  const trimmed = String(text).trim();
  if (!trimmed) return [];
  if (optionMap[trimmed]) return [trimmed];
  const parts = trimmed
    .split(/[\s|,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.filter((p) => !!optionMap[p]);
}

function mapAnswerContent({
  optionMap,
  ids,
  fallbackText,
}: {
  optionMap: OptionMap | null;
  ids?: string[];
  fallbackText?: string;
}) {
  if (!optionMap || Object.keys(optionMap).length === 0) {
    return fallbackText ?? "";
  }

  let normalizedIds = (ids ?? []).map((v) => String(v)).filter(Boolean);
  
  if (normalizedIds.length === 0 && fallbackText && fallbackText.startsWith("[")) {
    try {
      const parsed = JSON.parse(fallbackText);
      if (Array.isArray(parsed)) {
        normalizedIds = parsed.map((v: any) => String(v)).filter(Boolean);
      }
    } catch {
    }
  }
  
  const idsToUse =
    normalizedIds.length > 0
      ? normalizedIds
      : extractOptionIdsFromText(fallbackText, optionMap);

  const texts = idsToUse
    .map((id) => optionMap[id])
    .map(
      (opt) => opt?.contentMd ?? opt?.content ?? opt?.label ?? opt?.text ?? ""
    )
    .filter(Boolean);

  if (texts.length > 0) return texts.join(" | ");

  if (fallbackText && optionMap[fallbackText]) {
    const opt = optionMap[fallbackText];
    const text =
      opt?.contentMd ?? opt?.content ?? opt?.label ?? opt?.text ?? "";
    if (text) return text;
  }

  return fallbackText ?? "";
}
