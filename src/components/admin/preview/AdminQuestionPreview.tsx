"use client";

import React, { useState } from "react";
import {
  InternalDeliveryOption,
  InternalDeliveryQuestion,
  QuestionType,
} from "@/app/admin/_lib/types";
import { AdminPreviewFrame } from "./AdminPreviewFrame";
import { McqCardV3 } from "@/components/exam-v3/cards/McqCardV3";
import { TrueFalseCardV3 } from "@/components/exam-v3/cards/TrueFalseCardV3";
import { MatchingCardV3 } from "@/components/exam-v3/cards/MatchingCardV3";
import { CompletionCardV3 } from "@/components/exam-v3/cards/CompletionCardV3";
import { ShortAnswerCardV3 } from "@/components/exam-v3/cards/ShortAnswerCardV3";
import { FlowChartCardV3 } from "@/components/exam-v3/cards/FlowChartCardV3";
import { MatchingCard as V1MatchingCard } from "@/app/do-test/[skill]/[attemptId]/_components/cards/MatchingCard";
import { getMeta } from "@/app/admin/_lib/questionTypeRegistry";

interface AdminQuestionPreviewProps {
  question: InternalDeliveryQuestion;
  displayIdx?: number;
}

function NoPreview({ label }: { label: string }) {
  return (
    <div className="p-6 text-center text-xs text-slate-400 italic">
      {label}
    </div>
  );
}

function augmentClassificationOptions(
  opts: InternalDeliveryOption[],
  promptMd?: string | null
): InternalDeliveryOption[] {
  if (!promptMd) return opts;

  const catRegex = /^([A-Z])\.\s+(.+)$/gm;
  const promptCats: { letter: string; label: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = catRegex.exec(promptMd)) !== null) {
    promptCats.push({ letter: m[1], label: `${m[1]}. ${m[2].trim()}` });
  }
  if (promptCats.length === 0) return opts;

  const existingLetters = new Set(
    opts
      .map((o) => {
        const match = (o.contentMd || "").trim().match(/^([A-Z])\b/);
        return match ? match[1] : null;
      })
      .filter((x): x is string => Boolean(x))
  );

  const augmented = [...opts];
  let nextIdx = opts.length + 1;
  for (const c of promptCats) {
    if (!existingLetters.has(c.letter)) {
      augmented.push({
        id: `virtual-cls-${c.letter}`,
        idx: nextIdx++,
        contentMd: c.label,
        isCorrect: false,
      });
    }
  }
  return augmented;
}

export function AdminQuestionPreview({
  question,
  displayIdx,
}: AdminQuestionPreviewProps) {
  const meta = getMeta(question.type);
  const idx = displayIdx ?? question.displayIdx ?? question.idx;
  const [value, setValue] = useState<unknown>(undefined);

  const renderBody = () => {
    const t = question.type;
    const opts = question.options || [];

    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage
    ) {
      return (
        <McqCardV3
          options={opts}
          isMultiple={false}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.MultipleChoiceMultiple) {
      return (
        <McqCardV3
          options={opts}
          isMultiple={true}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.TrueFalseNotGiven || t === QuestionType.YesNoNotGiven) {
      return (
        <TrueFalseCardV3
          questionType={t}
          options={opts}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (
      t === QuestionType.MatchingHeading ||
      t === QuestionType.MatchingInformation ||
      t === QuestionType.MatchingFeatures ||
      t === QuestionType.MatchingEndings
    ) {
      return (
        <MatchingCardV3
          matchPairs={question.matchPairs}
          options={opts}
          promptMd={question.promptMd}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.Classification) {
      const augmentedOpts = augmentClassificationOptions(opts, question.promptMd);
      return (
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {question.promptMd && (
            <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
              {question.promptMd}
            </div>
          )}
          <V1MatchingCard
            matchPairs={question.matchPairs}
            options={augmentedOpts}
            value={value as never}
            isReview={false}
            onChange={(v) => setValue(v)}
          />
        </div>
      );
    }
    if (
      t === QuestionType.SummaryCompletion ||
      t === QuestionType.TableCompletion ||
      t === QuestionType.NoteCompletion ||
      t === QuestionType.FormCompletion ||
      t === QuestionType.SentenceCompletion ||
      t === QuestionType.DiagramLabel ||
      t === QuestionType.MapLabel ||
      t === QuestionType.FlowChartCompletion
    ) {
      return (
        <CompletionCardV3
          promptMd={question.promptMd || ""}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.ShortAnswer) {
      return (
        <ShortAnswerCardV3
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.FlowChart) {
      return (
        <FlowChartCardV3
          orderCorrects={question.orderCorrects}
          mode="exam"
          value={value as never}
          onChange={(v) => setValue(v)}
        />
      );
    }
    if (t === QuestionType.AudioResponse) {
      return <NoPreview label="Speaking task — audio recording flow not previewed" />;
    }
    return <NoPreview label={`No preview for type: ${t}`} />;
  };

  return (
    <AdminPreviewFrame
      title={`PREVIEW Q${idx} — ${meta.label}`}
      hint="Interactive — answer like a candidate"
    >
      {renderBody()}
    </AdminPreviewFrame>
  );
}
