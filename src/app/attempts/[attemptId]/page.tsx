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
import { ResultHeader } from "@/components/result/ResultHeader";

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
  const [showModel, setShowModel] = useState(false);

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
    const accuracy = skillFiltered.length > 0 
      ? Math.round((attemptData.correctCount / skillFiltered.length) * 100) 
      : 0;

    const isProductiveSkill =
      activeSkill === "WRITING" || activeSkill === "SPEAKING";

    // Get criteria for productive skills
    const writingCriteria = attemptData.writingGrade ? [
      { code: "TR", name: "Task Response", score: attemptData.writingGrade.taskResponse?.band },
      { code: "CC", name: "Coherence", score: attemptData.writingGrade.coherenceAndCohesion?.band },
      { code: "LR", name: "Lexical", score: attemptData.writingGrade.lexicalResource?.band },
      { code: "GRA", name: "Grammar", score: attemptData.writingGrade.grammaticalRangeAndAccuracy?.band },
    ].filter(c => c.score !== undefined) : [];

    const speakingCriteria = attemptData.speakingGrade ? [
      { code: "FC", name: "Fluency", score: attemptData.speakingGrade.fluencyAndCoherence?.band },
      { code: "LR", name: "Lexical", score: attemptData.speakingGrade.lexicalResource?.band },
      { code: "GRA", name: "Grammar", score: attemptData.speakingGrade.grammaticalRangeAndAccuracy?.band },
      { code: "P", name: "Pronunciation", score: attemptData.speakingGrade.pronunciation?.band },
    ].filter(c => c.score !== undefined) : [];

    const productiveBand = activeSkill === "WRITING" ? attemptData.writingBand : attemptData.speakingBand;
    const productiveCriteria = activeSkill === "WRITING" ? writingCriteria : speakingCriteria;

    // Metrics based on skill type
    const metrics = isProductiveSkill 
      ? productiveCriteria.map(c => ({ label: c.code, value: c.score?.toFixed(1) ?? "--" }))
      : [
          { label: "Correct", value: `${attemptData.correctCount}/${skillFiltered.length}` },
          { label: "Skipped", value: String(blankCount) },
          { label: "Time", value: attemptData.totalTime },
          { label: "Accuracy", value: `${accuracy}%` },
        ];

    return (
      <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans">
        {/* THE MASTER CARD - SPA Style */}
        <div className="max-w-6xl mx-auto bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">

          {/* A. HEADER - Using Shared Component */}
          <div className="p-10 border-b border-slate-100">
            <ResultHeader
              skill={activeSkill}
              overallScore={isProductiveSkill
                ? (typeof productiveBand === "number" ? productiveBand : "--")
                : (typeof overallBand === "number" ? overallBand : "--")
              }
              date={new Date(attemptData.finishedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric"
              })}
              metrics={metrics}
            />
          </div>

          {/* B. SKILL TABS (Switcher) */}
          <div className="flex justify-center bg-slate-50/50 border-b border-slate-100">
            {["READING", "LISTENING", "WRITING", "SPEAKING"].map((sk) => (
              <button
                key={sk}
                onClick={() => setActiveSkill(sk as any)}
                className={`px-10 py-5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
                  activeSkill === sk
                    ? "text-[#3B82F6] border-b-2 border-[#3B82F6] bg-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                }`}
              >
                {sk}
              </button>
            ))}
          </div>

          {/* Manual Review Warning */}
          {!isProductiveSkill && attemptData.needsManualReview > 0 && (
            <div className="mx-10 mt-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              {attemptData.needsManualReview} questions need manual review — band may change.
            </div>
          )}

          {/* C. CONTENT BODY (Polymorphic View) */}
          <div className="p-10 bg-white min-h-[500px]">
            {isProductiveSkill ? (
              <ProductiveBandSection
                skill={activeSkill}
                band={productiveBand}
                writingGrade={attemptData.writingGrade}
                speakingGrade={attemptData.speakingGrade}
              />
            ) : (
              <QuestionReview details={skillFiltered} />
            )}

            {/* Empty State Handler */}
            {!isProductiveSkill && skillFiltered.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                <span className="material-symbols-rounded text-2xl">do_not_disturb_on</span>
                <span>No data for {activeSkill}</span>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="text-center mt-8 space-y-4">
          {/* Primary Action */}
          <button
            onClick={() => router.push("/home")}
            className="bg-[#3B82F6] text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-base">refresh</span>
            Take New Placement Test
          </button>
          
          {/* Secondary Links */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push(`/attempts/${attemptData.attemptId}/review`)}
              className="text-slate-500 font-bold text-sm hover:text-[#3B82F6] transition-colors"
            >
              ← Review All Answers
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => router.push("/practice")}
              className="text-slate-500 font-bold text-sm hover:text-[#3B82F6] transition-colors"
            >
              Back to Library →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (source === "writing" && writingDetail) {
    // Build strengths/weaknesses for critique
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (writingDetail.taskResponse) {
      if (writingDetail.taskResponse.band >= 6) strengths.push("Task Response");
      else weaknesses.push("Task Response");
    }
    if (writingDetail.coherenceAndCohesion) {
      if (writingDetail.coherenceAndCohesion.band >= 6) strengths.push("Coherence");
      else weaknesses.push("Coherence");
    }
    if (writingDetail.lexicalResource) {
      if (writingDetail.lexicalResource.band >= 6) strengths.push("Vocabulary");
      else weaknesses.push("Vocabulary");
    }
    if (writingDetail.grammaticalRangeAndAccuracy) {
      if (writingDetail.grammaticalRangeAndAccuracy.band >= 6) strengths.push("Grammar");
      else weaknesses.push("Grammar");
    }



    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Score Header - Examiner's Report Style */}
        <div className="bg-white border-b border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Big Score */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded text-xl text-slate-400">edit_note</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Writing Assessment
                </span>
              </div>
              <div className="text-8xl font-serif font-bold text-[#3B82F6] leading-none">
                {writingDetail.overallBand.toFixed(1)}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Overall Band Score
              </p>
            </div>

            {/* Right: Criteria Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {writingDetail.taskResponse && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center min-w-[90px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Task</p>
                  <p className="text-2xl font-bold text-slate-800">{writingDetail.taskResponse.band.toFixed(1)}</p>
                </div>
              )}
              {writingDetail.coherenceAndCohesion && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center min-w-[90px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Coherence</p>
                  <p className="text-2xl font-bold text-slate-800">{writingDetail.coherenceAndCohesion.band.toFixed(1)}</p>
                </div>
              )}
              {writingDetail.lexicalResource && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center min-w-[90px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Lexical</p>
                  <p className="text-2xl font-bold text-slate-800">{writingDetail.lexicalResource.band.toFixed(1)}</p>
                </div>
              )}
              {writingDetail.grammaticalRangeAndAccuracy && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center min-w-[90px]">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Grammar</p>
                  <p className="text-2xl font-bold text-slate-800">{writingDetail.grammaticalRangeAndAccuracy.band.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task Prompt - Subtle */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-rounded text-slate-400">description</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Prompt</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {writingDetail.taskText || <span className="italic text-slate-400">(No task text)</span>}
          </p>
        </div>

        {/* Feedback Body - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: The Essay (Paper View) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Your Submission
              </h3>
              <div className="font-serif text-lg leading-loose text-slate-800 whitespace-pre-wrap">
                {writingDetail.essayRaw || <span className="italic text-slate-400">(No essay content)</span>}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-rounded text-base">notes</span>
                  {writingDetail.wordCount} words
                </span>
                <span className="text-xs text-slate-400">
                  {writingDetail.gradedAt && new Date(writingDetail.gradedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Examiner's Notes (Sidebar) */}
          <div className="space-y-6">
            {/* Examiner's Critique */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
              <h3 className="flex items-center gap-2 font-bold text-blue-700 mb-4">
                <span className="material-symbols-rounded text-xl">psychology</span>
                Examiner's Critique
              </h3>
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                {strengths.length > 0 && (
                  <div>
                    <p className="font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-base">check_circle</span>
                      Strengths
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                      {strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div>
                    <p className="font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-rounded text-base">error</span>
                      Areas to Improve
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                      {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {writingDetail.suggestions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                  <span className="material-symbols-rounded text-amber-500">lightbulb</span>
                  Tips
                </h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  {writingDetail.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Answer Toggle */}
            {writingDetail.improvedParagraph && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-800 mb-2">Better Version?</h3>
                <p className="text-xs text-slate-500 mb-4">See how an improved version would look.</p>
                <button
                  onClick={() => setShowModel(!showModel)}
                  className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-rounded text-base">{showModel ? "visibility_off" : "visibility"}</span>
                  {showModel ? "Hide Model Answer" : "View Model Answer"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Answer (Expandable) */}
        {showModel && writingDetail.improvedParagraph && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-rounded text-amber-400">auto_awesome</span>
              <h3 className="font-bold">Improved Version</h3>
            </div>
            <p className="font-serif text-lg leading-loose opacity-90 whitespace-pre-wrap">
              {writingDetail.improvedParagraph}
            </p>
          </div>
        )}

        {/* Detailed Criteria Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {writingDetail.taskResponse && (
            <CriterionCard title="Task Response" criterion={writingDetail.taskResponse} />
          )}
          {writingDetail.coherenceAndCohesion && (
            <CriterionCard title="Coherence & Cohesion" criterion={writingDetail.coherenceAndCohesion} />
          )}
          {writingDetail.lexicalResource && (
            <CriterionCard title="Lexical Resource" criterion={writingDetail.lexicalResource} />
          )}
          {writingDetail.grammaticalRangeAndAccuracy && (
            <CriterionCard title="Grammatical Range & Accuracy" criterion={writingDetail.grammaticalRangeAndAccuracy} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      
      {/* 1. REPORT CARD HERO - Classic Academic Style */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-10 text-center mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
          {headerTitle}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {speakingDetail?.gradedAt
            ? new Date(speakingDetail.gradedAt).toLocaleString("vi-VN")
            : new Date().toLocaleString("vi-VN")}
        </p>
        
        {/* Large Serif Band Score */}
        <div className="inline-block">
          <span className="text-7xl font-serif font-bold text-[#3B82F6]">
            {typeof overallBand === "number" ? overallBand.toFixed(1) : "--"}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-3">
          Overall Speaking Band
        </p>
        {typeof speakingDetail?.wordCount === "number" && (
          <p className="text-sm text-slate-500 mt-2">
            {speakingDetail.wordCount} words spoken
          </p>
        )}
      </div>

      {/* 2. INTERVIEW TRANSCRIPT (Court Transcript Style) */}
      {speakingDetail?.transcript && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Interview Transcript
            </h2>
          </div>
          {/* Content */}
          <div className="p-6">
            {/* Task/Prompt (Examiner) */}
            {speakingDetail?.taskText && (
              <div className="mb-6">
                <p className="text-slate-500 italic text-sm mb-2">
                  Examiner asks:
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  "{speakingDetail.taskText}"
                </p>
              </div>
            )}
            
            {/* Candidate Response */}
            <div className="pl-4 border-l-2 border-blue-200">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Your Response:
              </p>
              <p className="text-slate-900 font-medium text-lg leading-relaxed whitespace-pre-wrap">
                {speakingDetail.transcript}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SPEAKING CRITERIA STATS - Clean Cards with Serif Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {speakingDetail?.fluencyAndCoherence && (
          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 text-center">
            <span className="text-3xl font-serif font-bold text-[#3B82F6]">
              {speakingDetail.fluencyAndCoherence.band?.toFixed(1) ?? "--"}
            </span>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Fluency</p>
          </div>
        )}
        {speakingDetail?.pronunciation && (
          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 text-center">
            <span className="text-3xl font-serif font-bold text-[#3B82F6]">
              {speakingDetail.pronunciation.band?.toFixed(1) ?? "--"}
            </span>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Pronunciation</p>
          </div>
        )}
        {speakingDetail?.lexicalResource && (
          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 text-center">
            <span className="text-3xl font-serif font-bold text-[#3B82F6]">
              {speakingDetail.lexicalResource.band?.toFixed(1) ?? "--"}
            </span>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Vocabulary</p>
          </div>
        )}
        {speakingDetail?.grammaticalRangeAndAccuracy && (
          <div className="p-4 border border-slate-100 rounded-lg bg-slate-50 text-center">
            <span className="text-3xl font-serif font-bold text-[#3B82F6]">
              {speakingDetail.grammaticalRangeAndAccuracy.band?.toFixed(1) ?? "--"}
            </span>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Grammar</p>
          </div>
        )}
      </div>

      {/* 4. DETAILED FEEDBACK CARDS */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
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
      </div>

      {/* 5. SUGGESTIONS */}
      {speakingDetail?.suggestions && speakingDetail.suggestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Improvement Suggestions
            </h2>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {speakingDetail.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-blue-600 shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 6. MODEL ANSWER */}
      {speakingDetail?.improvedAnswer && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Model Answer
            </h2>
          </div>
          <div className="p-4">
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {speakingDetail.improvedAnswer}
            </p>
          </div>
        </div>
      )}

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
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="space-y-6">

      {/* Writing Grade Details - Simple Form */}
      {skill === "WRITING" && writingGrade && (
        <div className="space-y-6">
          {/* Task Prompt */}
          {writingGrade.taskText && (
            <section className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded text-slate-400">description</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Prompt</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {writingGrade.taskText}
              </p>
            </section>
          )}

          {/* Criteria Cards Grid */}
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

          {/* Suggestions */}
          {writingGrade.suggestions && writingGrade.suggestions.length > 0 && (
            <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
              <h3 className="flex items-center gap-2 font-bold text-blue-700 mb-3">
                <span className="material-symbols-rounded">lightbulb</span>
                Improvement Suggestions
              </h3>
              <ul className="text-sm text-slate-700 space-y-2">
                {writingGrade.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-400 font-bold">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Improved Paragraph Toggle */}
          {writingGrade.improvedParagraph && (
            <>
              <button
                onClick={() => setShowModel(!showModel)}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded text-base">{showModel ? "visibility_off" : "auto_awesome"}</span>
                {showModel ? "Hide Model Answer" : "View Model Answer"}
              </button>

              {showModel && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-rounded text-amber-400">auto_awesome</span>
                    <h3 className="font-bold">Improved Version</h3>
                  </div>
                  <p className="font-serif text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                    {writingGrade.improvedParagraph}
                  </p>
                </div>
              )}
            </>
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
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h3 className="font-bold text-slate-800 text-lg">Detailed Review</h3>
        <div className="flex gap-2 flex-wrap">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            All ({normalized.length})
          </FilterBtn>
          <FilterBtn
            active={filter === "correct"}
            onClick={() => setFilter("correct")}
          >
            Correct ({normalized.filter((d) => d.isCorrect === true).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "wrong"}
            onClick={() => setFilter("wrong")}
          >
            Wrong ({normalized.filter((d) => d.isCorrect === false).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "none"}
            onClick={() => setFilter("none")}
          >
            Skipped ({normalized.filter((d) => d.state === "none").length})
          </FilterBtn>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-slate-500 border rounded-lg bg-slate-50">
          No question details available for this filter.
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isExpanded !== undefined ? isExpanded : internalOpen;
  const toggleOpen = onToggleExpand || (() => setInternalOpen((v) => !v));

  const isCorrect = data.isCorrect === true;
  const isSkipped = data.state === "none";
  
  // Clean border - always slate for classic academic look
  const borderColor = "border-slate-200";

  // Status icon instead of loud badges
  const statusIcon = isSkipped ? (
    <span className="text-slate-400 text-lg">—</span>
  ) : isCorrect ? (
    <span className="text-green-600 text-lg">✓</span>
  ) : (
    <span className="text-red-500 text-lg">✗</span>
  );
  
  // Question number badge - simple slate style
  const numberBadge = (
    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
      {data.index ?? "?"}
    </span>
  );

  return (
    <div className={`bg-white border rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow ${borderColor}`}>
      {/* Header */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-start gap-3">
        {numberBadge}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {data.skill && data.skill !== "UNKNOWN" && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {data.skill}
                </span>
              )}
              {data.questionType && data.questionType !== "UNKNOWN" && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">
                  {formatQuestionType(data.questionType)}
                </span>
              )}
              {typeof data.timeSpentSec === "number" && (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                  ⏱ {fmtMinSec(data.timeSpentSec)}
                </span>
              )}
            </div>
            {statusIcon}
          </div>
          <div className="prose prose-slate prose-sm max-w-none text-slate-800">
            <ReactMarkdown>{data.prompt}</ReactMarkdown>
          </div>
        </div>
        <BookmarkButton 
          questionId={data.questionId} 
          questionContent={data.prompt}
          skill={data.skill}
          questionType={data.questionType}
        />
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Your Answer */}
        <div className="p-4 bg-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Your Answer
          </p>
          <div className={`text-base font-medium flex items-center gap-2 ${
            isSkipped 
              ? "text-slate-400 italic" 
              : isCorrect 
                ? "text-green-600" 
                : "text-red-500"
          }`}>
            {!isCorrect && !isSkipped && (
              <span className="text-red-400">✗</span>
            )}
            <span className={!isCorrect && !isSkipped ? "line-through decoration-2 decoration-red-200" : ""}>
              {data.selectedText || "— No Answer —"}
            </span>
          </div>
        </div>

        {/* Correct Answer - Classic Blue Style */}
        <div className="p-4 bg-blue-50/30 min-h-[72px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Correct Key
          </p>
          <div className={`text-base font-bold ${data.correctText ? "text-[#3B82F6]" : "text-slate-400 italic font-normal text-sm"}`}>
            {data.correctText || "(Answer key not available)"}
          </div>
        </div>
      </div>

      {/* Explanation Toggle */}
      {data.explanation && (
        <>
          <button
            onClick={toggleOpen}
            className="w-full px-4 py-2 text-sm text-slate-600 bg-slate-50 border-t border-slate-100 hover:bg-slate-100 transition flex items-center justify-center gap-2"
          >
            {open ? <FiChevronUp /> : <FiChevronDown />}
            {open ? "Hide Explanation" : "Show Explanation"}
          </button>

          {open && (
            <div className="px-4 py-3 bg-blue-50/50 border-t border-blue-100">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">💡</span>
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase mb-1">Why is this correct?</p>
                  <div className="prose prose-sm prose-slate max-w-none text-slate-700">
                    <ReactMarkdown>{data.explanation}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
  if (!s) return "";
  
  let clean = String(s)
    // Normalize newlines
    .replace(/\\n/g, "\n")
    // Remove blank-X: prefixes
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/\[blank[-_]\w+\]/gi, "")
    // Remove label-X: prefixes
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    // Remove paragraph/info/step/flow/node/part/section prefixes
    .replace(/^\s*(?:paragraph|info|step|flow|node|part|section)?[-_ ]*\w*:\s*/i, "")
    .replace(/\b(?:paragraph|info)[-_ ]*\w*:\s*/gi, "")
    // Remove "feature-qX:" prefix (e.g., feature-q1:, feature_q2:)
    .replace(/^feature[-_]?q?\d*:\s*/i, "")
    // Remove "q1:", "q2:" etc
    .replace(/^q\d+:\s*/i, "")
    // Remove "heading-X:", "item-X:" etc
    .replace(/^(heading|item|answer|key|option)[-_]?\d*:\s*/gi, "")
    // Remove general "key:" prefix if still present
    .replace(/^[\w-]+:\s*/, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
  
  // Handle "D / D" or "Value / Value" patterns - take first value
  if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }
  
  // Also handle "D/D" without spaces
  if (/^([A-Za-z0-9]+)\/\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  }
  
  return clean;
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
