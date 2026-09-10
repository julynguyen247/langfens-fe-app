import type { AttemptQuestionResult } from "./types";
import type { RagFeedbackEnvelope } from "@/types/rag";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(s: unknown): boolean {
  return typeof s === "string" && UUID_RE.test(s.trim());
}

type OptionMap = Record<string, any>;

export type NormalizedDetail = {
  questionId: string;
  index: number;
  skill: string;
  questionType: string;
  prompt: string;
  selectedText: string;
  correctText: string;
  explanation: string;
  isCorrect: boolean | null;
  state: "answered" | "none";
  timeSpentSec?: number;
  ragFeedback?: RagFeedbackEnvelope;
};

export function normalizeDetail(d: AttemptQuestionResult): NormalizedDetail {
  // The BE sometimes falls back to a raw option UUID when it cannot resolve
  // the user's selection to option text (e.g. malformed snapshot). Treat any
  // UUID-shaped string as "no text" so we don't render the id to the user.
  const rawSelected = d.selectedAnswerText ?? "";
  const rawCorrect = d.correctAnswerText ?? "";
  const selectedText = isUuidLike(rawSelected) ? "" : rawSelected;
  const correctText = cleanAnswer(isUuidLike(rawCorrect) ? "" : rawCorrect);

  const hasAnswer =
    !!selectedText || (d.selectedOptionIds?.length ?? 0) > 0;

  return {
    questionId: d.questionId,
    index: d.index,
    skill: d.skill ?? "UNKNOWN",
    questionType: d.questionType ?? "UNKNOWN",
    prompt: cleanQuestion(d.promptMd ?? ""),
    selectedText,
    correctText,
    explanation: d.explanationMd ?? "",
    ragFeedback: d.ragFeedback,
    isCorrect: typeof d.isCorrect === "boolean" ? d.isCorrect : null,
    state: hasAnswer ? "answered" : "none",
    timeSpentSec: d.timeSpentSec,
  };
}

export function cleanQuestion(s: string) {
  return s
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "____ ")
    .replace(/\[blank[-_]\w+\]/gi, "____")
    .replace(/(label|step|flow|node)[-_ ]*\d*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanAnswer(s: string) {
  if (!s) return "";

  let clean = String(s)
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/\[blank[-_]\w+\]/gi, "")
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    .replace(
      /^\s*(?:paragraph|info|step|flow|node|part|section)?[-_ ]*\w*:\s*/i,
      ""
    )
    .replace(/\b(?:paragraph|info)[-_ ]*\w*:\s*/gi, "")
    .replace(/^feature[-_]?q?\d*:\s*/i, "")
    .replace(/^q\d+:\s*/i, "")
    .replace(/^(heading|item|answer|key|option)[-_]?\d*:\s*/gi, "")
    // REMOVED G15: /^[\w-]+:\s*/ — greedy regex stripped legitimate
    // "Word: rest" prefixes (e.g. "Reason: I learned" → "I learned").
    // Allowlist above covers the canonical admin-supplied prefixes;
    // anything else is left intact as part of the answer.
    .replace(/\s+/g, " ")
    .trim();

  if (/^([A-Za-z0-9]+)\/\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  }

  return clean;
}

export function fmtMinSec(totalSec: number) {
  if (!totalSec || totalSec < 0) return "--";
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}m${String(s).padStart(2, "0")}s`;
}

export function parseTimeTaken(s: string | undefined) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

export function parseSecondsAny(v: any) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;

  const m = v.match(/^(\d{1,2}):(\d{2}):(\d{2})/);
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapOptionsById(options: any[]): OptionMap {
  return options.reduce((acc, opt) => {
    if (opt?.id === undefined || opt?.id === null) return acc;
    acc[String(opt.id)] = opt;
    return acc;
  }, {} as OptionMap);
}

export function extractOptionIdsFromText(
  text: string | undefined,
  optionMap: OptionMap
) {
  if (!text) return [];
  const trimmed = String(text).trim();
  if (!trimmed) return [];
  if (optionMap[trimmed]) return [trimmed];
  const parts = trimmed
    .split(/[\s|,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.filter((p) => !!optionMap[p]);
}

export function mapAnswerContent({
  optionMap,
  ids,
  fallbackText,
}: {
  optionMap: OptionMap | null;
  ids?: string[];
  fallbackText?: string;
}) {
  if (!optionMap || Object.keys(optionMap).length === 0) {
    return fallbackText ?? "";
  }

  let normalizedIds = (ids ?? []).map((v) => String(v)).filter(Boolean);

  if (
    normalizedIds.length === 0 &&
    fallbackText &&
    fallbackText.startsWith("[")
  ) {
    try {
      const parsed = JSON.parse(fallbackText);
      if (Array.isArray(parsed)) {
        normalizedIds = parsed.map((v: any) => String(v)).filter(Boolean);
      }
    } catch {
    }
  }

  const idsToUse =
    normalizedIds.length > 0
      ? normalizedIds
      : extractOptionIdsFromText(fallbackText, optionMap);

  const texts = idsToUse
    .map((id) => optionMap[id])
    .map(
      (opt) => opt?.contentMd ?? opt?.content ?? opt?.label ?? opt?.text ?? ""
    )
    .filter(Boolean);

  if (texts.length > 0) return texts.join(" | ");

  if (fallbackText && optionMap[fallbackText]) {
    const opt = optionMap[fallbackText];
    const text =
      opt?.contentMd ?? opt?.content ?? opt?.label ?? opt?.text ?? "";
    if (text) return text;
  }

  if (isUuidLike(fallbackText)) return "";

  return fallbackText ?? "";
}
