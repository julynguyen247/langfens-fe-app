import { QuestionSkill, QuestionType } from "./types";
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

export function validateMcqIsCorrectCount(
  options: { isCorrect?: boolean | null }[],
  type: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const correct = options.filter((o) => o.isCorrect === true).length;
  if (type === QuestionType.MultipleChoiceSingle || type === QuestionType.MultipleChoiceSingleImage) {
    if (correct !== 1) {
      issues.push({
        level: "error",
        field: "options.isCorrect",
        message: `Single-choice question needs exactly 1 correct option (found ${correct}).`,
      });
    }
  } else if (type === QuestionType.MultipleChoiceMultiple) {
    if (correct < 1) {
      issues.push({
        level: "error",
        field: "options.isCorrect",
        message: `Multi-choice question needs at least 1 correct option.`,
      });
    }
  } else if (type === QuestionType.TrueFalseNotGiven || type === QuestionType.YesNoNotGiven) {
    if (correct !== 1) {
      issues.push({
        level: "error",
        field: "options.isCorrect",
        message: `${type} needs exactly 1 correct option.`,
      });
    }
  }

  return issues;
}

export function validateOptionsLength(
  options: { isCorrect?: boolean | null }[],
  type: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const len = options.length;

  if (type === QuestionType.MultipleChoiceSingle || type === QuestionType.MultipleChoiceSingleImage) {
    if (len < 2) {
      issues.push({
        level: "error",
        field: "options",
        message: `Multiple choice needs at least 2 options.`,
      });
    } else if (len > 4) {
      issues.push({
        level: "warning",
        field: "options",
        message: `Single-choice question has ${len} options; recommended maximum is 4.`,
      });
    }
  } else if (type === QuestionType.MultipleChoiceMultiple) {
    if (len < 2) {
      issues.push({
        level: "error",
        field: "options",
        message: `Multiple choice needs at least 2 options.`,
      });
    } else if (len > 6) {
      issues.push({
        level: "warning",
        field: "options",
        message: `Multi-choice question has ${len} options; recommended maximum is 6.`,
      });
    }
  } else if (type === QuestionType.TrueFalseNotGiven || type === QuestionType.YesNoNotGiven) {
    if (len !== 3) {
      issues.push({
        level: "error",
        field: "options",
        message: `${type} needs exactly 3 options.`,
      });
    }
  }

  return issues;
}

export function validateMatchingHeadingPrompt(promptMd?: string | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const text = (promptMd ?? "").trim();
  if (!text) {
    issues.push({
      level: "error",
      field: "promptMd",
      message: `Matching heading prompt should start with roman numerals (i, ii, A, B...) and list at least one heading.`,
    });
    return issues;
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const hasRomanOrLetterPrefix = lines.some((l) => /^[ivxlcdmA-Z]+\.\s/.test(l));
  if (!hasRomanOrLetterPrefix) {
    issues.push({
      level: "error",
      field: "promptMd",
      message: `Matching heading prompt should start with roman numerals (i, ii, A, B...) for at least one line.`,
    });
  }
  return issues;
}

export function validateShortAnswerSubQuestionCount(
  promptMd?: string | null,
  shortAnswerAcceptTexts?: string[] | null
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const texts = shortAnswerAcceptTexts ?? [];
  const prompt = promptMd ?? "";
  const matches = prompt.match(/\b\d+\b/g);
  const detected = matches ? new Set(matches).size : 0;
  if (detected === 0) return issues;
  if (texts.length !== detected) {
    issues.push({
      level: "warning",
      field: "shortAnswerAcceptTexts",
      message: `Prompt suggests ${detected} sub-question(s) but ${texts.length} accepted text(s) provided.`,
    });
  }
  return issues;
}

export function validateImageUrlRequired(
  type: string,
  imageUrl?: string | null
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const requiresImage =
    type === QuestionType.DiagramLabel ||
    type === QuestionType.MapLabel ||
    type === QuestionType.MultipleChoiceSingleImage;
  if (!requiresImage) return issues;
  if (!imageUrl || !imageUrl.trim()) {
    issues.push({
      level: "error",
      field: "imageUrl",
      message: `${type} requires an imageUrl.`,
    });
  }
  return issues;
}

export function validateDifficultyBounds(difficulty?: number | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (difficulty === undefined || difficulty === null) return issues;
  if (typeof difficulty !== "number" || !Number.isFinite(difficulty)) {
    issues.push({
      level: "warning",
      field: "difficulty",
      message: `Difficulty must be a number in [1, 5].`,
    });
    return issues;
  }
  if (difficulty < 1 || difficulty > 5) {
    issues.push({
      level: "warning",
      field: "difficulty",
      message: `Difficulty ${difficulty} out of range [1, 5].`,
    });
  }
  return issues;
}

export function validateBlankKeyFormat(type: string, keys: string[]): ValidationIssue[] {
  const completionFamily: Record<string, true> = {
    [QuestionType.SummaryCompletion]: true,
    [QuestionType.TableCompletion]: true,
    [QuestionType.NoteCompletion]: true,
    [QuestionType.FormCompletion]: true,
    [QuestionType.SentenceCompletion]: true,
    [QuestionType.DiagramLabel]: true,
    [QuestionType.MapLabel]: true,
    [QuestionType.FlowChart]: true,
  };
  if (!completionFamily[type]) return [];
  const issues: ValidationIssue[] = [];
  for (const key of keys) {
    if (!/^\d+$/.test(key) && !/^blank-q\d+$/.test(key)) {
      issues.push({
        level: "error",
        field: `blanks.${key}`,
        message: `Blank key "${key}" should be numeric ("0", "1", ...) or "blank-q<N>".`,
      });
    }
  }
  return issues;
}

// S31: warn (NOT error) when promptMd contains "[N]" placeholders that have no
// matching entry in blankAcceptTexts. Applies only to the completion family
// (matches validateBlankKeyFormat's set, so the two checks stay in sync).
// Returns array empty when promptMd is null/undefined or has no bracketed
// numbers. De-duplicates repeated "[N]" mentions — one issue per missing key.
export function validatePromptBlanksCoverage(
  type: string,
  promptMd: string | null | undefined,
  blankKeys: string[]
): ValidationIssue[] {
  const completionFamily: Record<string, true> = {
    [QuestionType.SummaryCompletion]: true,
    [QuestionType.TableCompletion]: true,
    [QuestionType.NoteCompletion]: true,
    [QuestionType.FormCompletion]: true,
    [QuestionType.SentenceCompletion]: true,
    [QuestionType.DiagramLabel]: true,
    [QuestionType.MapLabel]: true,
    [QuestionType.FlowChart]: true,
  };
  if (!completionFamily[type]) return [];
  if (!promptMd) return [];
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const match of promptMd.matchAll(/\[(\d+)\]/g)) {
    const key = match[1];
    if (blankKeys.includes(key) || seen.has(key)) continue;
    seen.add(key);
    issues.push({
      level: "warning",
      field: "promptMd",
      message: `promptMd references "[${key}]" but no blank entry with key "${key}" is defined. Add it via "Insert Blank at Cursor" or "Add Blank".`,
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
    (q) => q.skill?.toUpperCase() === "LISTENING"
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
