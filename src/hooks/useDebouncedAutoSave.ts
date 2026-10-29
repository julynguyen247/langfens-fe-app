"use client";

import { autoSaveAttempt } from "@/services/attempts";
import { useCallback, useEffect, useRef } from "react";
import { type QA, buildAnswerPayload } from "@/lib/answerPayload";

type SectionResolver = (id: string) => string | undefined;
type TextResolver = (id: string, value: string) => string | undefined;

export function useDebouncedAutoSave(_userId: string | undefined, attemptId: string) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => cancel, [attemptId, cancel]);
  const run = useCallback((answers: QA, section: SectionResolver, text?: TextResolver) => {
    cancel();
    const payload = buildAnswerPayload({ ...answers }, section, text);
    timer.current = setTimeout(() => {
      timer.current = null;
      // A final save always retries the complete state and propagates errors.
      void autoSaveAttempt(attemptId, payload).catch(() => undefined);
    }, 2000);
  }, [attemptId, cancel]);
  const saveNow = useCallback(async (answers: QA, section: SectionResolver, text?: TextResolver) => {
    cancel();
    await autoSaveAttempt(attemptId, buildAnswerPayload(answers, section, text));
  }, [attemptId, cancel]);
  return { run, saveNow, cancel };
}
