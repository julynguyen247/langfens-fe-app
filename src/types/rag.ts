export type RagDomain =
  | "writing"
  | "reading"
  | "listening"
  | "speaking"
  | "grammar";

export interface Evidence {
  id: string;
  text: string;
  source: string;
  relevance: number;
}

export interface CriterionScore {
  name: string;
  band: number;
  comment: string;
  evidence_ids?: string[];
}

export interface Suggestion {
  text: string;
  target: string;
}

export interface RagFeedbackEnvelope {
  item_id: string;
  domain: RagDomain;
  overall_band?: number | null;
  criteria: CriterionScore[];
  evidence: Evidence[];
  suggestions: Suggestion[];
  raw_llm_json?: string;
}
