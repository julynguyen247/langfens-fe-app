export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

export interface AttemptStartData {
  attemptId: string;
  paper: Paper;
  startedAt: string; // ISO
  durationSec: number; // 3600
  timeLeft: number; // 3599
}

export interface Paper {
  id: string;
  slug: string;
  title: string;
  descriptionMd: string;
  category: string; // ví dụ: 'listening'
  level: string; // ví dụ: 'c1'
  durationMin: number;
  sections: Section[];
}

export interface Section {
  id: string;
  idx: number;
  title: string;
  instructionsMd: string;
  questions: Question[];
}

export interface Question {
  id: string;
  idx: number;
  type: string;
  skill: string;
  difficulty: number;
  promptMd: string;
  explanationMd: string;
  options: Option[];
}

export interface Option {
  id: string;
  idx: number;
  contentMd: string;
}
