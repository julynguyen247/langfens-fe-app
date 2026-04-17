"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getAttemptResult,
  getWritingHistoryById,
  getSpeakingHistoryById,
} from "@/utils/api";
import ReactMarkdown from "react-markdown";
import BookmarkButton from "@/components/BookmarkButton";
import { ResultHeader } from "@/components/result/ResultHeader";
import { ScoreCounter } from "@/components/ui/ScoreCounter";
import { SkillProgressBar } from "@/components/ui/SkillProgressBar";
import { SkillBadge } from "@/components/ui/SkillBadge";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { WritingComparativeTab } from './components/writing/WritingComparativeTab';
import { GrammarBatchView } from './components/grammar/GrammarBatchView';
import { useGrammarBatchExplain } from '@/hooks/useGrammarExplain';

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
  TRUE_FALSE_NOT_GIVEN: "True/False/Not Given",
  YES_NO_NOT_GIVEN: "Yes/No/Not Given",
  MCQ_SINGLE: "Multiple Choice",
  MCQ_MULTIPLE: "Multiple Selection",
  MATCHING_HEADING: "Matching Headings",
  MATCHING_INFORMATION: "Matching Information",
  MATCHING_FEATURES: "Matching Features",
  SUMMARY_COMPLETION: "Summary Completion",
  TABLE_COMPLETION: "Table Completion",
  SENTENCE_COMPLETION: "Sentence Completion",
  DIAGRAM_LABEL: "Diagram Labelling",
  SHORT_ANSWER: "Short Answer",
  MAP_LABEL: "Map Labelling",
};

