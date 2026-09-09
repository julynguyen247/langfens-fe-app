"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  InternalDeliveryQuestion,
  QuestionGradeResult,
  QuestionType,
  UserAnswerValue,
} from "./types";
import { McqCardV3 } from "./cards/McqCardV3";
import { TrueFalseCardV3 } from "./cards/TrueFalseCardV3";
import { MatchingCardV3 } from "./cards/MatchingCardV3";
import { CompletionCardV3 } from "./cards/CompletionCardV3";
import { ShortAnswerCardV3 } from "./cards/ShortAnswerCardV3";
import { FlowChartCardV3 } from "./cards/FlowChartCardV3";

interface QuestionCardV3Props {
  question: InternalDeliveryQuestion;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  isFlagged?: boolean;
  gradeResult?: QuestionGradeResult;
  onAnswerChange?: (val: UserAnswerValue) => void;
  onToggleFlag?: () => void;
  onLocateParagraph?: (paraLetter: string) => void;
}

export function QuestionCardV3({
  question,
  mode,
  value,
  isFlagged = false,
  gradeResult,
  onAnswerChange,
  onToggleFlag,
  onLocateParagraph,
}: QuestionCardV3Props) {
  const [showExplanation, setShowExplanation] = useState(true);

  const isReview = mode === "review";
  const t = question.type;
  const isCorrect = gradeResult?.isCorrect === true;
  const hasUserAnswer =
    value !== undefined &&
    value !== null &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0) &&
    !(typeof value === "object" && Object.keys(value).length === 0);

  const qIndex = question.displayIdx ?? question.idx;

  const paraMatch =
    question.promptMd?.match(/paragraph\s+([A-Z])\b/i) ||
    question.explanationMd?.match(/paragraph\s+([A-Z])\b/i) ||
    question.promptMd?.match(/\[([A-Z])\]/);
  const referencedParagraph = paraMatch ? paraMatch[1].toUpperCase() : null;

  const renderBody = () => {
    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage
    ) {
      return (
        <McqCardV3
          options={question.options || []}
          isMultiple={false}
          mode={mode}
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.MultipleChoiceMultiple) {
      return (
        <McqCardV3
          options={question.options || []}
          isMultiple={true}
          mode={mode}
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (
      t === QuestionType.TrueFalseNotGiven ||
      t === QuestionType.YesNoNotGiven
    ) {
      return (
        <TrueFalseCardV3
          questionType={t}
          options={question.options || []}
          mode={mode}
          value={value}
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
        <MatchingCardV3
          matchPairs={question.matchPairs}
          options={question.options || []}
          promptMd={question.promptMd}
          mode={mode}
          value={value}
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
        <CompletionCardV3
          blankAcceptTexts={question.blankAcceptTexts}
          blankAcceptRegex={question.blankAcceptRegex}
          promptMd={question.promptMd}
          mode={mode}
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.ShortAnswer) {
      return (
        <ShortAnswerCardV3
          shortAnswerAcceptTexts={question.shortAnswerAcceptTexts}
          mode={mode}
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.FlowChart) {
      return (
        <FlowChartCardV3
          orderCorrects={question.orderCorrects}
          mode={mode}
          value={value}
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

  return (
    <div
      id={`q-${qIndex}`}
      className={`rounded-3xl border-2 p-6 space-y-4 transition-all scroll-mt-24 shadow-2xs font-sans ${
        isReview
          ? isCorrect
            ? "bg-white border-emerald-400 ring-2 ring-emerald-100"
            : hasUserAnswer
            ? "bg-white border-rose-400 ring-2 ring-rose-100"
            : "bg-white border-slate-300"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b-2 border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center text-xs font-mono font-bold">
            Q{qIndex}
          </span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {question.type.replace(/_/g, " ")}
          </span>
          {question.skill && (
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Skill: <strong className="text-slate-700">{question.skill}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isReview ? (
            <>
              {referencedParagraph && onLocateParagraph && (
                <button
                  type="button"
                  onClick={() => onLocateParagraph(referencedParagraph)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title={`Locate Paragraph [${referencedParagraph}] in reading passage`}
                >
                  <span>📍</span>
                  <span>Para [{referencedParagraph}]</span>
                </button>
              )}

              <span
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : hasUserAnswer
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isCorrect ? "1 / 1" : "0 / 1"} — {isCorrect ? "Correct ✓" : hasUserAnswer ? "Wrong ✕" : "Unanswered"}
              </span>
            </>
          ) : (
            onToggleFlag && (
              <button
                type="button"
                onClick={onToggleFlag}
                className={`p-2 rounded-xl border-2 transition active:scale-95 cursor-pointer ${
                  isFlagged
                    ? "bg-amber-50 border-amber-400 text-amber-600 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
                title={isFlagged ? "Remove review flag" : "Flag for review"}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7H5z" />
                </svg>
              </button>
            )
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

      {/* Type Card Body */}
      <div>{renderBody()}</div>

      {/* Explanation Section (Review Mode) */}
      {isReview && Boolean(question.explanationMd?.trim()) && (
        <div className="pt-3 border-t-2 border-slate-100">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] transition cursor-pointer"
          >
            <span>{showExplanation ? "Hide Detailed Explanation" : "View Detailed Explanation"}</span>
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
            <div className="mt-2.5 p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 text-xs text-slate-800 leading-relaxed prose prose-slate max-w-none shadow-2xs">
              <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Answer Analysis & Rationale:</span>
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.explanationMd || ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
