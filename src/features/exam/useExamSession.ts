"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAttemptDetail, submitAttempt } from "@/services/attempts";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";
import { decodeAnswer, encodeAnswer, OPTION_ANSWER_TYPES } from "./contract";
import type { AnswerMap, InternalDeliveryQuestion, AttemptAnswerItem } from "./types";

function readDraft(key: string): AnswerMap {
  try { const draft = JSON.parse(sessionStorage.getItem(key) ?? "{}"); return Object.fromEntries(Object.entries(draft).filter((entry): entry is [string, string] => typeof entry[1] === "string")); }
  catch { return {}; }
}

/** One question-ID keyed answer state, shared by render, autosave and final submit. */
export function useExamSession(attemptId: string, questions: InternalDeliveryQuestion[], enabled = true) {
  const draftKey = `attempt-answers:${attemptId}`;
  const [answers, setAnswers] = useState<AnswerMap>({});
  const answersRef = useRef<AnswerMap>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionRef = useRef(questions);
  questionRef.current = questions;
  const submitting = useRef<Promise<void> | null>(null);
  const { run, saveNow, cancel } = useDebouncedAutoSave(undefined, attemptId);
  const sectionId = useCallback((id: string) => questionRef.current.find(q => q.id === id)?.sectionId, []);
  const textAnswer = useCallback((id: string, value: string) => OPTION_ANSWER_TYPES.has(questionRef.current.find(q => q.id === id)?.type ?? "") ? undefined : value, []);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setReady(false); setError(null);
    getAttemptDetail(attemptId).then(response => {
      if (cancelled) return;
      const data = response.data?.data;
      if (!data || response.data?.isSuccess === false) throw new Error("Unable to restore answers");
      if (["SUBMITTED", "GRADED"].includes(String(data.status).toUpperCase())) throw new Error("This attempt has already been submitted. Open it from history.");
      const saved: AnswerMap = {};
      for (const answer of (data.answers ?? []) as AttemptAnswerItem[]) {
        const q = questionRef.current.find(q => q.id === answer.questionId);
        if (q?.id) saved[q.id] = encodeAnswer(decodeAnswer(answer, q));
      }
      const valid = new Set(questionRef.current.map(q => q.id));
      const draft = Object.fromEntries(Object.entries(readDraft(draftKey)).filter(([id]) => valid.has(id)));
      const next = { ...saved, ...draft };
      answersRef.current = next; setAnswers(next); setReady(true);
    }).catch(() => { if (!cancelled) setError("Could not restore your saved answers. Reload before continuing."); });
    return () => { cancelled = true; cancel(); };
  }, [attemptId, draftKey, enabled, cancel]);

  const changeAnswers = useCallback((next: AnswerMap) => {
    if (!ready || submitting.current) return;
    // The panel may contain only the current passage; retain the other passages.
    const merged = { ...answersRef.current, ...next };
    answersRef.current = merged; setAnswers(merged);
    try { sessionStorage.setItem(draftKey, JSON.stringify(merged)); } catch { /* Server autosave still works. */ }
    run(merged, sectionId, textAnswer);
  }, [ready, draftKey, run, sectionId, textAnswer]);

  const submit = useCallback((): Promise<void> => {
    if (submitting.current) return submitting.current;
    if (!ready) return Promise.reject(new Error("Answers have not loaded yet"));
    cancel();
    const task = (async () => {
      await saveNow(answersRef.current, sectionId, textAnswer);
      await submitAttempt(attemptId);
      try { sessionStorage.removeItem(draftKey); } catch { /* Submitted result is authoritative. */ }
    })();
    submitting.current = task;
    // Keep the successful promise: repeated clicks must not submit twice.
    void task.catch(() => { submitting.current = null; });
    return task;
  }, [ready, cancel, saveNow, sectionId, textAnswer, attemptId, draftKey]);
  return { answers, changeAnswers, submit, ready: !enabled || ready, error };
}
