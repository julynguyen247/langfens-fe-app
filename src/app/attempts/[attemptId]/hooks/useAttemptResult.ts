import { useEffect, useState } from "react";
import {
  getAttemptResult,
  getWritingHistoryById,
  getSpeakingHistoryById,
} from "@/utils/api";
import type {
  PageSource,
  AttemptResult,
  WritingDetail,
  SpeakingDetail,
} from "../types";
import {
  fmtMinSec,
  parseTimeTaken,
  parseSecondsAny,
  mapOptionsById,
  mapAnswerContent,
} from "../utils";

export function useAttemptResult(attemptId: string, source: PageSource) {
  const [attemptData, setAttemptData] = useState<AttemptResult | null>(null);
  const [writingDetail, setWritingDetail] = useState<WritingDetail | null>(
    null
  );
  const [speakingDetail, setSpeakingDetail] = useState<SpeakingDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);

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

  return { attemptData, writingDetail, speakingDetail, loading, activeSkill, setActiveSkill };
}
