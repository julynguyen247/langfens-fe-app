import type { InternalDeliveryExam, InternalDeliveryQuestion, InternalDeliverySection } from "@/app/admin/_lib/types";
import type { UserAnswerValue } from "./types";

/** Classification is matching, NOT an option-ID question. */
export const OPTION_ANSWER_TYPES = new Set([
  "MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_SINGLE_IMAGE", "MULTIPLE_CHOICE_MULTIPLE",
  "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN",
]);
export const MATCHING_ANSWER_TYPES = new Set([
  "MATCHING_HEADING", "MATCHING_INFORMATION", "MATCHING_FEATURES", "MATCHING_ENDINGS", "CLASSIFICATION",
]);
export const COMPLETION_ANSWER_TYPES = new Set([
  "SUMMARY_COMPLETION", "TABLE_COMPLETION", "NOTE_COMPLETION", "FORM_COMPLETION",
  "SENTENCE_COMPLETION", "DIAGRAM_LABEL", "MAP_LABEL",
]);

export function sortAnswerKeys(keys: string[]): string[] {
  return [...new Set(keys)].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    return Number.isFinite(na) && Number.isFinite(nb) ? na - nb : a.localeCompare(b);
  });
}

export function getBlankKeys(q: Pick<InternalDeliveryQuestion, "promptMd" | "blankAcceptTexts" | "blankAcceptRegex">): string[] {
  const markers = Array.from((q.promptMd ?? "").matchAll(/\[(\d+)\]/g), m => m[1]);
  return sortAnswerKeys([...markers, ...Object.keys(q.blankAcceptTexts ?? {}), ...Object.keys(q.blankAcceptRegex ?? {})]);
}

/** Convert both REST dictionaries and protobuf repeated fields at the boundary. */
export function normalizeDeliveryQuestion(q: InternalDeliveryQuestion): InternalDeliveryQuestion {
  const raw = q as InternalDeliveryQuestion & {
    completionAccepts?: Array<{ blankId: string; acceptedTexts?: string[]; acceptedRegex?: string[] }>;
  };
  const pairs = Array.isArray(q.matchPairs)
    ? Object.fromEntries((q.matchPairs as Array<{ promptKey: string; acceptedValues?: string[] }>).map(p => [p.promptKey, p.acceptedValues ?? []]))
    : q.matchPairs;
  return { ...q,
    blankAcceptTexts: { ...Object.fromEntries((raw.completionAccepts ?? []).map(b => [b.blankId, b.acceptedTexts ?? []])), ...q.blankAcceptTexts },
    blankAcceptRegex: { ...Object.fromEntries((raw.completionAccepts ?? []).map(b => [b.blankId, b.acceptedRegex ?? []])), ...q.blankAcceptRegex },
    matchPairs: pairs,
    options: [...(q.options ?? [])].sort((a, b) => a.idx - b.idx),
  };
}

export function sectionQuestions(section: Pick<InternalDeliverySection, "questions" | "questionGroups">): InternalDeliveryQuestion[] {
  const seen = new Set<string>();
  return [...(section.questions ?? []), ...(section.questionGroups ?? []).flatMap(g => g.questions ?? [])]
    .filter(q => {
      if (!q.id) return true;
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    }).sort((a, b) => (a.displayIdx ?? a.idx) - (b.displayIdx ?? b.idx));
}

/** One deterministic view of the frozen attempt paper. IDs join data; ordinals only label it. */
export function normalizeExamPaper(exam: InternalDeliveryExam): InternalDeliveryExam {
  let ordinal = 1;
  const seen = new Set<string>();
  return { ...exam, sections: [...(exam.sections ?? [])].sort((a, b) => a.idx - b.idx).map(sec => {
    const stamp = (questions: InternalDeliveryQuestion[]) => [...questions].sort((a, b) => a.idx - b.idx).flatMap(q => {
      if (q.id && seen.has(q.id)) return [];
      if (q.id) seen.add(q.id);
      return [{ ...normalizeDeliveryQuestion(q), sectionId: sec.id, displayIdx: ordinal++ }];
    });
    const groupIds = new Set((sec.questionGroups ?? []).flatMap(g => g.questions ?? []).map(q => q.id).filter(Boolean));
    const questions = stamp((sec.questions ?? []).filter(q => !q.id || !groupIds.has(q.id)));
    const questionGroups = [...(sec.questionGroups ?? [])].sort((a, b) => a.idx - b.idx).map(g => {
      const qs = stamp(g.questions ?? []);
      return { ...g, questions: qs, startIdx: qs[0]?.displayIdx ?? g.startIdx, endIdx: qs.at(-1)?.displayIdx ?? g.endIdx };
    });
    return { ...sec, questions, questionGroups };
  }) };
}

export type WireAnswer = { questionId?: string; selectedOptionIds?: string[] | null; textAnswer?: string | null; selectedAnswerText?: string | null };

/** Preserve empty legacy slots and map positions onto REAL keys, never rebase explicit JSON. */
export function decodeAnswer(answer?: WireAnswer, question?: InternalDeliveryQuestion): UserAnswerValue {
  if (!answer) return "";
  if (answer.selectedOptionIds?.length) return answer.selectedOptionIds;
  const raw = answer.textAnswer ?? answer.selectedAnswerText ?? "";
  if (/^\s*[\[{]/.test(raw)) {
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value) && value.every(x => typeof x === "string")) return value;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (Object.values(value).every(x => typeof x === "string")) return value;
        if (Array.isArray(value.steps) && value.steps.every((x: unknown) => typeof x === "string") &&
            (!value.labels || Object.values(value.labels).every(x => typeof x === "string"))) return value;
      }
    } catch { /* Legacy plain text. */ }
  }
  if (!raw.trim()) return "";
  if (question && MATCHING_ANSWER_TYPES.has(question.type)) {
    const matchKeys = sortAnswerKeys(Object.keys(question.matchPairs ?? {}));
    if (raw.includes("\n")) {
      const lines = raw.replace(/\r\n/g, "\n").split("\n").map(line => line.trim());
      const targetKeys = matchKeys.length ? matchKeys : lines.map((_, i) => String(i + 1));
      return Object.fromEntries(targetKeys.map((key, i) => [key, lines[i] ?? ""]));
    }
    if (matchKeys.length === 1) return { [matchKeys[0]]: raw.trim() };
    return raw.trim();
  }
  if (!question || COMPLETION_ANSWER_TYPES.has(question.type)) {
    const keys = question ? getBlankKeys(question) : [];
    if (raw.includes("\n") || keys.length > 0) {
      const lines = raw.replace(/\r\n/g, "\n").split("\n").map(line => line.trim());
      return Object.fromEntries((keys.length ? keys : lines.map((_, i) => String(i + 1))).map((key, i) => [key, lines[i] ?? ""]));
    }
  }
  return raw;
}

export function encodeAnswer(value: UserAnswerValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function hasAnswer(answer?: WireAnswer): boolean {
  const value = decodeAnswer(answer);
  const nonempty = (v: unknown): boolean => typeof v === "string" ? !!v.trim() :
    !!v && typeof v === "object" && Object.values(v).some(nonempty);
  return nonempty(value);
}
