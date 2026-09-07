"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  InternalDeliveryQuestion,
  QuestionGradeResult,
  QuestionType,
  UserAnswerValue,
} from "../_lib/types";
import { McqCard } from "./cards/McqCard";
import { TrueFalseCard } from "./cards/TrueFalseCard";
import { CompletionCard } from "./cards/CompletionCard";
import { MatchingCard } from "./cards/MatchingCard";
import { ShortAnswerCard } from "./cards/ShortAnswerCard";
import { FlowChartCard } from "./cards/FlowChartCard";

interface QuestionCardProps {
  question: InternalDeliveryQuestion;
  value?: UserAnswerValue;
  isFlagged: boolean;
  isReview: boolean;
  gradeResult?: QuestionGradeResult;
  onAnswerChange: (val: UserAnswerValue) => void;
  onToggleFlag: () => void;
}

export function QuestionCard({
  question,
  value,
  isFlagged,
  isReview,
  gradeResult,
  onAnswerChange,
  onToggleFlag,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(true);

  const renderBody = () => {
    const t = question.type;

    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage
    ) {
      return (
        <McqCard
          options={question.options || []}
          isMultiple={false}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.MultipleChoiceMultiple) {
      return (
        <McqCard
          options={question.options || []}
          isMultiple={true}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (
      t === QuestionType.TrueFalseNotGiven ||
      t === QuestionType.YesNoNotGiven
    ) {
      return (
        <TrueFalseCard
          questionType={t}
          options={question.options || []}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (
      t === QuestionType.SummaryCompletion ||
      t === QuestionType.TableCompletion ||
      t === QuestionType.NoteCompletion ||
      t === QuestionType.FormCompletion ||
      t === QuestionType.SentenceCompletion ||
      t === QuestionType.DiagramLabel ||
      t === QuestionType.MapLabel
    ) {
      return (
        <CompletionCard
          blankAcceptTexts={question.blankAcceptTexts}
          blankAcceptRegex={question.blankAcceptRegex}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (
      t === QuestionType.MatchingHeading ||
      t === QuestionType.MatchingInformation ||
      t === QuestionType.MatchingFeatures ||
      t === QuestionType.MatchingEndings ||
      t === QuestionType.Classification
    ) {
      return (
        <MatchingCard
          matchPairs={question.matchPairs}
          options={question.options || []}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.ShortAnswer) {
      return (
        <ShortAnswerCard
          shortAnswerAcceptTexts={question.shortAnswerAcceptTexts}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.FlowChart || t === QuestionType.FlowChartCompletion) {
      return (
        <FlowChartCard
          orderCorrects={question.orderCorrects}
          value={value}
          isReview={isReview}
          onChange={onAnswerChange}
        />
      );
    }

    return (
      <div className="p-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
        Question type: {t}
      </div>
    );
  };

  const isCorrect = isReview && gradeResult?.isCorrect;

  const qIndex = question.displayIdx ?? question.idx;

  return (
    <div
      id={`q-${qIndex}`}
      className={`rounded-3xl border-2 p-6 space-y-4 transition-all scroll-mt-24 shadow-2xs ${
        isReview
          ? isCorrect
            ? "bg-white border-emerald-400 ring-2 ring-emerald-100"
            : "bg-white border-rose-400 ring-2 ring-rose-100"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b-2 border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center text-xs font-mono font-bold">
            Q{qIndex}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {question.type.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Review Score Pill */}
          {isReview && gradeResult && (
            <span
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border ${
                isCorrect
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-rose-50 text-rose-700 border-rose-300"
              }`}
            >
              {gradeResult.score} / {gradeResult.maxScore}
            </span>
          )}

          {/* Flag Toggle Button */}
          {!isReview && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`p-1.5 rounded-xl border-2 transition active:translate-y-0.5 ${
                isFlagged
                  ? "bg-rose-50 border-rose-300 text-rose-500 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title={isFlagged ? "Remove Flag" : "Flag for review"}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7H5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Prompt Markdown */}
      {question.promptMd && (
        <div className="text-sm font-medium text-slate-900 leading-relaxed font-sans prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {question.promptMd}
          </ReactMarkdown>
        </div>
      )}

      {/* Interactive question card */}
      <div>{renderBody()}</div>

      {/* Review Explanation */}
      {isReview && question.explanationMd && (
        <div className="pt-3 border-t-2 border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition"
          >
            <span>Explanation & Rationale</span>
            <svg
              className={`w-3.5 h-3.5 transform transition-transform ${
                showExplanation ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExplanation && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 text-xs text-slate-800 leading-relaxed prose prose-slate max-w-none shadow-2xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.explanationMd}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
