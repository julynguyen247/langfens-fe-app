// Shared chip color tokens and question type labels for the practice list page.
// Single source of truth — PracticeToolbar reads these, PracticeCard may use them
// for the question-count chip background if needed.

export type SkillId = "reading" | "listening" | "writing" | "speaking";

export type SkillChipColors = {
  activeBg: string;
  activeText: string;
  activeBorder: string;
};

export const SKILL_CHIP_COLORS: Record<SkillId, SkillChipColors> = {
  reading: {
    activeBg: "var(--skill-reading-light)",
    activeText: "var(--skill-reading)",
    activeBorder: "var(--skill-reading-border)",
  },
  listening: {
    activeBg: "var(--skill-listening-light)",
    activeText: "var(--skill-listening)",
    activeBorder: "var(--skill-listening-border)",
  },
  writing: {
    activeBg: "var(--skill-writing-light)",
    activeText: "var(--skill-writing)",
    activeBorder: "var(--skill-writing-border)",
  },
  speaking: {
    activeBg: "var(--skill-speaking-light)",
    activeText: "var(--skill-speaking)",
    activeBorder: "var(--skill-speaking-border)",
  },
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  TRUE_FALSE_NOT_GIVEN: "True/False/NG",
  YES_NO_NOT_GIVEN: "Yes/No/NG",
  MCQ_SINGLE: "Multiple Choice",
  MCQ_MULTIPLE: "Multiple Selection",
  MULTIPLE_CHOICE_SINGLE: "Multiple Choice",
  MULTIPLE_CHOICE_MULTIPLE: "Multiple Selection",
  MATCHING_HEADING: "Matching Headings",
  MATCHING_INFORMATION: "Matching Info",
  MATCHING_FEATURES: "Matching Features",
  SUMMARY_COMPLETION: "Gap Filling",
  TABLE_COMPLETION: "Table Completion",
  SENTENCE_COMPLETION: "Sentence Completion",
  DIAGRAM_LABEL: "Diagram Label",
  SHORT_ANSWER: "Short Answer",
  MAP_LABEL: "Map Label",
};
