import { QuestionSkill } from "./types";
import { QUESTION_TYPE_REGISTRY, QuestionTypeMeta, getMeta } from "./questionTypeRegistry";

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  field: string;
  message: string;
}

export interface MatchPairsPayload {
  matchPairs?: Record<string, string[] | null> | null;
  options?: { idx: number; contentMd: string }[];
  type: string;
}

export interface BlanksPayload {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  type: string;
}

export interface ShortAnswerPayload {
  shortAnswerAcceptTexts?: string[] | null;
  shortAnswerAcceptRegex?: string[] | null;
  type: string;
}

export interface FlowChartPayload {
  orderCorrects?: string[] | null;
  type: string;
}

export function validateTypeSkill(type: string, skill: string): ValidationIssue[] {
  const meta = getMeta(type);
  const issues: ValidationIssue[] = [];

  if (!meta.skillHints || meta.skillHints.length === 0) return issues;

  if (!meta.skillHints.includes(skill)) {
    const suggested = meta.skillHints[0];
    issues.push({
      level: "warning",
      field: "skill",
      message: `${meta.label} questions typically use the ${suggested} skill. Currently set to ${skill}.`,
    });
  }
  return issues;
}

export function validateMatchPairs(payload: MatchPairsPayload): ValidationIssue[] {
  const meta = getMeta(payload.type);
  if (
    meta.editorKind !== "match-pairs" &&
    meta.editorKind !== "classification" &&
    meta.editorKind !== "matching-heading" &&
    meta.editorKind !== "matching-information" &&
    meta.editorKind !== "matching-features" &&
    meta.editorKind !== "matching-endings"
  ) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const pairs = payload.matchPairs || {};
  const keys = Object.keys(pairs);

  if (keys.length === 0) {
    issues.push({
      level: "error",
      field: "matchPairs",
      message: "At least one match pair is required.",
    });
    return issues;
  }

  for (const key of keys) {
    const val = pairs[key];
    if (!val || val.length === 0 || !val[0]) {
      issues.push({
        level: "error",
        field: `matchPairs.${key}`,
        message: `Pair "${key}" has no answer key.`,
      });
    }
  }

  if (payload.options && payload.options.length > 0) {
    const emptyOptions = payload.options.filter((o) => !o.contentMd.trim());
    if (emptyOptions.length > 0) {
      issues.push({
        level: "warning",
        field: "options",
        message: `${emptyOptions.length} option(s) have empty text.`,
      });
    }
  }

  return issues;
}

export function validateBlanks(payload: BlanksPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const texts = payload.blankAcceptTexts || {};
  const regex = payload.blankAcceptRegex || {};

  const keys = Array.from(new Set([...Object.keys(texts), ...Object.keys(regex)]));
  if (keys.length === 0) {
    issues.push({
      level: "warning",
      field: "blanks",
      message: "No blanks configured. Add at least one blank to score this question.",
    });
    return issues;
  }

  for (const key of keys) {
    const textList = texts[key] || [];
    const regexList = regex[key] || [];
    const hasText = textList.length > 0 && textList.some((t) => t && t.trim());
    const hasRegex = regexList.length > 0 && regexList.some((r) => r && r.trim());

    if (!hasText && !hasRegex) {
      issues.push({
        level: "error",
        field: `blanks.${key}`,
        message: `Blank "${key}" needs at least one accepted text or regex.`,
      });
    }

    for (const r of regexList) {
      if (!r || !r.trim()) continue;
      try {
        new RegExp(r);
      } catch {
        issues.push({
          level: "error",
          field: `blanks.${key}.regex`,
          message: `Invalid regex in blank "${key}": ${r}`,
        });
      }
    }
  }
  return issues;
}

export function validateShortAnswer(payload: ShortAnswerPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const texts = payload.shortAnswerAcceptTexts || [];
  const regex = payload.shortAnswerAcceptRegex || [];

  const hasText = texts.some((t) => t && t.trim());
  const hasRegex = regex.some((r) => r && r.trim());

  if (!hasText && !hasRegex) {
    issues.push({
      level: "error",
      field: "shortAnswer",
      message: "Add at least one accepted text or regex.",
    });
  }
  return issues;
}

export function validateFlowChart(payload: FlowChartPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const orders = payload.orderCorrects || [];

  if (orders.length < 2) {
    issues.push({
      level: "error",
      field: "orderCorrects",
      message: "Flow chart needs at least 2 ordered steps.",
    });
  }
  const unique = new Set(orders);
  if (unique.size !== orders.length) {
    issues.push({
      level: "error",
      field: "orderCorrects",
      message: "Duplicate steps detected. Each step must be unique.",
    });
  }
  return issues;
}

export function aggregateIssues(...lists: ValidationIssue[][]): ValidationIssue[] {
  return lists.flat();
}

export function validateSectionIdxUniqueness(
  questions: { id?: string; idx: number }[],
  currentQuestionId?: string
): ValidationIssue[] {
  const idxMap = new Map<number, number>();
  for (const q of questions) {
    if (q.id === currentQuestionId) continue;
    idxMap.set(q.idx, (idxMap.get(q.idx) || 0) + 1);
  }
  const issues: ValidationIssue[] = [];
  for (const [idx, count] of idxMap) {
    if (count > 1) {
      issues.push({
        level: "error",
        field: "idx",
        message: `Duplicate question order index #${idx} (${count} questions share it). Renumber to fix.`,
      });
    }
  }
  return issues;
}

export function validateSection(
  section: { audioUrl?: string | null; passageMd?: string | null },
  questions: { type: string; skill: string }[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const hasListening = questions.some(
    (q) => q.skill?.toUpperCase() === "LISTENING" && q.type !== "AUDIO_RESPONSE"
  );
  const hasSpeaking = questions.some(
    (q) => q.type === "AUDIO_RESPONSE"
  );
  if (hasListening && !section.audioUrl?.trim()) {
    issues.push({
      level: "error",
      field: "audioUrl",
      message: "Listening questions detected but section has no Audio URL.",
    });
  }
  if (questions.length === 0) {
    issues.push({
      level: "warning",
      field: "questions",
      message: "Section has no questions yet.",
    });
  }
  if (hasSpeaking && questions.length > 4) {
    issues.push({
      level: "info",
      field: "questions",
      message: "Speaking sections typically have 1-3 questions.",
    });
  }
  return issues;
}

export function issuesToText(issues: ValidationIssue[]): string {
  if (issues.length === 0) return "";
  return issues
    .map((i) => `${i.level === "error" ? "❌" : "⚠"} ${i.message}`)
    .join("\n");
}

export function metaByType(type: string): QuestionTypeMeta | undefined {
  return QUESTION_TYPE_REGISTRY[type];
}

export function defaultSkillForType(type: string): string {
  const meta = getMeta(type);
  return meta.skillHints?.[0] || QuestionSkill.Reading;
}