function formatQuestionType(type: string): string {
  return (
    QUESTION_TYPE_LABELS[type] ||
    type
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ")
  );
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
  const [writingTab, setWritingTab] = useState<'grading' | 'comparative' | 'grammar'>('grading');

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
              const questions =
                sec.questions ??
                (sec.questionGroups ?? []).flatMap(
                  (g: any) => g.questions ?? []
                );
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
          const firstSkill = mapped.questions?.[0]?.skill ?? "READING";
          setActiveSkill(firstSkill as any);
        } else if (source === "writing") {
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
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p
          className="text-base font-bold text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Loading results...
        </p>
      </div>
    );

  if (!attemptData)
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <p className="text-base text-[var(--text-muted)]">
          No results found.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Go Home
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

    const accuracy =
      skillFiltered.length > 0
        ? Math.round(
            (attemptData.correctCount / skillFiltered.length) * 100
          )
        : 0;

    const isProductiveSkill =
      activeSkill === "WRITING" || activeSkill === "SPEAKING";

    const writingCriteria = attemptData.writingGrade
      ? [
          {
            code: "TR",
            name: "Task Response",
            score: attemptData.writingGrade.taskResponse?.band,
          },
          {
            code: "CC",
            name: "Coherence",
            score: attemptData.writingGrade.coherenceAndCohesion?.band,
          },
          {
            code: "LR",
            name: "Lexical",
            score: attemptData.writingGrade.lexicalResource?.band,
          },
          {
            code: "GRA",
            name: "Grammar",
            score:
              attemptData.writingGrade.grammaticalRangeAndAccuracy?.band,
          },
        ].filter((c) => c.score !== undefined)
      : [];

    const speakingCriteria = attemptData.speakingGrade
      ? [
          {
            code: "FC",
            name: "Fluency",
            score: attemptData.speakingGrade.fluencyAndCoherence?.band,
          },
          {
            code: "LR",
            name: "Lexical",
            score: attemptData.speakingGrade.lexicalResource?.band,
          },
          {
            code: "GRA",
            name: "Grammar",
            score:
              attemptData.speakingGrade.grammaticalRangeAndAccuracy?.band,
          },
          {
            code: "P",
            name: "Pronunciation",
            score: attemptData.speakingGrade.pronunciation?.band,
          },
        ].filter((c) => c.score !== undefined)
      : [];

    const productiveBand =
      activeSkill === "WRITING"
        ? attemptData.writingBand
        : attemptData.speakingBand;
    const productiveCriteria =
      activeSkill === "WRITING" ? writingCriteria : speakingCriteria;

    const metrics = isProductiveSkill
      ? productiveCriteria.map((c) => ({
          label: c.code,
          value: c.score?.toFixed(1) ?? "--",
        }))
      : [
          {
            label: "Correct",
            value: `${attemptData.correctCount}/${skillFiltered.length}`,
          },
          { label: "Skipped", value: String(blankCount) },
          { label: "Time", value: attemptData.totalTime },
          { label: "Accuracy", value: `${accuracy}%` },
        ];

    // Build band breakdowns for the progress bars
    const bandBreakdowns = isProductiveSkill
      ? productiveCriteria.map((c) => ({
          skill: c.name,
          score: c.score ?? 0,
        }))
      : undefined;

    return (
      <div className="min-h-screen bg-[var(--background)] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Score Reveal Section */}
          <ConfettiTrigger
            score={
              isProductiveSkill
                ? typeof productiveBand === "number"
                  ? productiveBand
                  : 0
                : typeof overallBand === "number"
                ? overallBand
                : 0
            }
            targetScore={6}
          />

          <ResultHeader
            skill={activeSkill}
            overallScore={
              isProductiveSkill
                ? typeof productiveBand === "number"
                  ? productiveBand
                  : "--"
                : typeof overallBand === "number"
                ? overallBand
                : "--"
            }
            date={new Date(attemptData.finishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            metrics={metrics}
            bandBreakdowns={bandBreakdowns}
          />

          {/* Skill Tabs */}
          <motion.div
            className="flex justify-center rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
          >
            {["READING", "LISTENING", "WRITING", "SPEAKING"].map((sk) => (
              <button
                key={sk}
                onClick={() => setActiveSkill(sk as any)}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-150 ${
                  activeSkill === sk
                    ? "text-[var(--primary)] border-b-[3px] border-[var(--primary)] bg-[var(--primary-light)]"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-[3px] border-transparent"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {sk.charAt(0) + sk.slice(1).toLowerCase()}
              </button>
            ))}
          </motion.div>

          {/* Manual Review Warning */}
          {!isProductiveSkill && attemptData.needsManualReview > 0 && (
            <motion.div
              className="p-4 rounded-[2rem] border-[3px] border-[var(--skill-writing-border)] bg-[var(--skill-writing-light)] text-[var(--skill-writing)] text-sm font-bold shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              {attemptData.needsManualReview} questions need manual review --
              band may change.
            </motion.div>
          )}

          {/* Content Body */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
          >
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

            {!isProductiveSkill && skillFiltered.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
                <span>No data for {activeSkill}</span>
              </div>
            )}
          </motion.div>

          {/* Footer Actions */}
          <motion.div
            className="text-center space-y-4 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            <button
              onClick={() => router.push("/home")}
              className="px-8 py-3 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Take New Placement Test
            </button>

            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  router.push(`/attempts/${attemptData.attemptId}/review`)
                }
                className="text-[var(--text-muted)] font-bold text-sm hover:text-[var(--primary)] transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Review All Answers
              </button>
              <span className="text-[var(--border)]">|</span>
              <button
                onClick={() => router.push("/practice")}
                className="text-[var(--text-muted)] font-bold text-sm hover:text-[var(--primary)] transition-colors"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Back to Library
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (source === "writing" && writingDetail) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (writingDetail.taskResponse) {
      if (writingDetail.taskResponse.band >= 6)
        strengths.push("Task Response");
      else weaknesses.push("Task Response");
    }
    if (writingDetail.coherenceAndCohesion) {
      if (writingDetail.coherenceAndCohesion.band >= 6)
        strengths.push("Coherence");
      else weaknesses.push("Coherence");
    }
    if (writingDetail.lexicalResource) {
      if (writingDetail.lexicalResource.band >= 6)
        strengths.push("Vocabulary");
      else weaknesses.push("Vocabulary");
    }
    if (writingDetail.grammaticalRangeAndAccuracy) {
      if (writingDetail.grammaticalRangeAndAccuracy.band >= 6)
        strengths.push("Grammar");
      else weaknesses.push("Grammar");
    }

    const writingBandBreakdowns = [
      writingDetail.taskResponse && {
        skill: "WRITING",
        score: writingDetail.taskResponse.band,
        label: "Task",
      },
      writingDetail.coherenceAndCohesion && {
        skill: "READING",
        score: writingDetail.coherenceAndCohesion.band,
        label: "Coherence",
      },
      writingDetail.lexicalResource && {
        skill: "LISTENING",
        score: writingDetail.lexicalResource.band,
        label: "Lexical",
      },
      writingDetail.grammaticalRangeAndAccuracy && {
        skill: "SPEAKING",
        score: writingDetail.grammaticalRangeAndAccuracy.band,
        label: "Grammar",
      },
    ].filter(Boolean) as { skill: string; score: number; label: string }[];

    return (
      <div className="min-h-screen bg-[var(--background)] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Confetti */}
          <ConfettiTrigger
            score={writingDetail.overallBand}
            targetScore={6}
          />

          {/* Score Reveal */}
          <motion.div
            className="flex flex-col items-center py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p
              className="text-sm font-bold text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Writing Assessment
            </p>
            <ScoreCounter
              value={writingDetail.overallBand}
              duration={1.5}
              decimals={1}
              className="text-6xl font-bold text-[var(--primary)]"
            />
            <p
              className="text-sm font-semibold text-[var(--text-muted)] mt-3"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Overall Band Score
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              {writingDetail.gradedAt &&
                new Date(writingDetail.gradedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
            </p>
          </motion.div>

          {/* Band Breakdown Bars */}
          <div className="max-w-md mx-auto space-y-3">
            {writingBandBreakdowns.map((b, idx) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2 * idx,
                  ease: "easeOut",
                }}
              >
                <SkillProgressBar
                  skill={b.label}
                  score={b.score}
                  delay={0.2 * idx}
                />
              </motion.div>
            ))}
          </div>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {writingBandBreakdowns.map((b, idx) => (
              <motion.div
                key={`card-${b.label}`}
                className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-4 flex flex-col items-center justify-center text-center hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.6 + idx * 0.1,
                  ease: "easeOut",
                }}
              >
                <span
                  className="text-3xl font-bold text-[var(--foreground)] mb-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {b.score.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {b.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Task Prompt */}
          <motion.div
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
          >
            <h3
              className="text-sm font-bold text-[var(--text-muted)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Task Prompt
            </h3>
            <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-wrap">
              {writingDetail.taskText || (
                <span className="italic text-[var(--text-muted)]">
                  (No task text)
                </span>
              )}
            </p>
          </motion.div>

          {/* Feedback Body */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
          >
            {/* LEFT: The Essay */}
            <div className="lg:col-span-2">
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8">
                <h3
                  className="text-sm font-bold text-[var(--text-muted)] mb-4"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Your Submission
                </h3>
                <div className="text-lg leading-loose text-[var(--foreground)] whitespace-pre-wrap">
                  {writingDetail.essayRaw || (
                    <span className="italic text-[var(--text-muted)]">
                      (No essay content)
                    </span>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t-[2px] border-[var(--border)] flex justify-between text-sm text-[var(--text-muted)]">
                  <span>{writingDetail.wordCount} words</span>
                  <span className="text-xs">
                    {writingDetail.gradedAt &&
                      new Date(writingDetail.gradedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="space-y-6">
              {/* Critique */}
              <div className="rounded-[2rem] border-[3px] border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--primary-light)] p-6">
                <h3
                  className="font-bold text-[var(--primary-dark)] mb-4"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Examiner&apos;s Critique
                </h3>
                <div className="space-y-4 text-sm text-[var(--text-body)] leading-relaxed">
                  {strengths.length > 0 && (
                    <div>
                      <p className="font-bold text-[var(--skill-speaking)] mb-1">
                        Strengths
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-body)] text-xs">
                        {strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {weaknesses.length > 0 && (
                    <div>
                      <p className="font-bold text-[var(--skill-writing)] mb-1">
                        Areas to Improve
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[var(--text-body)] text-xs">
                        {weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              {writingDetail.suggestions.length > 0 && (
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                  <h3
                    className="font-bold text-[var(--foreground)] mb-3"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Tips
                  </h3>
                  <ul className="text-xs text-[var(--text-body)] space-y-2">
                    {writingDetail.suggestions.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[var(--text-muted)]">
                          {i + 1}.
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Answer Toggle */}
              {writingDetail.improvedParagraph && (
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                  <h3
                    className="font-bold text-[var(--foreground)] mb-2"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Better Version?
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    See how an improved version would look.
                  </p>
                  <button
                    onClick={() => setShowModel(!showModel)}
                    className="w-full py-2.5 rounded-full bg-[var(--foreground)] text-white font-bold text-sm border-b-[4px] border-black hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {showModel ? "Hide Model Answer" : "View Model Answer"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Model Answer (Expandable) */}
          <AnimatePresence>
            {showModel && writingDetail.improvedParagraph && (
              <motion.div
                className="bg-[var(--foreground)] text-white rounded-[2rem] border-[3px] border-[var(--foreground)] shadow-[0_4px_0_rgba(0,0,0,0.3)] p-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3
                  className="font-bold mb-4"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Improved Version
                </h3>
                <p className="text-lg leading-loose opacity-90 whitespace-pre-wrap">
                  {writingDetail.improvedParagraph}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Criteria Cards */}
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>

          {/* Writing Analysis Tabs */}
          <motion.div
            className="flex justify-center rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0, ease: 'easeOut' }}
          >
            {(['grading', 'comparative', 'grammar'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setWritingTab(tab)}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-all duration-150 ${
                  writingTab === tab
                    ? 'text-[var(--primary)] border-b-[3px] border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-[3px] border-transparent'
                }`}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {tab === 'grading' ? 'Grading' : tab === 'comparative' ? 'Comparative' : 'Grammar'}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {writingTab === 'comparative' && (
            <WritingComparativeTab submissionId={attemptId || ''} />
          )}
          {writingTab === 'grammar' && (
            <GrammarBatchView
              results={[]}
              errorTexts={[]}
              isLoading={false}
              isError={false}
              failedCount={0}
              totalCount={0}
              onRetry={() => {}}
            />
          )}

          {/* Footer */}
          <div className="flex justify-center gap-4 pt-4 pb-10">
            <button
              onClick={() => router.push("/home")}
              className="px-8 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SPEAKING RESULT (source === "speaking")
  const speakingBandBreakdowns = [
    speakingDetail?.fluencyAndCoherence && {
      skill: "Fluency",
      score: speakingDetail.fluencyAndCoherence.band,
    },
    speakingDetail?.pronunciation && {
      skill: "Pronunciation",
      score: speakingDetail.pronunciation.band,
    },
    speakingDetail?.lexicalResource && {
      skill: "Vocabulary",
      score: speakingDetail.lexicalResource.band,
    },
    speakingDetail?.grammaticalRangeAndAccuracy && {
      skill: "Grammar",
      score: speakingDetail.grammaticalRangeAndAccuracy.band,
    },
  ].filter(Boolean) as { skill: string; score: number }[];

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Confetti */}
        <ConfettiTrigger
          score={typeof overallBand === "number" ? overallBand : 0}
          targetScore={6}
        />

        {/* Score Reveal Hero */}
        <motion.div
          className="flex flex-col items-center py-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2
            className="text-sm font-bold text-[var(--text-muted)] mb-1"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {headerTitle}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            {speakingDetail?.gradedAt
              ? new Date(speakingDetail.gradedAt).toLocaleString("vi-VN")
              : new Date().toLocaleString("vi-VN")}
          </p>

          {typeof overallBand === "number" ? (
            <ScoreCounter
              value={overallBand}
              duration={1.5}
              decimals={1}
              className="text-6xl font-bold text-[var(--primary)]"
            />
          ) : (
            <span
              className="text-6xl font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              --
            </span>
          )}
          <p
            className="text-sm font-semibold text-[var(--text-muted)] mt-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Overall Band Score
          </p>
          {typeof speakingDetail?.wordCount === "number" && (
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {speakingDetail.wordCount} words spoken
            </p>
          )}
        </motion.div>

        {/* Band Breakdown Bars */}
        <div className="max-w-md mx-auto space-y-3">
          {speakingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={b.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 * idx,
                ease: "easeOut",
              }}
            >
              <SkillProgressBar
                skill={b.skill}
                score={b.score}
                delay={0.2 * idx}
              />
            </motion.div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {speakingBandBreakdowns.map((b, idx) => (
            <motion.div
              key={`card-${b.skill}`}
              className="p-4 rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white text-center hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.6 + idx * 0.1,
                ease: "easeOut",
              }}
            >
              <span
                className="text-3xl font-bold text-[var(--primary)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {b.score?.toFixed(1) ?? "--"}
              </span>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-2">
                {b.skill}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transcript */}
        {speakingDetail?.transcript && (
          <motion.div
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
          >
            <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
              <h2
                className="text-sm font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Interview Transcript
              </h2>
            </div>
            <div className="p-6">
              {speakingDetail?.taskText && (
                <div className="mb-6">
                  <p className="text-[var(--text-muted)] italic text-sm mb-2">
                    Examiner asks:
                  </p>
                  <p className="text-[var(--text-body)] text-sm leading-relaxed">
                    &ldquo;{speakingDetail.taskText}&rdquo;
                  </p>
                </div>
              )}

              <div className="pl-4 border-l-[3px] border-[var(--primary)]">
                <p className="text-[var(--text-muted)] text-xs font-bold mb-2">
                  Your Response:
                </p>
                <p className="text-[var(--foreground)] font-medium text-lg leading-relaxed whitespace-pre-wrap">
                  {speakingDetail.transcript}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed Feedback Cards */}
        <div className="grid md:grid-cols-2 gap-4">
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

        {/* Suggestions */}
        {speakingDetail?.suggestions &&
          speakingDetail.suggestions.length > 0 && (
            <motion.div
              className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0, ease: "easeOut" }}
            >
              <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
                <h2
                  className="text-sm font-bold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Improvement Suggestions
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {speakingDetail.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-body)]"
                    >
                      <span className="text-[var(--primary)] shrink-0 font-bold">
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

        {/* Model Answer */}
        {speakingDetail?.improvedAnswer && (
          <motion.div
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
          >
            <div className="bg-[var(--background)] px-6 py-4 border-b-[2px] border-[var(--border)]">
              <h2
                className="text-sm font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Model Answer
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[var(--text-body)] text-sm leading-relaxed whitespace-pre-wrap">
                {speakingDetail.improvedAnswer}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center gap-4 pb-10">
          <button
            onClick={() => router.push("/home")}
            className="px-8 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confetti trigger component ─── */
function ConfettiTrigger({
  score,
  targetScore,
}: {
  score: number;
  targetScore: number;
}) {
  useEffect(() => {
    if (score >= targetScore) {
      const timer = setTimeout(() => {
        confetti({ particleCount: 100, spread: 70 });
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [score, targetScore]);
  return null;
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
      {/* Writing Grade Details */}
      {skill === "WRITING" && writingGrade && (
        <div className="space-y-6">
          {/* Task Prompt */}
          {writingGrade.taskText && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--text-muted)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Task Prompt
              </h3>
              <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-wrap">
                {writingGrade.taskText}
              </p>
            </section>
          )}

          {/* Criteria Cards Grid */}
          <section className="grid md:grid-cols-2 gap-4">
            {writingGrade.taskResponse && (
              <CriterionCard
                title="Task Response"
                criterion={writingGrade.taskResponse}
              />
            )}
            {writingGrade.coherenceAndCohesion && (
              <CriterionCard
                title="Coherence & Cohesion"
                criterion={writingGrade.coherenceAndCohesion}
              />
            )}
            {writingGrade.lexicalResource && (
              <CriterionCard
                title="Lexical Resource"
                criterion={writingGrade.lexicalResource}
              />
            )}
            {writingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard
                title="Grammatical Range & Accuracy"
                criterion={writingGrade.grammaticalRangeAndAccuracy}
              />
            )}
          </section>

          {/* Suggestions */}
          {writingGrade.suggestions && writingGrade.suggestions.length > 0 && (
            <section className="rounded-[2rem] border-[3px] border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--primary-light)] p-6">
              <h3
                className="font-bold text-[var(--primary-dark)] mb-3"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Improvement Suggestions
              </h3>
              <ul className="text-sm text-[var(--text-body)] space-y-2">
                {writingGrade.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--primary)] font-bold">
                      {i + 1}.
                    </span>
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
                className="w-full py-3 rounded-full bg-[var(--foreground)] text-white font-bold text-sm border-b-[4px] border-black hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {showModel ? "Hide Model Answer" : "View Model Answer"}
              </button>

              <AnimatePresence>
                {showModel && (
                  <motion.div
                    className="bg-[var(--foreground)] text-white rounded-[2rem] border-[3px] border-[var(--foreground)] shadow-[0_4px_0_rgba(0,0,0,0.3)] p-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3
                      className="font-bold mb-3"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Improved Version
                    </h3>
                    <p className="text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                      {writingGrade.improvedParagraph}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Speaking Grade Details */}
      {skill === "SPEAKING" && speakingGrade && (
        <div className="space-y-6">
          {speakingGrade.taskText && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Task prompt
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.taskText}
              </div>
            </section>
          )}

          {speakingGrade.transcript && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Transcript
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.transcript}
              </div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            {speakingGrade.fluencyAndCoherence && (
              <CriterionCard
                title="Fluency & Coherence"
                criterion={speakingGrade.fluencyAndCoherence}
              />
            )}
            {speakingGrade.lexicalResource && (
              <CriterionCard
                title="Lexical Resource"
                criterion={speakingGrade.lexicalResource}
              />
            )}
            {speakingGrade.grammaticalRangeAndAccuracy && (
              <CriterionCard
                title="Grammatical Range & Accuracy"
                criterion={speakingGrade.grammaticalRangeAndAccuracy}
              />
            )}
            {speakingGrade.pronunciation && (
              <CriterionCard
                title="Pronunciation"
                criterion={speakingGrade.pronunciation}
              />
            )}
          </section>

          {speakingGrade.suggestions &&
            speakingGrade.suggestions.length > 0 && (
              <section className="rounded-[2rem] border-[3px] border-[var(--skill-speaking-border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--skill-speaking-light)] p-6">
                <h3
                  className="text-sm font-bold text-[var(--skill-speaking)] mb-2"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Improvement suggestions
                </h3>
                <ul className="list-disc list-inside text-sm text-[var(--skill-speaking)] space-y-1">
                  {speakingGrade.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

          {speakingGrade.improvedAnswer && (
            <section className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--background)] p-6">
              <h3
                className="text-sm font-bold text-[var(--foreground)] mb-2"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Improved answer
              </h3>
              <div className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
                {speakingGrade.improvedAnswer}
              </div>
            </section>
          )}
        </div>
      )}
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

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
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
        <h3
          className="font-bold text-[var(--foreground)] text-lg"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Detailed Review
        </h3>
        <div className="flex gap-2 flex-wrap">
          <FilterBtn
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
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
        <div className="p-6 text-center text-[var(--text-muted)] border-[3px] border-[var(--border)] rounded-[2rem] bg-[var(--background)]">
          No question details available for this filter.
        </div>
      ) : (
        <div
          className="space-y-3"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          {filtered.slice(0, 10).map((d, idx) => (
            <motion.div
              key={d.questionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(idx * 0.05, 0.5),
                ease: "easeOut",
              }}
            >
              <ReviewItem
                data={d}
                isExpanded={expandedIds.has(d.questionId)}
                onToggleExpand={() => toggleExpand(d.questionId)}
              />
            </motion.div>
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

function LoadMoreReviewItems({
  items,
  expandedIds,
  onToggleExpand,
}: {
  items: ReturnType<typeof normalizeDetail>[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 5, items.length));
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
        <div className="p-4 text-center text-[var(--text-muted)]">
          Loading more questions... ({visibleCount}/{items.length})
        </div>
      )}
    </>
  );
}

function ReviewItem({
  data,
  isExpanded,
  onToggleExpand,
}: {
  data: ReturnType<typeof normalizeDetail>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isExpanded !== undefined ? isExpanded : internalOpen;
  const toggleOpen = onToggleExpand || (() => setInternalOpen((v) => !v));

  const isCorrect = data.isCorrect === true;
  const isWrong = data.isCorrect === false;
  const isSkipped = data.state === "none";

  const borderColor = isCorrect
    ? "var(--skill-speaking)"
    : isWrong
    ? "var(--destructive)"
    : "var(--border)";

  const statusLabel = isSkipped ? (
    <span className="text-[var(--text-muted)] text-sm font-bold">--</span>
  ) : isCorrect ? (
    <span className="px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] text-xs font-bold">
      Correct
    </span>
  ) : (
    <span className="px-3 py-1 rounded-full border-[2px] border-red-300 bg-red-50 text-red-600 text-xs font-bold">
      Wrong
    </span>
  );

  const numberBadge = (
    <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] border-[2px] border-[var(--primary)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
      {data.index ?? "?"}
    </span>
  );

  return (
    <div
      className="rounded-[2rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white mb-4 overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      style={{ borderColor, borderLeftWidth: "4px" }}
      onClick={toggleOpen}
    >
      {/* Collapsed Header */}
      <div className="px-5 py-4 flex items-center gap-3">
        {numberBadge}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          {data.skill && data.skill !== "UNKNOWN" && (
            <SkillBadge skill={data.skill} size="sm" />
          )}
          {data.questionType && data.questionType !== "UNKNOWN" && (
            <span className="px-3 py-0.5 rounded-full border-[2px] border-[var(--skill-writing-border)] text-xs font-bold bg-[var(--skill-writing-light)] text-[var(--skill-writing)]">
              {formatQuestionType(data.questionType)}
            </span>
          )}
          {typeof data.timeSpentSec === "number" && (
            <span
              className="px-3 py-0.5 rounded-full border-[2px] border-[var(--border)] text-xs font-bold bg-white text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {fmtMinSec(data.timeSpentSec)}
            </span>
          )}
        </div>
        {statusLabel}
        <BookmarkButton
          questionId={data.questionId}
          questionContent={data.prompt}
          skill={data.skill}
          questionType={data.questionType}
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Question text */}
            <div className="px-5 pb-4 border-t-[2px] border-[var(--border)] pt-4">
              <div className="prose prose-sm max-w-none text-[var(--foreground)]">
                <ReactMarkdown>{data.prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
              {/* Your Answer */}
              <div className="p-5 bg-white">
                <p className="text-xs font-bold text-[var(--text-muted)] mb-2">
                  Your Answer
                </p>
                <div
                  className={`text-base font-medium flex items-center gap-2 ${
                    isSkipped
                      ? "text-[var(--text-muted)] italic"
                      : isCorrect
                      ? "text-[var(--skill-speaking)]"
                      : "text-[var(--destructive)]"
                  }`}
                >
                  <span
                    className={
                      !isCorrect && !isSkipped
                        ? "line-through decoration-2 decoration-red-200"
                        : ""
                    }
                  >
                    {data.selectedText || "-- No Answer --"}
                  </span>
                </div>
              </div>

              {/* Correct Answer */}
              <div className="p-5 bg-[var(--primary-light)] min-h-[72px]">
                <p className="text-xs font-bold text-[var(--text-muted)] mb-2">
                  Correct Key
                </p>
                <div
                  className={`text-base font-bold ${
                    data.correctText
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)] italic font-normal text-sm"
                  }`}
                >
                  {data.correctText || "(Answer key not available)"}
                </div>
              </div>
            </div>

            {/* Explanation */}
            {data.explanation && (
              <div className="px-5 py-4 bg-[var(--primary-light)] border-t-[2px] border-[var(--primary)]">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--primary-dark)] mb-1">
                      Why is this correct?
                    </p>
                    <div className="prose prose-sm max-w-none text-[var(--text-body)]">
                      <ReactMarkdown>{data.explanation}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
      className={`px-4 py-1.5 rounded-full text-sm font-bold border-[2px] transition-all duration-150 ${
        active
          ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] border-b-[4px] shadow-[0_2px_0_rgba(0,0,0,0.1)]"
          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
      }`}
      style={{ fontFamily: "var(--font-sans)" }}
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
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3
          className="text-sm font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {title}
        </h3>
        <span
          className="px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] text-sm font-bold"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Band {criterion.band.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-[var(--text-body)] whitespace-pre-wrap">
        {criterion.comment}
      </p>
    </motion.div>
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
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/\[blank[-_]\w+\]/gi, "")
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    .replace(
      /^\s*(?:paragraph|info|step|flow|node|part|section)?[-_ ]*\w*:\s*/i,
      ""
    )
    .replace(/\b(?:paragraph|info)[-_ ]*\w*:\s*/gi, "")
    .replace(/^feature[-_]?q?\d*:\s*/i, "")
    .replace(/^q\d+:\s*/i, "")
    .replace(/^(heading|item|answer|key|option)[-_]?\d*:\s*/gi, "")
    .replace(/^[\w-]+:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }

  if (/^([A-Za-z0-9]+)\/\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  }

  return clean;
}

function fmtMinSec(totalSec: number) {
  if (!totalSec || totalSec < 0) return "--";
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

  if (
    normalizedIds.length === 0 &&
    fallbackText &&
    fallbackText.startsWith("[")
  ) {
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
