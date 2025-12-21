import { autoSaveAttempt } from "@/utils/api";
import { useRef } from "react";

type QA = Record<string, string>;

export function useDebouncedAutoSave(
  userId: string | undefined,
  attemptId: string
) {
  const t = useRef<NodeJS.Timeout | null>(null);

  const buildPayload = (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => ({
    answers: Object.entries(answers).map(([questionId, value]) => {
      const textAnswer = buildTextAnswer?.(questionId, value);
      const hasText = !!textAnswer && textAnswer.trim().length > 0;

      // Check if value is a valid UUID (GUID format)
      const isValidGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      
      // Only use selectedOptionIds if value is a valid GUID (not text like "D", "TRUE", etc.)
      const selectedOptionIds = !hasText && value && isValidGuid ? [value] : [];
      
      // For non-GUID values, use textAnswer instead
      const finalTextAnswer = hasText 
        ? textAnswer 
        : (!isValidGuid && value ? value : undefined);

      return {
        questionId,
        sectionId: buildSectionId(questionId) ?? "",
        selectedOptionIds,
        textAnswer: finalTextAnswer,
      };
    }),
    clientRevision: Date.now(),
  });

  const run = (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined,
    buildTextAnswer?: (qid: string, value: string) => string | undefined
  ) => {
    if (!userId) return;
    if (t.current) clearTimeout(t.current);

    t.current = setTimeout(async () => {
      try {
        const payload = buildPayload(answers, buildSectionId, buildTextAnswer);
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
    const payload = buildPayload(answers, buildSectionId, buildTextAnswer);
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
