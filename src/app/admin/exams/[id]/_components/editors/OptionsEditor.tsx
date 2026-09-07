"use client";

import { useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface OptionsEditorProps {
  options: InternalDeliveryOption[];
  isMultiple: boolean;
  questionType: string;
  onChange: (options: InternalDeliveryOption[]) => void;
}

export function OptionsEditor({
  options,
  isMultiple,
  questionType,
  onChange,
}: OptionsEditorProps) {
  const [editingText, setEditingText] = useState<Record<number, string>>({});

  const handleToggleCorrect = (idx: number) => {
    const updated = options.map((opt) => {
      if (opt.idx === idx) {
        return { ...opt, isCorrect: !opt.isCorrect };
      }
      // If single choice, unselect others when selecting this one
      if (!isMultiple) {
        return { ...opt, isCorrect: false };
      }
      return opt;
    });
    onChange(updated);
  };

  const handleContentChange = (idx: number, content: string) => {
    const updated = options.map((opt) =>
      opt.idx === idx ? { ...opt, contentMd: content } : opt
    );
    onChange(updated);
  };

  const handleAddOption = () => {
    const maxIdx = options.reduce((m, o) => Math.max(m, o.idx), 0);
    const nextIdx = maxIdx + 1;
    const defaultLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const defaultLabel = defaultLabels[options.length]
      ? `${defaultLabels[options.length]}. `
      : `Option ${nextIdx}`;

    const newOption: InternalDeliveryOption = {
      id: `temp-${Date.now()}-${nextIdx}`,
      idx: nextIdx,
      contentMd: defaultLabel,
      isCorrect: false,
    };
    onChange([...options, newOption]);
  };

  const handleRemoveOption = (idx: number) => {
    const remaining = options.filter((opt) => opt.idx !== idx);
    // Renumber remaining sequentially
    const renumbered = remaining.map((opt, i) => ({
      ...opt,
      idx: i + 1,
    }));
    onChange(renumbered);
  };

  const handleApplyPreset = (presetType: "TFNG" | "YNNG" | "ABCD") => {
    if (presetType === "TFNG") {
      const presets: InternalDeliveryOption[] = [
        { id: `preset-tf-1`, idx: 1, contentMd: "True", isCorrect: true },
        { id: `preset-tf-2`, idx: 2, contentMd: "False", isCorrect: false },
        { id: `preset-tf-3`, idx: 3, contentMd: "Not Given", isCorrect: false },
      ];
      onChange(presets);
    } else if (presetType === "YNNG") {
      const presets: InternalDeliveryOption[] = [
        { id: `preset-yn-1`, idx: 1, contentMd: "Yes", isCorrect: true },
        { id: `preset-yn-2`, idx: 2, contentMd: "No", isCorrect: false },
        { id: `preset-yn-3`, idx: 3, contentMd: "Not Given", isCorrect: false },
      ];
      onChange(presets);
    } else if (presetType === "ABCD") {
      const presets: InternalDeliveryOption[] = [
        { id: `preset-abcd-1`, idx: 1, contentMd: "A. ", isCorrect: true },
        { id: `preset-abcd-2`, idx: 2, contentMd: "B. ", isCorrect: false },
        { id: `preset-abcd-3`, idx: 3, contentMd: "C. ", isCorrect: false },
        { id: `preset-abcd-4`, idx: 4, contentMd: "D. ", isCorrect: false },
      ];
      onChange(presets);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header and Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Options & Answer Key
          </span>
          <span className="text-[11px] text-slate-500">
            ({isMultiple ? "Multiple correct answers allowed" : "Exactly one correct answer"})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {questionType === "TRUE_FALSE_NOT_GIVEN" && (
            <button
              type="button"
              onClick={() => handleApplyPreset("TFNG")}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/20 transition"
            >
              Reset T/F/NG
            </button>
          )}
          {questionType === "YES_NO_NOT_GIVEN" && (
            <button
              type="button"
              onClick={() => handleApplyPreset("YNNG")}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/20 transition"
            >
              Reset Yes/No/NG
            </button>
          )}
          {options.length === 0 && (
            <button
              type="button"
              onClick={() => handleApplyPreset("ABCD")}
              className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/20 transition"
            >
              Add A/B/C/D
            </button>
          )}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {options.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No options defined yet. Click &ldquo;Add Option&rdquo; or use a preset.
          </div>
        ) : (
          options.map((opt) => (
            <div
              key={opt.idx}
              className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                opt.isCorrect
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              {/* Correct toggle (Radio or Checkbox style) */}
              <button
                type="button"
                onClick={() => handleToggleCorrect(opt.idx)}
                className={`mt-1 shrink-0 flex items-center justify-center w-5 h-5 rounded transition ${
                  isMultiple ? "rounded-md" : "rounded-full"
                } ${
                  opt.isCorrect
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
                    : "border-2 border-slate-600 hover:border-slate-400 bg-slate-950"
                }`}
                title={opt.isCorrect ? "Marked as correct answer" : "Click to mark as correct"}
              >
                {opt.isCorrect && (
                  <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>

              {/* Option Index badge */}
              <span className="mt-1 font-mono text-xs font-bold text-slate-400 shrink-0 w-6">
                #{opt.idx}
              </span>

              {/* Content Markdown input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Option text (Markdown supported)..."
                  value={opt.contentMd}
                  onChange={(e) => handleContentChange(opt.idx, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(opt.idx)}
                className="mt-1 p-1 text-slate-500 hover:text-rose-400 transition"
                title="Remove option"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add option button */}
      <button
        type="button"
        onClick={handleAddOption}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Option
      </button>
    </div>
  );
}
