import type { AiCompareResponse } from '@/types/writing';

export const mockCompareResponse: AiCompareResponse = {
  overall_analysis: "Your essay demonstrates good structure and addresses the task. However, there are areas where vocabulary and grammar could be improved to achieve a higher band score.",
  vocabulary_feedback: "Some word choices are too informal for academic writing.",
  grammar_feedback: "A few subject-verb agreement issues.",
  task_response_feedback: "You address both parts of the question adequately.",
  coherence_feedback: "Paragraphs are logically organized.",
  step_up_band: 7.0,
  target_band: 8.0,
  step_up_analysis: "To reach Band 7.0, focus on using more sophisticated vocabulary and varied sentence structures.",
  target_analysis: "To reach Band 8.0, demonstrate even greater lexical range and more complex grammatical structures.",
  key_improvements: [
    "Use more sophisticated vocabulary",
    "Improve sentence variety",
    "Strengthen transition phrases"
  ],
  sentence_comparisons: [
    {
      original: "Many people think that pollution is a big problem.",
      improved: "A significant proportion of the population believes that environmental pollution represents one of the most pressing challenges of our time.",
      explanation: "The improved version uses more formal and academic vocabulary while providing more detail.",
      category: "vocabulary",
      severity: "high"
    },
    {
      original: "The main cause of pollution is cars.",
      improved: "The primary contributor to air pollution is the widespread use of private vehicles.",
      explanation: "More precise language and academic tone.",
      category: "vocabulary",
      severity: "medium"
    }
  ],
  references: [
    {
      id: "ref-001",
      text: "In recent years, environmental pollution has become an increasingly pressing issue...",
      band: 9.0,
      similarity_score: 0.92
    }
  ]
};