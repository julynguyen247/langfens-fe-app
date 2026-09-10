"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  InternalDeliveryOption,
  InternalDeliveryQuestion,
  QuestionSkill,
  QuestionType,
} from "@/app/admin/_lib/types";
import { OptionsEditor } from "./editors/OptionsEditor";
import { BlankAcceptsEditor } from "./editors/BlankAcceptsEditor";
import { MatchPairsEditor } from "./editors/MatchPairsEditor";
import { ShortAnswerEditor } from "./editors/ShortAnswerEditor";
import { FlowChartEditor } from "./editors/FlowChartEditor";
import { MatchingHeadingEditor } from "./editors/MatchingHeadingEditor";
import { MatchingInformationEditor } from "./editors/MatchingInformationEditor";
import { MatchingFeaturesEditor } from "./editors/MatchingFeaturesEditor";
import { MatchingEndingsEditor } from "./editors/MatchingEndingsEditor";
import { AdminQuestionPreview } from "@/components/admin/preview/AdminQuestionPreview";
import { QuestionExporter } from "./QuestionExporter";
import { QUESTION_TYPE_REGISTRY, getMeta } from "@/app/admin/_lib/questionTypeRegistry";
import {
  aggregateIssues,
  defaultSkillForType,
  validateBlankKeyFormat,
  validateBlanks,
  validateDifficultyBounds,
  validateFlowChart,
  validateImageUrlRequired,
  validateMatchingHeadingPrompt,
  validateMatchPairs,
  validateMcqIsCorrectCount,
  validateOptionsLength,
  validatePromptBlanksCoverage,
  validateShortAnswer,
  validateShortAnswerSubQuestionCount,
  validateTypeSkill,
  ValidationIssue,
} from "@/app/admin/_lib/validation";

interface QuestionEditorProps {
  question: InternalDeliveryQuestion;
  sectionId: string;
  sectionAudioUrl?: string | null;
  availableSections?: { id: string; title: string }[];
  onSave: (updated: InternalDeliveryQuestion) => Promise<void>;
  onDelete: (questionId?: string, idx?: number) => Promise<void>;
  onDuplicate?: (q: InternalDeliveryQuestion) => Promise<void>;
}

