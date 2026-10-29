"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAttemptResult } from "../resultApi";
import { decodeAnswer, encodeAnswer, hasAnswer, sectionQuestions } from "../contract";
import type { AttemptResultData, ResultFilterType } from "../types";
import { startAttempt } from "@/services/attempts";
import { useAttemptStore } from "@/stores/useAttemptStore";
import type { RagFeedbackEnvelope } from "@/types/rag";
import QuestionPanel from "./QuestionPanel";
import PassageView from "./PassageView";
import AudioPlayer from "./AudioPlayer";

export function AttemptReview({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const setAttempt = useAttemptStore(s => s.setAttempt);
  const [result, setResult] = useState<AttemptResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [filter, setFilter] = useState<ResultFilterType>("ALL");
  const [retaking, setRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResult(null); setError(null); setActiveSection(0); setFilter("ALL");
    fetchAttemptResult(attemptId).then(data => { if (!cancelled) setResult(data); }, () => {
      if (!cancelled) setError("Could not load the attempt review. Please try again.");
    });
    return () => { cancelled = true; };
  }, [attemptId]);

  const questions = useMemo(() => result?.paper.sections.flatMap(sectionQuestions) ?? [], [result]);
  const byId = useMemo(() => new Map((result?.answers ?? []).map(a => [a.questionId, a])), [result]);
  const initialAnswers = useMemo(() => Object.fromEntries(questions.filter(q => q.id).map(q => [q.id!, encodeAnswer(decodeAnswer(byId.get(q.id!), q))])), [questions, byId]);
  const reviewData = useMemo(() => questions.filter(q => q.id).map(q => {
    const answer = byId.get(q.id!);
    return { questionId: q.id!, isCorrect: answer?.isCorrect ?? null,
      correctAnswer: answer?.correctAnswerText ?? undefined,
      explanation: q.explanationMd ?? undefined,
      ragFeedback: answer?.ragFeedback as RagFeedbackEnvelope | undefined };
  }), [questions, byId]);
  const status = (id?: string) => {
    const answer = id ? byId.get(id) : undefined;
    if (answer?.isCorrect === true) return "CORRECT";
    if (!hasAnswer(answer)) return "UNANSWERED";
    return answer?.isCorrect === false ? "INCORRECT" : "NOT_GRADED";
  };
  const section = result?.paper.sections[activeSection];
  const visibleQuestions = section ? sectionQuestions(section).filter(q => filter === "ALL" || status(q.id) === filter) : [];
  const retake = async () => {
    if (!result?.examId || retaking) return;
    const skill = questions.find(q => ["READING", "LISTENING", "WRITING", "SPEAKING"].includes(q.skill))?.skill.toLowerCase();
    if (!skill) { setRetakeError("Could not determine this exam's skill."); return; }
    setRetaking(true); setRetakeError(null);
    try {
      const response = await startAttempt(result.examId);
      const payload = response.data?.data;
      const id = payload?.attemptId ?? payload?.id;
      if (!id) throw new Error("Attempt ID missing");
      setAttempt({ ...payload, attemptId: id });
      router.replace(`/do-test/${skill}/${id}`);
    } catch { setRetakeError("Could not start the exam. Please try again."); }
    finally { setRetaking(false); }
  };
  const selectQuestion = (id?: string) => {
    const index = result?.paper.sections.findIndex(sec => sectionQuestions(sec).some(q => q.id === id)) ?? -1;
    if (index >= 0) setActiveSection(index);
    setFilter("ALL");
    const q = questions.find(q => q.id === id);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`q-${q?.displayIdx ?? q?.idx}`)?.scrollIntoView({ block: "center" })));
  };
  if (error) return <div role="alert" className="p-8 text-center space-y-4"><p>{error}</p><button className="rounded-full border px-4 py-2" onClick={() => router.push("/history")}>Back to history</button></div>;
  if (!result) return <p role="status" className="p-8 text-center">Loading attempt review...</p>;
  if (!section) return <p className="p-8">No questions in this attempt.</p>;
  const filters: Array<[ResultFilterType, string]> = [["ALL", "All"], ["CORRECT", "Correct"], ["INCORRECT", "Wrong"], ["UNANSWERED", "Unanswered"]];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div><button type="button" onClick={() => router.push("/history")} className="text-sm underline">Back to history</button><h1 className="font-bold">{result.paper.title}</h1></div>
        <div className="flex items-center gap-4 text-sm"><span>Score: {result.correctCount} / {result.totalQuestion}</span><span>Band: {result.ieltsBand.toFixed(1)}</span><button type="button" onClick={() => void retake()} disabled={retaking} className="rounded-full border px-4 py-2 disabled:opacity-50">{retaking ? "Starting..." : "Retake exam"}</button></div>
        {retakeError && <p role="alert" className="text-sm text-red-600">{retakeError}</p>}
      </header>
      <nav aria-label="Exam sections" className="flex shrink-0 gap-2 overflow-x-auto border-b bg-white p-3">
        {result.paper.sections.map((sec, index) => <button key={sec.id ?? index} type="button" aria-current={activeSection === index ? "page" : undefined} onClick={() => setActiveSection(index)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${activeSection === index ? "bg-[var(--primary-light)]" : "bg-white"}`}>Part {index + 1}: {sec.title}</button>)}
      </nav>
      <div className="flex-1 min-h-0 grid grid-cols-1 overflow-auto lg:grid-cols-2 lg:overflow-hidden">
        <div className="min-h-64 lg:min-h-0 overflow-auto border-r bg-white">
          {section.audioUrl && <div className="p-4"><AudioPlayer src={section.audioUrl} /></div>}
          <PassageView passage={{ title: section.title, content: section.passageMd ?? section.instructionsMd ?? "" }} imageUrl={result.paper.imageUrl ?? undefined} attemptId={attemptId} sectionId={section.id} />
        </div>
        <div className="min-h-0 lg:overflow-auto p-4 space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Filter questions">
            {filters.map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded-full border px-3 py-1 text-sm ${filter === key ? "bg-[var(--primary-light)]" : "bg-white"}`}>{label} ({key === "ALL" ? questions.length : questions.filter(q => status(q.id) === key).length})</button>)}
          </div>
          <QuestionPanel attemptId={attemptId} questions={visibleQuestions} initialAnswers={initialAnswers} isReviewMode reviewData={reviewData} questionGroups={section.questionGroups} />
        </div>
      </div>
      <nav aria-label="Question navigator" className="shrink-0 flex gap-2 overflow-x-auto border-t bg-white p-3">
        {questions.map(q => <button key={q.id} type="button" onClick={() => selectQuestion(q.id)} aria-label={`Question ${q.displayIdx}: ${status(q.id).toLowerCase().replace(/_/g, " ")}`} className={`h-8 min-w-8 rounded-full border text-xs ${status(q.id) === "CORRECT" ? "bg-emerald-100" : status(q.id) === "INCORRECT" ? "bg-red-100" : "bg-white"}`}>{q.displayIdx}</button>)}
      </nav>
    </div>
  );
}
