/**
 * Canonical Reason Taxonomy and Small-Edit Policy for Human Feedback.
 * Synchronized with exam-service Features/ReadingPaper/Contracts/FeedbackContracts.cs.
 */

export const FEEDBACK_REASON_IDS = {
  UNSUPPORTED_CLAIM: "unsupported_claim",
  AMBIGUITY: "ambiguity",
  TOO_DIRECT_OR_EASY: "too_direct_or_easy",
  WEAK_DISTRACTOR: "weak_distractor",
  STYLE_OR_GRAMMAR: "style_or_grammar",
  TYPO_OR_FORMATTING: "typo_or_formatting",
  POLICY_VIOLATION: "policy_violation",
  SOURCE_LICENSE_ISSUE: "source_license_issue",
} as const;

export type FeedbackReasonId = (typeof FEEDBACK_REASON_IDS)[keyof typeof FEEDBACK_REASON_IDS];

export interface FeedbackReasonOption {
  id: FeedbackReasonId;
  label: string;
  description: string;
  category: "factuality" | "difficulty" | "editorial" | "compliance";
}

export const FEEDBACK_REASONS: readonly FeedbackReasonOption[] = [
  {
    id: "unsupported_claim",
    label: "Unsupported Claim",
    description: "Question premise, answer key, or explanation is not supported by the cited passage text.",
    category: "factuality",
  },
  {
    id: "ambiguity",
    label: "Ambiguity",
    description: "Prompt or options permit more than one plausible interpretation or multiple valid answers.",
    category: "editorial",
  },
  {
    id: "too_direct_or_easy",
    label: "Too Direct or Easy",
    description: "Editorial flag: question is overly transparent or copies verbatim passage phrasing (editorial label, not calibrated difficulty).",
    category: "difficulty",
  },
  {
    id: "weak_distractor",
    label: "Weak Distractor",
    description: "One or more distractors are obviously implausible or grammatically defective, trivializing the item.",
    category: "editorial",
  },
  {
    id: "style_or_grammar",
    label: "Style or Grammar",
    description: "Awkward syntax, non-standard punctuation, or unnatural phrasing requiring polish.",
    category: "editorial",
  },
  {
    id: "typo_or_formatting",
    label: "Typo or Formatting",
    description: "Minor typographical error, markdown artifact, or whitespace / case irregularity.",
    category: "editorial",
  },
  {
    id: "policy_violation",
    label: "Policy Violation",
    description: "Violates IELTS question format constraints, word limits, or item design rules.",
    category: "compliance",
  },
  {
    id: "source_license_issue",
    label: "Source / License Issue",
    description: "Passage contains unverified attribution, restrictive license terms, or eligibility concerns.",
    category: "compliance",
  },
] as const;

export const CurationStatus = {
  Raw: "RAW",
  Annotated: "ANNOTATED",
  Reviewed: "REVIEWED",
  Curated: "CURATED",
  Rejected: "REJECTED",
} as const;

export type CurationStatusType = (typeof CurationStatus)[keyof typeof CurationStatus];

export const FeedbackAction = {
  Create: "CREATE",
  Update: "UPDATE",
  Delete: "DELETE",
  Accept: "ACCEPT",
  Reject: "REJECT",
  Publish: "PUBLISH",
} as const;

export type FeedbackActionType = (typeof FeedbackAction)[keyof typeof FeedbackAction];

export interface HumanFeedback {
  id: string;
  feedbackId: string;
  runId: string;
  examId: string;
  sectionId?: string | null;
  questionId?: string | null;
  optionId?: string | null;
  targetEntityType: string;
  targetEntityId: string;
  artifactId?: string | null;
  artifactVersion?: number | null;
  beforeContentHash?: string | null;
  afterContentHash?: string | null;
  beforePayloadJson?: string | null;
  afterPayloadJson?: string | null;
  diffJson?: string | null;
  editorId?: string | null;
  editorRole?: string | null;
  reasons: string[];
  comment?: string | null;
  downstreamImpactJson?: string | null;
  actionType: string;
  curationStatus: string;
  idempotencyKey?: string | null;
  createdAt: string;
}

export interface FeedbackReviewRequest {
  curationStatus: string;
  reviewerNotes?: string | null;
  reasons?: string[];
  idempotencyKey?: string | null;
}

export interface SmallEditPolicyResult {
  isSmallEdit: boolean;
  reasonsRequired: boolean;
  reasonsRecommended: boolean;
  characterDiff: number;
  formattingOnly: boolean;
  explanation: string;
}

const FORMATTING_REGEX = /[^\w]+/g;

/**
 * Checks if two strings differ only by formatting/punctuation when alphanumeric characters match.
 */
export function isFormattingOnly(before: string, after: string): boolean {
  if (before == null || after == null) return false;
  const beforeNorm = before.toLowerCase().replace(FORMATTING_REGEX, "");
  const afterNorm = after.toLowerCase().replace(FORMATTING_REGEX, "");
  return beforeNorm === afterNorm;
}

/**
 * Computes character-level edit distance using Levenshtein distance.
 */
export function countCharacterDiff(before: string, after: string): number {
  const b = before ?? "";
  const a = after ?? "";
  if (b === a) return 0;
  if (!b) return a.length;
  if (!a) return b.length;

  const m = b.length;
  const n = a.length;
  if (Math.abs(m - n) > 50) return Math.abs(m - n);

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[n];
}

/**
 * Evaluates whether an edit qualifies as a "small edit" (diff <= 10 or formatting-only).
 * Returns true if reasons are optional, false if substantive (reasons recommended/required).
 */
export function isSmallEdit(beforeStr: string, afterStr: string): boolean {
  const diff = countCharacterDiff(beforeStr, afterStr);
  if (diff === 0 || diff <= 10) return true;
  return isFormattingOnly(beforeStr, afterStr);
}

/**
 * Full small-edit policy evaluation with detailed metrics and explanations.
 */
export function evaluateSmallEditPolicy(beforeStr: string, afterStr: string): SmallEditPolicyResult {
  const diff = countCharacterDiff(beforeStr, afterStr);
  const formattingOnly = diff > 0 && isFormattingOnly(beforeStr, afterStr);
  const small = diff === 0 || diff <= 10 || formattingOnly;

  return {
    isSmallEdit: small,
    reasonsRequired: !small,
    reasonsRecommended: !small && !formattingOnly,
    characterDiff: diff,
    formattingOnly,
    explanation: small
      ? formattingOnly
        ? "Formatting-only change — reasons optional."
        : "Small edit (≤ 10 character diff) — reasons optional."
      : "Substantive edit — at least one reason recommended; reasoning required before finalization.",
  };
}