export function QuestionEditor({
  question,
  sectionId,
  sectionAudioUrl,
  availableSections,
  onSave,
  onDelete,
  onDuplicate,
}: QuestionEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [draft, setDraft] = useState<InternalDeliveryQuestion>(question);
  const initialRef = useRef<InternalDeliveryQuestion>(question);

  // S31: ref forwarded to the prompt textarea so BlankAcceptsEditor's
  // "Insert Blank at Cursor" button can read selectionStart/End and restore
  // the cursor after React commits the new promptMd (C5/C7).
  const promptRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setDraft(question);
    initialRef.current = question;
  }, [question.id, question.idx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        if (isDirty && !isSaving) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const meta = useMemo(() => getMeta(draft.type), [draft.type]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(initialRef.current);
  }, [draft]);

  const hasMissingAudio =
    draft.skill?.toUpperCase() === QuestionSkill.Listening.toUpperCase() &&
    (!sectionAudioUrl || !sectionAudioUrl.trim());

  const issues: ValidationIssue[] = useMemo(() => {
    const out: ValidationIssue[] = [];
    out.push(...validateTypeSkill(draft.type, draft.skill));
    out.push(...validateMcqIsCorrectCount(draft.options || [], draft.type));
    out.push(...validateOptionsLength(draft.options || [], draft.type));

    const t = draft.type;
    const ed = QUESTION_TYPE_REGISTRY[t]?.editorKind;

    if (t === QuestionType.MatchingHeading) {
      out.push(...validateMatchingHeadingPrompt(draft.promptMd));
    }
    if (t === QuestionType.ShortAnswer) {
      out.push(
        ...validateShortAnswerSubQuestionCount(draft.promptMd, draft.shortAnswerAcceptTexts || [])
      );
    }
    if (
      t === QuestionType.DiagramLabel ||
      t === QuestionType.MapLabel ||
      t === QuestionType.MultipleChoiceSingleImage
    ) {
      out.push(...validateImageUrlRequired(t, draft.imageUrl));
    }
    out.push(...validateDifficultyBounds(draft.difficulty));
    if (ed === "blanks") {
      out.push(
        ...validateBlankKeyFormat(t, Object.keys(draft.blankAcceptTexts || {}))
      );
      out.push(
        ...validatePromptBlanksCoverage(t, draft.promptMd, Object.keys(draft.blankAcceptTexts || {}))
      );
    }


    if (
      ed === "match-pairs" ||
      ed === "matching-heading" ||
      ed === "matching-information" ||
      ed === "matching-features" ||
      ed === "matching-endings"
    ) {
      out.push(
        ...validateMatchPairs({
          matchPairs: draft.matchPairs,
          options: draft.options || [],
          type: t,
        })
      );
    } else if (ed === "classification") {
      out.push(
        ...validateMatchPairs({
          matchPairs: draft.matchPairs,
          options: draft.options || [],
          type: t,
        })
      );
    } else if (
      ed === "blanks" ||
      ed === "flow-chart"
    ) {
      out.push(
        ...validateBlanks({
          blankAcceptTexts: draft.blankAcceptTexts,
          blankAcceptRegex: draft.blankAcceptRegex,
          type: t,
        })
      );
      if (ed === "flow-chart" && draft.orderCorrects) {
        out.push(...validateFlowChart({ orderCorrects: draft.orderCorrects, type: t }));
      }
    } else if (ed === "short-answer") {
      out.push(
        ...validateShortAnswer({
          shortAnswerAcceptTexts: draft.shortAnswerAcceptTexts,
          shortAnswerAcceptRegex: draft.shortAnswerAcceptRegex,
          type: t,
        })
      );
    }
    return out;
  }, [draft]);

  const hasErrors = issues.some((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      if (hasMissingAudio) {
        setSaveMessage({
          text: "Listening questions require an Audio URL on the parent section before saving.",
          isError: true,
        });
        setIsSaving(false);
        return;
      }

      if (hasErrors) {
        setSaveMessage({
          text: `Cannot save — ${issues.filter((i) => i.level === "error").length} validation error(s)`,
          isError: true,
        });
        setIsSaving(false);
        return;
      }

      await onSave(draft);
      initialRef.current = draft;
      setSaveMessage({ text: "Saved successfully", isError: false });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: unknown) {
      let msg = "Failed to save question";
      if (err && typeof err === "object") {
        if ("response" in err && err.response && typeof err.response === "object") {
          const resp = err.response;
          if ("data" in resp && resp.data && typeof resp.data === "object") {
            const data = resp.data;
            if ("message" in data && typeof data.message === "string") {
              msg = data.message;
            }
          }
        } else if ("message" in err && typeof err.message === "string") {
          msg = err.message;
        }
      }
      setSaveMessage({ text: msg, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    const newMeta = getMeta(newType);
    const newSkill = newMeta.skillHints.length === 1 ? newMeta.skillHints[0] : draft.skill;
    setDraft((prev) => ({
      ...prev,
      type: newType,
      skill: newSkill,
      difficulty: prev.difficulty || newMeta.defaultDifficulty,
    }));
  };

  const handleOptionsChange = (options: InternalDeliveryOption[]) => {
    setDraft((prev) => ({ ...prev, options }));
  };

  const handleBlanksChange = (
    blankAcceptTexts: Record<string, string[] | null>,
    blankAcceptRegex: Record<string, string[] | null>
  ) => {
    setDraft((prev) => ({
      ...prev,
      blankAcceptTexts,
      blankAcceptRegex,
    }));
  };

  const handlePairsChange = (
    matchPairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => {
    setDraft((prev) => ({
      ...prev,
      matchPairs,
      options,
    }));
  };

  const handleShortAnswerChange = (
    shortAnswerAcceptTexts: string[],
    shortAnswerAcceptRegex: string[]
  ) => {
    setDraft((prev) => ({
      ...prev,
      shortAnswerAcceptTexts,
      shortAnswerAcceptRegex,
    }));
  };

  const handleFlowChartChange = (orderCorrects: string[]) => {
    setDraft((prev) => ({
      ...prev,
      orderCorrects,
    }));
  };

  const handleImageUrlChange = (imageUrl: string) => {
    setDraft((prev) => ({ ...prev, imageUrl: imageUrl || null }));
  };

  const handlePromptChange = (newPrompt: string) => {
    setDraft((prev) => ({ ...prev, promptMd: newPrompt }));
  };

  const renderTypeEditor = () => {
    const t = draft.type;
    const ed = QUESTION_TYPE_REGISTRY[t]?.editorKind;

    if (t === "MULTIPLE_CHOICE_SINGLE") {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={false}
          questionType={t}
          onChange={handleOptionsChange}
        />
      );
    }
    if (t === "MULTIPLE_CHOICE_SINGLE_IMAGE") {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={false}
          questionType={t}
          onChange={handleOptionsChange}
          enableImage
        />
      );
    }
    if (t === "TRUE_FALSE_NOT_GIVEN" || t === "YES_NO_NOT_GIVEN") {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={false}
          questionType={t}
          onChange={handleOptionsChange}
        />
      );
    }
    if (t === "MULTIPLE_CHOICE_MULTIPLE") {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={true}
          questionType={t}
          onChange={handleOptionsChange}
        />
      );
    }
    if (t === "CLASSIFICATION") {
      return (
        <MatchPairsEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          questionType={t}
          promptMd={draft.promptMd}
          onChange={handlePairsChange}
        />
      );
    }
    if (t === "MATCHING_HEADING") {
      return (
        <MatchingHeadingEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          promptMd={draft.promptMd}
          onChange={handlePairsChange}
        />
      );
    }
    if (t === "MATCHING_INFORMATION") {
      return (
        <MatchingInformationEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          promptMd={draft.promptMd}
          onChange={handlePairsChange}
        />
      );
    }
    if (t === "MATCHING_FEATURES") {
      return (
        <MatchingFeaturesEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          promptMd={draft.promptMd}
          onChange={handlePairsChange}
        />
      );
    }
    if (t === "MATCHING_ENDINGS") {
      return (
        <MatchingEndingsEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          promptMd={draft.promptMd}
          onChange={handlePairsChange}
        />
      );
    }
    if (
      t === "SUMMARY_COMPLETION" ||
      t === "TABLE_COMPLETION" ||
      t === "NOTE_COMPLETION" ||
      t === "FORM_COMPLETION" ||
      t === "SENTENCE_COMPLETION"
    ) {
      return (
        <BlankAcceptsEditor
          blankAcceptTexts={draft.blankAcceptTexts}
          blankAcceptRegex={draft.blankAcceptRegex}
          onChange={handleBlanksChange}
          promptMd={draft.promptMd}
          onPromptChange={handlePromptChange}
          promptTextareaRef={promptRef}
        />
      );
    }
    if (t === "DIAGRAM_LABEL") {
      return (
        <BlankAcceptsEditor
          blankAcceptTexts={draft.blankAcceptTexts}
          blankAcceptRegex={draft.blankAcceptRegex}
          onChange={handleBlanksChange}
          variant="diagram"
          imageUrl={draft.imageUrl}
          onImageUrlChange={handleImageUrlChange}
          promptMd={draft.promptMd}
          onPromptChange={handlePromptChange}
          promptTextareaRef={promptRef}
        />
      );
    }
    if (t === "MAP_LABEL") {
      return (
        <BlankAcceptsEditor
          blankAcceptTexts={draft.blankAcceptTexts}
          blankAcceptRegex={draft.blankAcceptRegex}
          onChange={handleBlanksChange}
          variant="map"
          imageUrl={draft.imageUrl}
          onImageUrlChange={handleImageUrlChange}
          promptMd={draft.promptMd}
          onPromptChange={handlePromptChange}
          promptTextareaRef={promptRef}
        />
      );
    }
    if (t === "SHORT_ANSWER") {
      return (
        <ShortAnswerEditor
          shortAnswerAcceptTexts={draft.shortAnswerAcceptTexts}
          shortAnswerAcceptRegex={draft.shortAnswerAcceptRegex}
          onChange={handleShortAnswerChange}
        />
      );
    }
    if (t === "FLOW_CHART") {
      return (
        <FlowChartEditor
          orderCorrects={draft.orderCorrects}
          onChange={handleFlowChartChange}
        />
      );
    }

    if (ed === "match-pairs") {
      return (
        <MatchPairsEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          questionType={t}
          onChange={handlePairsChange}
        />
      );
    }

    return (
      <div className="p-3 text-xs text-amber-400 bg-amber-950/20 border border-amber-900 rounded-lg">
        Custom type: {t}. Configure options and markdown prompts above.
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm overflow-hidden transition">
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 transition shrink-0"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="font-mono text-sm font-bold text-indigo-400 shrink-0">
            Q{draft.idx}
          </span>

          <span
            className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700/50 truncate"
            title={meta.label}
          >
            {meta.label}
          </span>

          <span className="text-xs text-slate-400 shrink-0">
            Skill: <strong className="text-slate-200">{draft.skill}</strong>
          </span>

          <span className="text-xs text-slate-500 shrink-0">Diff: {draft.difficulty}/5</span>

          {isDirty && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
              title="Unsaved changes"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved
            </span>
          )}

          {hasErrors && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {issues.filter((i) => i.level === "error").length} issue(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveMessage && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                saveMessage.isError
                  ? "bg-rose-950/60 text-rose-300 border border-rose-800"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
              }`}
            >
              {saveMessage.text}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowPreview((s) => !s)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              showPreview
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700"
            }`}
            title="Toggle preview"
          >
            <svg className="w-3.5 h-3.5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {showPreview ? "Hide" : "Preview"}
          </button>

          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(draft)}
              className="p-1.5 text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
              title="Duplicate question"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
          )}

          <QuestionExporter question={draft} />

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Question"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(draft.id, draft.idx)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            title="Delete question"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5">
          {hasMissingAudio && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-300 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <strong>Listening Audio Missing:</strong> The parent section has no Audio URL. Listening questions cannot be saved without an audio recording attached to the section.
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200 space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span>⚠</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Question Type
                  </label>
                  <select
                    value={draft.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(QUESTION_TYPE_REGISTRY).map((m) => (
                      <option key={m.type} value={m.type}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Skill
                  </label>
                  <select
                    value={draft.skill}
                    onChange={(e) => setDraft({ ...draft, skill: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(QuestionSkill).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Difficulty (1 - 5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draft.difficulty}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const clamped = isNaN(raw) ? 1 : Math.max(1, Math.min(5, Math.floor(raw)));
                      setDraft({ ...draft, difficulty: clamped });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Order (Idx)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={draft.idx}
                    onChange={(e) => setDraft({ ...draft, idx: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {draft.type !== "CLASSIFICATION" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Prompt & Question Stem (Markdown) *
                  </label>
                  <textarea
                    ref={promptRef}
                    rows={3}
                    placeholder="Question prompt, text with blanks [1], or instructions..."
                    value={draft.promptMd || ""}
                    onChange={(e) => setDraft({ ...draft, promptMd: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Explanation & Review Rationale (Markdown)
                </label>
                <textarea
                  rows={2}
                  placeholder="Why this answer is correct, citing the passage..."
                  value={draft.explanationMd || ""}
                  onChange={(e) => setDraft({ ...draft, explanationMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                {renderTypeEditor()}
              </div>
            </div>

            {showPreview && (
              <div className="lg:sticky lg:top-4 lg:self-start">
                <AdminQuestionPreview question={draft} displayIdx={draft.idx} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
