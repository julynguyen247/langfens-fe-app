import { autoSaveAttempt } from "@/utils/api";
import { useRef } from "react";
type QA = Record<string, string>;

export function useDebouncedAutoSave(
  userId: string | undefined,
  attemptId: string
) {
  const t = useRef<NodeJS.Timeout | null>(null);

  const run = (
    answers: QA,
    buildSectionId: (qid: string) => string | undefined
  ) => {
    if (!userId) return;
    if (t.current) clearTimeout(t.current);

    t.current = setTimeout(async () => {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          sectionId: buildSectionId(questionId) ?? "",
          selectedOptionIds: value ? [value] : [],
        })),
        clientRevision: Date.now(),
      };

      try {
        await autoSaveAttempt(attemptId, payload);
      } catch {}
    }, 2000);
  };

  const cancel = () => {
    if (t.current) {
      clearTimeout(t.current);
      t.current = null;
    }
  };

  return { run, cancel };
}
