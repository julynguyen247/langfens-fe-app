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

      // Check if value is a JSON array (for MULTIPLE_CHOICE_MULTIPLE)
      let parsedArray: string[] | null = null;
      if (value && value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            parsedArray = parsed.map(String);
          }
        } catch {
          // Not valid JSON, continue with other checks
        }
      }

      // Check if value is a valid UUID (GUID format)
      const isValidGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      
      // Determine selectedOptionIds:
      // 1. If it's a JSON array of GUIDs, use those
      // 2. If it's a single GUID, use that
      // 3. Otherwise empty
      let selectedOptionIds: string[] = [];
      if (parsedArray && parsedArray.length > 0) {
        // Check if array contains GUIDs
        const allGuids = parsedArray.every(v => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
        );
        if (allGuids) {
          selectedOptionIds = parsedArray;
        }
      } else if (!hasText && value && isValidGuid) {
        selectedOptionIds = [value];
      }
      
      // For non-GUID values, use textAnswer instead
      // But if we have parsedArray of non-GUIDs, also send as textAnswer
      let finalTextAnswer: string | undefined;
      if (hasText) {
        finalTextAnswer = textAnswer;
      } else if (parsedArray && parsedArray.length > 0 && selectedOptionIds.length === 0) {
        // Non-GUID array (like ["A", "B"]) - send as JSON string
        finalTextAnswer = value;
      } else if (!isValidGuid && value && !parsedArray) {
        finalTextAnswer = value;
      }

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
