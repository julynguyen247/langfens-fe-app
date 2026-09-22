import { AdminQuestionUpsert } from "./types";
import { validateQuestionPayload } from "./validation";
import {
  AiConfig,
  DEFAULT_AI_CONFIG,
  callAi,
  tryParseLlmJson,
  isAiConfigured,
} from "./aiConfig";
import { QUESTION_TYPE_REGISTRY } from "./questionTypeRegistry";
import { getLlmPrompt } from "./llmPrompts";
import { createQuestion, createOption } from "./adminApi";

export interface ParsedAuthorOption {
  idx: number;
  contentMd: string;
  isCorrect: boolean;
  imageUrl?: string | null;
  altText?: string | null;
}

export interface ParsedAuthorQuestion {
  upsert: AdminQuestionUpsert;
  options?: ParsedAuthorOption[];
}

export interface GenerateQuestionsParams {
  config?: AiConfig;
  type: string;
  skill?: string;
  passage: string;
  count?: number;
  difficulty?: number;
  extraContext?: string;
  sectionId?: string;
}

export interface GenerateQuestionsResult {
  rawText: string;
  questions: ParsedAuthorQuestion[];
  validationErrors: string[];
}

/**
 * Resolves the primary passage text for a section, preferring passageMd
 * (reading passage) and falling back to transcriptMd (listening transcript).
 */
export function resolveSectionPassage(
  section?: { passageMd?: string | null; transcriptMd?: string | null } | null
): string {
  const p = section?.passageMd?.trim();
  if (p) return p;
  return section?.transcriptMd?.trim() || "";
}

/**
 * Calls the AI engine to generate questions grounded in the supplied passage,
 * parses the response into AdminQuestionUpsert models, and validates the output.
 */
export async function generateQuestionsFromPassage(
  params: GenerateQuestionsParams
): Promise<GenerateQuestionsResult> {
  const passage = (params.passage || "").trim();
  if (!passage) {
    throw new Error("Source passage is required to generate questions.");
  }

  const prompt = getLlmPrompt(params.type);
  if (!prompt) {
    throw new Error(`No LLM prompt template for type ${params.type}. Add one in llmPrompts.ts.`);
  }

  const typeMeta = QUESTION_TYPE_REGISTRY[params.type];
  const config = params.config || DEFAULT_AI_CONFIG;

  if (!isAiConfigured(config)) {
    throw new Error(
      config.provider === "server-proxy"
        ? "AI endpoint not configured. Set NEXT_PUBLIC_AI_SERVICE_URL or NEXT_PUBLIC_GATEWAY_URL."
        : "AI not configured. Set NEXT_PUBLIC_AI_API_KEY in .env.local"
    );
  }

  const count = params.count ?? 1;
  const difficulty =
    params.difficulty ?? Math.max(1, Math.min(5, Number(typeMeta?.defaultDifficulty) || 3));
  const skill = (params.skill || "READING").toUpperCase();

  const userPrompt = prompt.userTemplate(passage, count, {
    difficulty: String(difficulty),
    extra: params.extraContext || "",
  });

  const rawText = await callAi(config, prompt.system, userPrompt, {
    type: params.type,
    skill,
    count,
    difficulty,
    passage,
    extraContext: (params.extraContext || "").trim(),
  });

  const parsed = tryParseLlmJson(rawText);
  if (!parsed) {
    throw new Error("LLM output could not be parsed as JSON. See response below.");
  }

  const questions: ParsedAuthorQuestion[] = parsed.map((q) => {
    const obj = (q as Record<string, unknown>) || {};
    const rawOptions = Array.isArray(obj.options) ? obj.options : [];
    const mappedOptions: ParsedAuthorOption[] = rawOptions.map(
      (o: Record<string, unknown>, idx: number) => ({
        idx: typeof o.idx === "number" ? o.idx : idx + 1,
        contentMd: String(o.contentMd || o.text || ""),
        isCorrect: Boolean(o.isCorrect),
        ...(typeof o.imageUrl === "string" && o.imageUrl.trim() ? { imageUrl: o.imageUrl.trim() } : {}),
        ...(typeof o.altText === "string" && o.altText.trim() ? { altText: o.altText.trim() } : {}),
      })
    );

    const upsert: AdminQuestionUpsert = {
      SectionId: params.sectionId || "",
      Type: String(params.type || obj.type).toUpperCase(),
      Skill: String(params.skill || obj.skill || skill).toUpperCase(),
      Difficulty: Math.max(1, Math.min(5, Number(obj.difficulty ?? difficulty))),
      PromptMd: String(obj.promptMd || ""),
      ExplanationMd: typeof obj.explanationMd === "string" ? obj.explanationMd : null,
      ImageUrl: typeof obj.imageUrl === "string" ? obj.imageUrl : null,
      BlankAcceptTexts: (obj.blankAcceptTexts ?? null) as AdminQuestionUpsert["BlankAcceptTexts"],
      BlankAcceptRegex: (obj.blankAcceptRegex ?? null) as AdminQuestionUpsert["BlankAcceptRegex"],
      MatchPairs: (obj.matchPairs ?? null) as AdminQuestionUpsert["MatchPairs"],
      OrderCorrects: (obj.orderCorrects ?? null) as AdminQuestionUpsert["OrderCorrects"],
      ShortAnswerAcceptTexts: (obj.shortAnswerAcceptTexts ?? null) as AdminQuestionUpsert["ShortAnswerAcceptTexts"],
      ShortAnswerAcceptRegex: (obj.shortAnswerAcceptRegex ?? null) as AdminQuestionUpsert["ShortAnswerAcceptRegex"],
    };

    return {
      upsert,
      options: mappedOptions.length > 0 ? mappedOptions : undefined,
    };
  });

  const validationErrors: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    const { upsert: eq, options: optList } = questions[i];
    const issues = validateQuestionPayload({
      type: eq.Type,
      skill: eq.Skill,
      difficulty: eq.Difficulty,
      promptMd: eq.PromptMd,
      explanationMd: eq.ExplanationMd,
      imageUrl: eq.ImageUrl,
      options: optList,
      blankAcceptTexts: eq.BlankAcceptTexts,
      blankAcceptRegex: eq.BlankAcceptRegex,
      matchPairs: eq.MatchPairs,
      orderCorrects: eq.OrderCorrects,
      shortAnswerAcceptTexts: eq.ShortAnswerAcceptTexts,
      shortAnswerAcceptRegex: eq.ShortAnswerAcceptRegex,
    });
    for (const iss of issues) {
      if (iss.level === "error") {
        validationErrors.push(`Q#${i + 1} [${iss.field}]: ${iss.message}`);
      }
    }
  }

  return {
    rawText,
    questions,
    validationErrors,
  };
}

