"use client";

import {
  InternalDeliveryQuestion,
  QuestionGradeResult,
  UserAnswerValue,
} from "../_lib/types";
import { QuestionCard } from "@/app/test-v2/_components/QuestionCard";

interface ReviewQuestionCardProps {
  question: InternalDeliveryQuestion;
  value?: UserAnswerValue;
  gradeResult?: QuestionGradeResult;
  onLocateParagraph?: (letter: string) => void;
}

export function ReviewQuestionCard({
  question,
  value,
  gradeResult,
  onLocateParagraph,
}: ReviewQuestionCardProps) {
  // Extract paragraph reference if prompt or instruction explicitly mentions one
  const paraMatch =
    question.promptMd?.match(/paragraph\s+([A-Z])\b/i) ||
    question.explanationMd?.match(/paragraph\s+([A-Z])\b/i) ||
    question.promptMd?.match(/\[([A-Z])\]/);

  const referencedParagraph = paraMatch ? paraMatch[1].toUpperCase() : null;

  const reviewAction =
    referencedParagraph && onLocateParagraph ? (
      <button
        type="button"
        onClick={() => onLocateParagraph(referencedParagraph)}
        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition flex items-center gap-1 cursor-pointer shadow-2xs"
        title={`Locate Paragraph [${referencedParagraph}] in reading passage`}
      >
        <span>📍</span>
        <span>Para [{referencedParagraph}]</span>
      </button>
    ) : undefined;

  return (
    <QuestionCard
      question={question}
      value={value}
      isFlagged={false}
      isReview={true}
      gradeResult={gradeResult}
      reviewAction={reviewAction}
      onAnswerChange={() => {}}
      onToggleFlag={() => {}}
    />
  );
}
