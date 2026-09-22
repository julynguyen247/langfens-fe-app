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
  for (const step of orders) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(step ?? "")) {
      issues.push({
        level: "error",
        field: "orderCorrects",
        message: `Step "${step}" must be a lowercase slug (e.g. "collect-raw-materials").`,
      });
    }
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
  imageUrl?: string | null,
  options?: { imageUrl?: string | null }[] | null
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const requiresImage =
    type === QuestionType.DiagramLabel ||
    type === QuestionType.MapLabel ||
    type === QuestionType.MultipleChoiceSingleImage;
  if (!requiresImage) return issues;

  if (type === QuestionType.MultipleChoiceSingleImage) {
    const hasQuestionImage = Boolean(imageUrl && imageUrl.trim());
    const hasOptionImages = Boolean(
      options && options.length > 0 && options.some((o) => o.imageUrl && o.imageUrl.trim())
    );
    if (!hasQuestionImage && !hasOptionImages) {
      issues.push({
        level: "error",
        field: "imageUrl",
        message: `${type} requires an imageUrl on the question or image options.`,
      });
    }
    return issues;
  }

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
  };
  const issues: ValidationIssue[] = [];
  for (const key of keys) {
    if (!/^\d+$/.test(key)) {
      issues.push({
        level: "error",
        field: `blanks.${key}`,
        message: `Blank key "${key}" should be numeric ("1", "2", ...).`,
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
  };
  if (!completionFamily[type]) return [];
  if (!promptMd) return [];

  if (
    (type === QuestionType.DiagramLabel || type === QuestionType.MapLabel) &&
    /\[(Diagram|Map):\s*[^\]]+\]/i.test(promptMd)
  ) {
    return [];
  }
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

// Sprint 7 Phase 10: error (not warning) when BlankAcceptTexts keys are NOT
// present as `[N]` markers in PromptMd. This is the reverse direction of
// validatePromptBlanksCoverage (which warns on prompt-only references).
// Together they form a 2-way parity check: every blank must be referenced
// in the prompt, and every `[N]` marker in the prompt must have a blank.
export function validatePromptBlankParity(
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
  };
  if (!completionFamily[type]) return [];
  if (!promptMd) return [];
  if (blankKeys.length === 0) return [];

  // Skip DIAGRAM/MAP word-bank markers (covered by validatePromptBlanksCoverage).
  if (
    (type === QuestionType.DiagramLabel || type === QuestionType.MapLabel) &&
    /\[(Diagram|Map):\s*[^\]]+\]/i.test(promptMd)
  ) {
    return [];
  }
  const inPrompt = new Set<string>();
  for (const m of promptMd.matchAll(/\[(\d+)\]/g)) inPrompt.add(m[1]);

  const issues: ValidationIssue[] = [];
  for (const key of blankKeys) {
    if (!inPrompt.has(key)) {
      issues.push({
        level: "error",
        field: "promptMd",
        message: `promptMd is missing the "[${key}]" placeholder required by BlankAcceptTexts key "${key}". Add it via the editor's "Insert Blank at Cursor" button.`,
      });
    }
  }
  return issues;
}

/**
 * Enforce parity for MATCHING question types:
 * Every key in MatchPairs must be referenced as a numbered item (e.g. "1. ", "2. ")
 * in PromptMd, or as a detected paragraph range for MATCHING_HEADING.
 * Ensures the candidate actually has statements/paragraphs to match against during exams.
 */
export function validateMatchingPromptParity(
  type: string,
  promptMd: string | null | undefined,
  matchPairKeys: string[]
): ValidationIssue[] {
  const matchingFamily: Record<string, true> = {
    [QuestionType.MatchingHeading]: true,
    [QuestionType.MatchingInformation]: true,
    [QuestionType.MatchingFeatures]: true,
    [QuestionType.MatchingEndings]: true,
    [QuestionType.Classification]: true,
  };

  if (!matchingFamily[type]) return [];
  if (!promptMd || matchPairKeys.length === 0) return [];

  const text = promptMd.replace(/\\n/g, "\n");
  const inPrompt = new Set<string>();

  const numberedRe = /^(\d+)[\.\)]\s+/gm;
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text)) !== null) {
    inPrompt.add(m[1]);
  }

  if (type === QuestionType.MatchingHeading) {
    const headingParaMatch = text.match(
      /(?:five|six|seven|eight|nine|ten|\d+)\s+paragraphs[,\s]+(?:1[–-](\d+)|([A-Z])[–-]([A-Z]))/i
    );
    if (headingParaMatch) {
      if (headingParaMatch[1]) {
        const total = parseInt(headingParaMatch[1], 10);
        for (let i = 1; i <= total; i++) inPrompt.add(String(i));
      } else if (headingParaMatch[2] && headingParaMatch[3]) {
        const start = headingParaMatch[2].charCodeAt(0);
        const end = headingParaMatch[3].charCodeAt(0);
        let idx = 1;
        for (let c = start; c <= end; c++, idx++) inPrompt.add(String(idx));
      }
    }
  }

  const issues: ValidationIssue[] = [];
  for (const key of matchPairKeys) {
    if (!inPrompt.has(key)) {
      issues.push({
        level: "error",
        field: "promptMd",
        message: `PromptMd is missing the numbered item "${key}." corresponding to MatchPairs key "${key}". List each item to be matched in PromptMd (e.g. "1. First statement").`,
      });
    }
  }

  return issues;
}
export function aggregateIssues(...lists: ValidationIssue[][]): ValidationIssue[] {
  return lists.flat();
}

