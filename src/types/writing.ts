export interface SentenceComparison {
  original: string;
  improved: string;
  explanation: string;
  category: 'vocabulary' | 'grammar' | 'coherence' | 'structure';
  severity?: 'low' | 'medium' | 'high';
}

export interface ReferenceEssay {
  id: string;
  text: string;
  band: number;
  similarity_score: number;
}

export interface AiCompareResponse {
  overall_analysis: string;
  vocabulary_feedback: string;
  grammar_feedback: string;
  task_response_feedback: string;
  coherence_feedback: string;
  step_up_band: number;
  target_band: number;
  step_up_analysis: string;
  target_analysis: string;
  key_improvements: string[];
  sentence_comparisons: SentenceComparison[];
  references: ReferenceEssay[];
  no_references_found?: boolean;
}

export interface GrammarExplainResponse {
  explanation: string;
  rule_description: string;
  correct_form: string;
  examples: string[];
  category: 'tense' | 'subject-verb' | 'word-order' | 'article' | 'preposition' | 'pronoun' | 'collocation' | 'other';
}