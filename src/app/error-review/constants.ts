export const SKILLS = ["READING", "LISTENING"];

export const DATE_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "All time", days: 365 },
];

export const SKILL_BADGE_STYLES: Record<string, string> = {
  READING: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  LISTENING: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  WRITING: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  SPEAKING: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "T/F/NG",
  "YES_NO_NOT_GIVEN": "Y/N/NG",
  "MCQ_SINGLE": "Multiple Choice",
  "MCQ_MULTIPLE": "Multiple Selection",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Information",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Summary Completion",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Labelling",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Labelling",
};
