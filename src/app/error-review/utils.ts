import { QUESTION_TYPE_LABELS } from "./constants";
import type { WrongAnswer, WrongAnswersResult } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuidLike = (s: unknown) => typeof s === "string" && UUID_RE.test(s.trim());

export function formatCorrectAnswer(raw: string | undefined, questionType: string): string {
  if (!raw || raw.trim() === "") {
    return "(No answer key)";
  }

  let clean = String(raw)
    .replace(/^(feature|blank|label|heading|item|q|answer|key)[-_]?\d*:\s*/gi, "")
    .replace(/^[\w-]+:\s*/, "")
    .trim();

  if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }

  if (/^([A-Za-z0-9]+)\/\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  }

  const type = questionType.toUpperCase();

  if (type.includes("MATCHING") && clean.length <= 3) {
    if (/^[ivx]+$/i.test(clean)) {
      return `Heading ${clean}`;
    } else if (/^[A-H]$/i.test(clean)) {
      return `Paragraph ${clean}`;
    }
  }

  return clean || "(No answer key)";
}

export function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export function normaliseWrongAnswers(value: unknown): WrongAnswersResult {
  if (!value || typeof value !== "object") {
    return { items: [], total: 0, page: 1, pageSize: 20, statsByType: {} };
  }

  const record = value as Record<string, unknown>;
  const items = Array.isArray(record.items) ? (record.items as WrongAnswer[]) : [];
  const numberOr = (input: unknown, fallback: number) =>
    typeof input === "number" && Number.isFinite(input) ? input : fallback;

  return {
    items,
    total: numberOr(record.total, items.length),
    page: numberOr(record.page, 1),
    pageSize: numberOr(record.pageSize, 20),
    statsByType:
      record.statsByType && typeof record.statsByType === "object" && !Array.isArray(record.statsByType)
        ? (record.statsByType as Record<string, number>)
        : {},
  };
}
