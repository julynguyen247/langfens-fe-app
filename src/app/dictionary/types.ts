// =============================================
// TYPES (Based on backend JSON)
// =============================================
interface Pronunciation {
  region: string;
  ipa: string;
  mp3Url: string | null;
}

interface DictionaryForm {
  form: string;
  tags: string[];
}

interface DictionarySense {
  id: string;
  definitionEn: string;
  definitionVi?: string | null;
  vietnameseTerms?: string[];
  examples: string[];
  labels: string[];
}

export interface DictionaryEntry {
  id: number;
  word: string;
  pos: string;
  pronunciations: Pronunciation[];
  senses: DictionarySense[];
  forms: DictionaryForm[];
  vietnameseTerms?: string[];
}

export interface Suggestion {
  id: number;
  word: string;
  pos: string;
}
