"use client";

import { useState } from "react";
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
import { AudioResponseEditor } from "./editors/AudioResponseEditor";

interface QuestionEditorProps {
  question: InternalDeliveryQuestion;
  sectionId: string;
  sectionAudioUrl?: string | null;
  onSave: (updated: InternalDeliveryQuestion) => Promise<void>;
  onDelete: (questionId?: string, idx?: number) => Promise<void>;
}

export function QuestionEditor({
  question,
  sectionId,
  sectionAudioUrl,
  onSave,
  onDelete,
}: QuestionEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Local draft state
  const [draft, setDraft] = useState<InternalDeliveryQuestion>(question);

  const hasMissingAudio =
    draft.skill?.toUpperCase() === QuestionSkill.Listening.toUpperCase() &&
    (!sectionAudioUrl || !sectionAudioUrl.trim());

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

      await onSave(draft);
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
    setDraft((prev) => ({
      ...prev,
      type: newType,
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

  const renderTypeEditor = () => {
    const t = draft.type;

    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage ||
      t === QuestionType.TrueFalseNotGiven ||
      t === QuestionType.YesNoNotGiven
    ) {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={false}
          questionType={t}
          onChange={handleOptionsChange}
        />
      );
    }

    if (t === QuestionType.MultipleChoiceMultiple) {
      return (
        <OptionsEditor
          options={draft.options || []}
          isMultiple={true}
          questionType={t}
          onChange={handleOptionsChange}
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
        <BlankAcceptsEditor
          blankAcceptTexts={draft.blankAcceptTexts}
          blankAcceptRegex={draft.blankAcceptRegex}
          onChange={handleBlanksChange}
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
        <MatchPairsEditor
          matchPairs={draft.matchPairs}
          options={draft.options || []}
          questionType={t}
          onChange={handlePairsChange}
        />
      );
    }

    if (t === QuestionType.ShortAnswer) {
      return (
        <ShortAnswerEditor
          shortAnswerAcceptTexts={draft.shortAnswerAcceptTexts}
          shortAnswerAcceptRegex={draft.shortAnswerAcceptRegex}
          onChange={handleShortAnswerChange}
        />
      );
    }

    if (t === QuestionType.FlowChart || t === QuestionType.FlowChartCompletion) {
      return (
        <FlowChartEditor
          orderCorrects={draft.orderCorrects}
          onChange={handleFlowChartChange}
        />
      );
    }

    if (t === QuestionType.AudioResponse) {
      return (
        <AudioResponseEditor
          promptMd={draft.promptMd}
          explanationMd={draft.explanationMd}
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
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="font-mono text-sm font-bold text-indigo-400">
            Q{draft.idx}
          </span>

          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700/50">
            {draft.type}
          </span>

          <span className="text-xs text-slate-400">
            Skill: <strong className="text-slate-200">{draft.skill}</strong>
          </span>

          <span className="text-xs text-slate-500">
            Diff: {draft.difficulty}/5
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition disabled:opacity-50"
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

      {/* Collapsible body */}
      {isOpen && (
        <div className="p-5 space-y-5">
          {/* Missing audio error warning */}
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

          {/* Question Metadata grid */}
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
                {Object.values(QuestionType).map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Order Index (Idx)
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

          {/* Prompt Markdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Prompt & Question Stem (Markdown) *
            </label>
            <textarea
              rows={3}
              placeholder="Question prompt, text with blanks [1], or instructions..."
              value={draft.promptMd || ""}
              onChange={(e) => setDraft({ ...draft, promptMd: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Explanation Markdown */}
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

          {/* Per-type conditional editor */}
          <div className="pt-4 border-t border-slate-800/80">
            {renderTypeEditor()}
          </div>
        </div>
      )}
    </div>
  );
}