export interface QuestionValidationPayload {
  type: string;
  skill?: string | null;
  difficulty?: number | null;
  promptMd?: string | null;
  explanationMd?: string | null;
  imageUrl?: string | null;
  options?: { idx?: number; contentMd: string; isCorrect?: boolean | null; imageUrl?: string | null; altText?: string | null }[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  matchPairs?: Record<string, string[] | null> | null;
  orderCorrects?: string[] | null;
  shortAnswerAcceptTexts?: string[] | null;
  shortAnswerAcceptRegex?: string[] | null;
}

/**
 * Authoritative pipeline validator for any question payload.
 * Enforces strict, type-specific invariants for all IELTS question types (Q1 - Q19).
 * Used by QuestionEditor, QuestionImporter, and AiAuthorModal.
 */
export function validateQuestionPayload(q: QuestionValidationPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const t = q.type;

  if (!t || !QUESTION_TYPE_REGISTRY[t]) {
    issues.push({
      level: "error",
      field: "type",
      message: `Unknown question type "${t}".`,
    });
    return issues;
  }

  // Common metadata validation
  issues.push(...validateTypeSkill(t, q.skill || ""));
  issues.push(...validateDifficultyBounds(q.difficulty));
  issues.push(...validateImageUrlRequired(t, q.imageUrl, q.options));

  // Prompt must not be empty
  if (!q.promptMd || !q.promptMd.trim()) {
    issues.push({
      level: "error",
      field: "promptMd",
      message: "Prompt Markdown is required.",
    });
  }

  const options = q.options || [];
  const blanks = q.blankAcceptTexts || {};
  const blankKeys = Object.keys(blanks);
  const matchPairs = q.matchPairs || {};
  const matchKeys = Object.keys(matchPairs);
  const orders = q.orderCorrects || [];
  const shortAnswers = q.shortAnswerAcceptTexts || [];

  switch (t) {
    // ── Q1: Single choice ───────────────────────────────────────────────
    case QuestionType.MultipleChoiceSingle:
    case QuestionType.MultipleChoiceSingleImage: {
      issues.push(...validateMcqIsCorrectCount(options, t));
      issues.push(...validateOptionsLength(options, t));
      if (blankKeys.length > 0) {
        issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      }
      if (matchKeys.length > 0) {
        issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      }
      if (orders.length > 0) {
        issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      }
      if (shortAnswers.length > 0) {
        issues.push({ level: "error", field: "shortAnswerAcceptTexts", message: `${t}: ShortAnswerAcceptTexts must be empty.` });
      }
      break;
    }

    // ── Q2: True / False / Not Given ─────────────────────────────────────
    case QuestionType.TrueFalseNotGiven: {
      issues.push(...validateMcqIsCorrectCount(options, t));
      if (options.length !== 3) {
        issues.push({ level: "error", field: "options", message: `${t} requires exactly 3 options (True, False, Not Given).` });
      }
      const allowed = new Set(["true", "false", "not given"]);
      for (const opt of options) {
        if (!allowed.has(opt.contentMd.trim().toLowerCase())) {
          issues.push({ level: "error", field: "options", message: `Invalid option "${opt.contentMd}". Only True, False, Not Given allowed.` });
        }
      }
      if (blankKeys.length > 0) issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      break;
    }

    // ── Q8: Yes / No / Not Given ─────────────────────────────────────────
    case QuestionType.YesNoNotGiven: {
      issues.push(...validateMcqIsCorrectCount(options, t));
      if (options.length !== 3) {
        issues.push({ level: "error", field: "options", message: `${t} requires exactly 3 options (Yes, No, Not Given).` });
      }
      const allowed = new Set(["yes", "no", "not given"]);
      for (const opt of options) {
        if (!allowed.has(opt.contentMd.trim().toLowerCase())) {
          issues.push({ level: "error", field: "options", message: `Invalid option "${opt.contentMd}". Only Yes, No, Not Given allowed.` });
        }
      }
      if (blankKeys.length > 0) issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      break;
    }

    // ── Multiple Choice Multiple ──────────────────────────────────────────
    case QuestionType.MultipleChoiceMultiple: {
      issues.push(...validateMcqIsCorrectCount(options, t));
      issues.push(...validateOptionsLength(options, t));
      if (blankKeys.length > 0) issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      break;
    }

    // ── Q3, Q4: Completion Family (Sentence, Table, Summary, Note, Form) ──
    case QuestionType.SentenceCompletion:
    case QuestionType.TableCompletion:
    case QuestionType.SummaryCompletion:
    case QuestionType.NoteCompletion:
    case QuestionType.FormCompletion:
    case QuestionType.DiagramLabel:
    case QuestionType.MapLabel: {
      issues.push(...validateBlanks({ blankAcceptTexts: q.blankAcceptTexts, blankAcceptRegex: q.blankAcceptRegex, type: t }));
      issues.push(...validateBlankKeyFormat(t, blankKeys));
      issues.push(...validatePromptBlankParity(t, q.promptMd, blankKeys));
      issues.push(...validatePromptBlanksCoverage(t, q.promptMd, blankKeys));

      if (t === QuestionType.TableCompletion && q.promptMd && !q.promptMd.includes("|")) {
        issues.push({ level: "warning", field: "promptMd", message: "TABLE_COMPLETION prompt should contain a markdown table (|---|)." });
      }

      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      if (shortAnswers.length > 0) issues.push({ level: "error", field: "shortAnswerAcceptTexts", message: `${t}: ShortAnswerAcceptTexts must be empty.` });
      break;
    }

    // ── Q5: Flow Chart (Process Sequencing) ────────────────────────────────
    case QuestionType.FlowChart: {
      issues.push(...validateFlowChart({ orderCorrects: q.orderCorrects, type: t }));
      if (blankKeys.length > 0) {
        issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty. FLOW_CHART is process sequencing, not fill-in-the-blank.` });
      }
      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (shortAnswers.length > 0) issues.push({ level: "error", field: "shortAnswerAcceptTexts", message: `${t}: ShortAnswerAcceptTexts must be empty.` });
      break;
    }

    // ── Q6, Q7, Q9, Q10: Matching Family ─────────────────────────────────
    case QuestionType.MatchingHeading:
    case QuestionType.MatchingInformation:
    case QuestionType.MatchingFeatures:
    case QuestionType.MatchingEndings:
    case QuestionType.Classification: {
      issues.push(
        ...validateMatchPairs({
          matchPairs: q.matchPairs,
          options: options.map((o, idx) => ({
            idx: o.idx ?? idx + 1,
            contentMd: o.contentMd,
          })),
          type: t,
        })
      );
      issues.push(...validateMatchingPromptParity(t, q.promptMd, matchKeys));
      if (t === QuestionType.MatchingHeading) {
        issues.push(...validateMatchingHeadingPrompt(q.promptMd));
      }

      if (blankKeys.length > 0) issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      if (shortAnswers.length > 0) issues.push({ level: "error", field: "shortAnswerAcceptTexts", message: `${t}: ShortAnswerAcceptTexts must be empty.` });
      break;
    }

    // ── Short Answer ──────────────────────────────────────────────────────
    case QuestionType.ShortAnswer: {
      issues.push(...validateShortAnswer({ shortAnswerAcceptTexts: q.shortAnswerAcceptTexts, shortAnswerAcceptRegex: q.shortAnswerAcceptRegex, type: t }));
      issues.push(...validateShortAnswerSubQuestionCount(q.promptMd, shortAnswers));
      if (blankKeys.length > 0) issues.push({ level: "error", field: "blankAcceptTexts", message: `${t}: BlankAcceptTexts must be empty.` });
      if (matchKeys.length > 0) issues.push({ level: "error", field: "matchPairs", message: `${t}: MatchPairs must be empty.` });
      if (orders.length > 0) issues.push({ level: "error", field: "orderCorrects", message: `${t}: OrderCorrects must be empty.` });
      break;
    }
  }

  return issues;
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
