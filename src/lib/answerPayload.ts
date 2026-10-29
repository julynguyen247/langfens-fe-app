export type QA = Record<string, string>;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shared wire builder for autosave and submit. Empty answers explicitly clear old values. */
export function buildAnswerPayload(
  answers: QA,
  buildSectionId: (qid: string) => string | undefined,
  buildTextAnswer?: (qid: string, value: string) => string | undefined
) {
  return {
    answers: Object.entries(answers).map(([questionId, value]) => {
      const explicitText = buildTextAnswer?.(questionId, value);
      let selectedOptionIds: string[] = [];
      let textAnswer = explicitText ?? value;
      if (explicitText === undefined) {
        let parsed: unknown;
        try { parsed = JSON.parse(value); } catch { /* Plain text or single option ID. */ }
        if (Array.isArray(parsed) && parsed.every(id => typeof id === "string" && GUID.test(id))) {
          selectedOptionIds = parsed;
          textAnswer = "";
        } else if (GUID.test(value)) {
          selectedOptionIds = [value];
          textAnswer = "";
        }
      }
      return { questionId, sectionId: buildSectionId(questionId) ?? "", selectedOptionIds, textAnswer };
    }),
    clientRevision: Date.now(),
  };
}
