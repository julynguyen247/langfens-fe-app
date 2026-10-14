"use client";

import { autoSaveAttempt } from "@/services/attempts";
import { useRef } from "react";

import { type QA, buildAnswerPayload } from "../lib/answerPayload";

export function useDebouncedAutoSave(
  userId: string | undefined,
  attemptId: string
) {
  const t = useRef<NodeJS.Timeout | null>(null);

  const run = (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => {
    if (!userId) return;
    if (t.current) clearTimeout(t.current);

    t.current = setTimeout(async () => {
      try {
        const payload = buildAnswerPayload(answers, buildSectionId, buildTextAnswer);
        await autoSaveAttempt(attemptId, payload);
      } catch {}
    }, 2000);
  };

  // Immediate save (no debounce) - use before submit
  const saveNow = async (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => {
    if (t.current) clearTimeout(t.current);
    const payload = buildAnswerPayload(answers, buildSectionId, buildTextAnswer);
    await autoSaveAttempt(attemptId, payload);
  };

  const cancel = () => {
    if (t.current) {
      clearTimeout(t.current);
      t.current = null;
    }
  };

  return { run, cancel, saveNow };
}
