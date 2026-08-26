// SSOT re-export: the Langfens question-schema package is the single
// source of truth for canonical question type slugs, labels, and per-type
// metadata. This file previously held a local 21-string literal union and
// a deprecated QuestionUiKind indirection; both have been replaced by
// the SSOT exports as of Phase 2.
export {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_METADATA,
  resolveDeprecatedAlias,
  isCanonicalType,
  isDeprecatedAlias,
} from "@langfens/question-schema";
export type {
  QuestionTypeSlug,
  DeprecatedTypeAlias,
  AnyQuestionType,
  QuestionTypeMetadata,
} from "@langfens/question-schema";