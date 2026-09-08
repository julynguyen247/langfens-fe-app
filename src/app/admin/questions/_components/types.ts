export interface QuestionBankOption {
  id: string;
  text: string;
  isCorrect: boolean;
  idx: number;
}

export interface QuestionBankItem {
  id: string;
  idx: number;
  type: string;
  skill: string;
  difficulty: number;
  promptMd?: string | null;
  explanationMd?: string | null;
  sectionId: string;
  sectionTitle: string;
  examId: string;
  examTitle: string;
  options?: QuestionBankOption[] | null;
  matchPairs?: Record<string, string[] | null> | null;
  blankAcceptTexts?: Record<string, string[]> | null;
  blankAcceptRegex?: Record<string, string[]> | null;
  orderCorrects?: string[] | null;
  shortAnswerAcceptTexts?: string[] | null;
  shortAnswerAcceptRegex?: string[] | null;
}

export interface QuestionTypeCount {
  type: string;
  count: number;
}

export interface QuestionBankResult {
  items: QuestionBankItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
