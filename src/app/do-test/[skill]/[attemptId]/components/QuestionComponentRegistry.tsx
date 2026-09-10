"use client";

import React from "react";
import QuestionCard from "./common/QuestionCard";
import MultiCheckboxCard from "./reading/MultiCheckboxCard";
import SummaryCompletionCard from "./reading/SummaryCompletionCard";
import MatchingLetterCard from "./reading/MatchingLetterCard";
import HeadingDropdown from "./reading/HeadingDropdown";
import FlowChartCard from "./reading/FlowChartCard";
import MatchingInformation from "./reading/WordListCompletionCard";
import ClassificationCard from "./reading/ClassificationCard";
import FillInBlankCard from "./reading/FillInBlankCard";
import MultiChoiceImageCard from "./reading/MultiChoiceImageCard";
import MapLabelCard from "./reading/MapLabelCard";
import DiagramLabelCard from "./reading/DiagramLabelCard";

/** Raw question shape from API */
export type RawQuestion = {
  id: string;
  idx?: number;
  type: string;
  stem?: string;
  promptMd?: string;
  explanationMd?: string;
  options?: { id: string; idx: number; contentMd: string }[];
  flowChartNodes?: { key: string; label: string }[];
  /** Structured word list for MATCHING_INFORMATION */
  wordList?: string[];
};

/** Props accepted by every registered component via the registry */
export type QuestionProps = {
  question: RawQuestion;
  selected?: string;
  value?: string;
  values?: string[];
  onSelect?: (id: string, value: string) => void;
  onChange?: (value: string) => void;
  onBlankChange?: (blankIndex: number, value: string) => void;
  forices?: { value: string; label: string }[];
  nodes?: { key: string; label: string }[];
};

/**
 * Direct BackendQuestionType → Component registry.
 * Replaces the QuestionUiKind / mapApiQuestionToUi indirection.
 * UI dispatch now uses deriveUiKind from `@/lib/deriveUiKind` for
 * the uiKind value the QuestionPanel consumes.
 */
export const QuestionComponentRegistry: Record<
  string,
  React.FC<QuestionProps>
> = {
  MULTIPLE_CHOICE_SINGLE: (({ question, selected, onSelect }) => {
    const forices = (question.options ?? []).map((opt) => ({
      value: opt.id,
      label: opt.contentMd.replace(/^[A-Z]\.\s+/, ""),
    }));
    return (
      <QuestionCard
        question={{ id: question.id, stem: question.stem ?? question.promptMd ?? "", forices }}
        selected={selected}
        onSelect={onSelect!}
      />
    );
  }) as React.FC<QuestionProps>,

  TRUE_FALSE_NOT_GIVEN: (({ question, selected, onSelect }) => {
    const forices = (question.options ?? []).map((opt) => ({
      value: opt.id,
      label: opt.contentMd.replace(/^[A-Z]\.\s+/, ""),
    }));
    return (
      <QuestionCard
        question={{ id: question.id, stem: question.stem ?? question.promptMd ?? "", forices }}
        selected={selected}
        onSelect={onSelect!}
      />
    );
  }) as React.FC<QuestionProps>,

  YES_NO_NOT_GIVEN: (({ question, selected, onSelect }) => {
    const forices = (question.options ?? []).map((opt) => ({
      value: opt.id,
      label: opt.contentMd.replace(/^[A-Z]\.\s+/, ""),
    }));
    return (
      <QuestionCard
        question={{ id: question.id, stem: question.stem ?? question.promptMd ?? "", forices }}
        selected={selected}
        onSelect={onSelect!}
      />
    );
  }) as React.FC<QuestionProps>,

  CLASSIFICATION: (({ question, selected, onSelect }) => {
    return (
      <ClassificationCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        value={selected ?? ""}
        onChange={(v) => onSelect!(question.id, v)}
      />
    );
  }) as React.FC<QuestionProps>,

  MULTIPLE_CHOICE_SINGLE_IMAGE: (({ question, selected, onSelect }) => {
    const forices = (question.options ?? []).map((opt) => ({
      value: opt.id,
      label: opt.contentMd.replace(/^[A-Z]\.\s+/, ""),
    }));
    return (
      <MultiChoiceImageCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        selected={selected}
        onSelect={onSelect!}
        forices={forices}
      />
    );
  }) as React.FC<QuestionProps>,

  MULTIPLE_CHOICE_MULTIPLE: (({ question, value, onChange }) => {
    const forices = (question.options ?? []).map((opt) => ({
      value: opt.id,
      label: opt.contentMd.replace(/^[A-Z]\.\s+/, ""),
    }));
    return (
      <MultiCheckboxCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        forices={forices}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  FORM_COMPLETION: (({ question, value, onChange, values, onBlankChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  NOTE_COMPLETION: (({ question, value, onChange, values, onBlankChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  SENTENCE_COMPLETION: (({ question, values, onBlankChange, value, onChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  SUMMARY_COMPLETION: (({ question, values, onBlankChange, value, onChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  TABLE_COMPLETION: (({ question, value, onChange, values, onBlankChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  SHORT_ANSWER: (({ question, values, onBlankChange, value, onChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <SummaryCompletionCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  DIAGRAM_LABEL: (({ question, value, onChange, values, onBlankChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <DiagramLabelCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  MAP_LABEL: (({ question, value, onChange, values, onBlankChange }) => {
    const stem = question.stem ?? question.promptMd ?? "";
    if (values !== undefined && onBlankChange) {
      return (
        <MapLabelCard
          id={question.id}
          stem={stem}
          values={values}
          onChange={onBlankChange}
        />
      );
    }
    return (
      <FillInBlankCard
        id={question.id}
        stem={stem}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  MATCHING_HEADING: (({ question, value, onChange }) => {
    const options = (question.options ?? []).map((opt) => ({
      contentMd: opt.contentMd,
    }));
    return (
      <HeadingDropdown
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        options={options}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  MATCHING_INFORMATION: (({ question, values, onBlankChange }) => {
    return (
      <MatchingInformation
        stem={question.stem ?? question.promptMd ?? ""}
        wordList={question.wordList ?? []}
        values={values ?? []}
        onChange={onBlankChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  MATCHING_FEATURES: (({ question, value, onChange }) => {
    return (
      <MatchingLetterCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  MATCHING_ENDINGS: (({ question, value, onChange }) => {
    return (
      <MatchingLetterCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,

  FLOW_CHART: (({ question, value, onChange }) => {
    return (
      <FlowChartCard
        id={question.id}
        stem={question.stem ?? question.promptMd ?? ""}
        nodes={question.flowChartNodes ?? []}
        value={value ?? ""}
        onChange={onChange!}
      />
    );
  }) as React.FC<QuestionProps>,
};