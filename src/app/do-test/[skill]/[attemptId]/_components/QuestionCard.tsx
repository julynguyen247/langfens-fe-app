"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  InternalDeliveryQuestion,
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
  onAnswerChange: (val: UserAnswerValue) => void;
  onToggleFlag: () => void;
}

export function QuestionCard({
  question,
  value,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
}: QuestionCardProps) {
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
          promptMd={question.promptMd}
          imageUrl={question.imageUrl ?? null}
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
        <MatchingCard
          matchPairs={question.matchPairs}
          options={question.options || []}
          promptMd={question.promptMd}
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.ShortAnswer) {
      return (
        <ShortAnswerCard
          value={value}
          onChange={onAnswerChange}
        />
      );
    }

    if (t === QuestionType.FlowChart) {
      return (
        <FlowChartCard
          orderCorrects={question.orderCorrects}
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

  const qIndex = question.displayIdx ?? question.idx;


  return (
    <div
      id={`q-${qIndex}`}
      className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-4 transition-all scroll-mt-24 shadow-2xs"
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
          {/* Flag Toggle Button */}
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
        </div>
      </div>

      {/* Prompt Markdown — strip the embedded [Diagram: …] / [Map: …] label list
          for DIAGRAM_LABEL/MAP_LABEL: CompletionCard renders those labels as a
          word bank above the input blanks. Without the strip the raw bracket
          syntax leaks into the prompt. */}
      {question.promptMd && (
        <div className="text-sm font-medium text-slate-900 leading-relaxed font-sans prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(question.type === QuestionType.DiagramLabel ||
            question.type === QuestionType.MapLabel
              ? question.promptMd.replace(/\[(Diagram|Map):\s*[^\]]+\]/gi, "")
              : question.promptMd
            ).trim()}
          </ReactMarkdown>
        </div>
      )}

      {/* Interactive question card */}
      <div>{renderBody()}</div>
    </div>
  );
}