/**
 * Sequentially creates questions and their associated options in the database.
 * Returns the count of successfully created questions.
 */
export async function persistGeneratedQuestions(
  sectionId: string,
  questions: ParsedAuthorQuestion[]
): Promise<number> {
  if (!questions || questions.length === 0) return 0;

  // Validate all questions before writing to the database
  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const issues = validateQuestionPayload({
      type: item.upsert.Type,
      skill: item.upsert.Skill,
      difficulty: item.upsert.Difficulty,
      promptMd: item.upsert.PromptMd,
      explanationMd: item.upsert.ExplanationMd,
      imageUrl: item.upsert.ImageUrl,
      options: item.options,
      blankAcceptTexts: item.upsert.BlankAcceptTexts,
      blankAcceptRegex: item.upsert.BlankAcceptRegex,
      matchPairs: item.upsert.MatchPairs,
      orderCorrects: item.upsert.OrderCorrects,
      shortAnswerAcceptTexts: item.upsert.ShortAnswerAcceptTexts,
      shortAnswerAcceptRegex: item.upsert.ShortAnswerAcceptRegex,
    });
    const errors = issues.filter((iss) => iss.level === "error");
    if (errors.length > 0) {
      throw new Error(`Cannot persist invalid Q#${i + 1}: ${errors.map((e) => e.message).join("; ")}`);
    }
  }

  let savedCount = 0;

  for (const item of questions) {
    const created = await createQuestion({
      ...item.upsert,
      SectionId: sectionId,
    });

    if (created?.id && item.options && item.options.length > 0) {
      for (const opt of item.options) {
        await createOption({
          QuestionId: created.id,
          Idx: opt.idx,
          ContentMd: opt.contentMd,
          IsCorrect: opt.isCorrect,
          ...(opt.imageUrl ? { ImageUrl: opt.imageUrl } : {}),
          ...(opt.altText ? { AltText: opt.altText } : {}),
        });
      }
    }
    savedCount++;
  }

  return savedCount;
}
