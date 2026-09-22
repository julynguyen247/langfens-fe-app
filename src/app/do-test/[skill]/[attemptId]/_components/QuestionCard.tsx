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
          blankAcceptTexts={question.blankAcceptTexts}
          flowChartNodes={question.flowChartNodes}
          promptMd={question.promptMd}
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
          syntax leaks into the prompt.
          For Matching types the promptMd often includes a raw "List of Headings: i. ... ii. ..."
          paragraph — MatchingCard already renders the choices box so we strip
          that paragraph here to avoid duplication and the wall-of-text problem. */}
      {question.promptMd && (() => {
        const isMatching =
          question.type === QuestionType.MatchingHeading ||
          question.type === QuestionType.MatchingInformation ||
          question.type === QuestionType.MatchingFeatures ||
          question.type === QuestionType.MatchingEndings ||
          question.type === QuestionType.Classification;

        const isDiagramMap =
          question.type === QuestionType.DiagramLabel ||
          question.type === QuestionType.MapLabel;

        const isFlowChart = question.type === QuestionType.FlowChart;

        let md = question.promptMd;

        // Unescape literal \n stored in DB as a two-char sequence
        md = md.replace(/\\n/g, "\n");

        // Strip [Diagram/Map: ...] word-bank marker for diagram/map types
        if (isDiagramMap) {
          md = md.replace(/\[(Diagram|Map):\s*[^\]]+\]/gi, "");
        }

        // For Matching types: strip the "List of Headings: …" paragraph since
        // MatchingCard already shows the choices box.
        if (isMatching) {
          const lohi = md.indexOf("List of Headings:");
          if (lohi !== -1) md = md.slice(0, lohi);
        }

        // For FlowChart: strip the "Available steps: A. … B. …" list and
        // the trailing "Arrange steps …" instruction — FlowChartCard renders
        // the draggable tiles itself.
        if (isFlowChart) {
          const avail = md.search(/Available steps[:\s]/i);
          if (avail !== -1) md = md.slice(0, avail);
          const arrange = md.search(/Arrange (the )?steps?\s/i);
          if (arrange !== -1) md = md.slice(0, arrange);
        }

        // Ensure single \n becomes double \n so ReactMarkdown renders proper
        // paragraph breaks — BUT:
        //   • table rows (lines starting with "|") must stay consecutive
        //   • lines inside fenced code blocks (``` ... ```) must stay consecutive
        {
          const lines = md.split("\n");
          const out: string[] = [];
          let inFence = false;
          for (let i = 0; i < lines.length; i++) {
            const cur = lines[i];
            if (cur.trimStart().startsWith("```")) inFence = !inFence;
            out.push(cur);
            if (i < lines.length - 1 && !inFence) {
              const curT = cur.trimStart();
              const nxtT = lines[i + 1].trimStart();
              if (!curT.startsWith("|") && !nxtT.startsWith("|")) {
                out.push("");
              }
            }
          }
          md = out.join("\n");
        }

        md = md.trim();
        if (!md) return null;

        return (
          <div className="text-sm font-medium text-slate-900 leading-relaxed font-sans prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </div>
        );
      })()}

      {/* Interactive question card */}
      <div>{renderBody()}</div>
    </div>
  );
}
