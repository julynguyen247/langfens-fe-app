"use client";

import type { InternalDeliveryQuestion, UserAnswerValue } from "../types";
import { McqCard } from "./cards/McqCard";
import { TrueFalseCard } from "./cards/TrueFalseCard";
import { CompletionCard } from "./cards/CompletionCard";
import { MatchingCard } from "./cards/MatchingCard";
import { ShortAnswerCard } from "./cards/ShortAnswerCard";
import { FlowChartCard } from "./cards/FlowChartCard";
import { UnsupportedQuestionCard } from "./cards/UnsupportedQuestionCard";
import { COMPLETION_ANSWER_TYPES, MATCHING_ANSWER_TYPES, OPTION_ANSWER_TYPES } from "../contract";

/** Same inputs and controls before/after submit. Only the server supplies correctness. */
export function QuestionRenderer({ question: q, value, onChange, readOnly = false }: {
  question: InternalDeliveryQuestion;
  value?: UserAnswerValue;
  onChange?: (value: UserAnswerValue) => void;
  readOnly?: boolean;
}) {
  const change = (next: UserAnswerValue) => { if (!readOnly) onChange?.(next); };
  let body;
  if (q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "YES_NO_NOT_GIVEN") {
    body = <TrueFalseCard questionType={q.type} options={q.options ?? []} value={value} onChange={change} />;
  } else if (OPTION_ANSWER_TYPES.has(q.type)) {
    body = <McqCard options={q.options ?? []} isMultiple={q.type === "MULTIPLE_CHOICE_MULTIPLE"} imageUrl={q.imageUrl} value={value} onChange={change} />;
  } else if (COMPLETION_ANSWER_TYPES.has(q.type)) {
    body = <CompletionCard blankAcceptTexts={q.blankAcceptTexts} blankAcceptRegex={q.blankAcceptRegex} promptMd={q.promptMd} imageUrl={q.imageUrl} value={value} onChange={change} />;
  } else if (MATCHING_ANSWER_TYPES.has(q.type)) {
    body = <MatchingCard matchPairs={q.matchPairs} options={q.options ?? []} wordList={q.wordList} promptMd={q.promptMd} value={value} onChange={change} />;
  } else if (q.type === "SHORT_ANSWER") {
    body = <ShortAnswerCard value={value} onChange={change} />;
  } else if (q.type === "FLOW_CHART") {
    body = <FlowChartCard orderCorrects={q.orderCorrects} blankAcceptTexts={q.blankAcceptTexts} flowChartNodes={q.flowChartNodes} promptMd={q.promptMd} value={value} onChange={change} readOnly={readOnly} />;
  } else {
    body = <UnsupportedQuestionCard backendType={q.type} />;
  }
  return <fieldset disabled={readOnly} className="min-w-0 border-0 p-0 m-0">{body}</fieldset>;
}
