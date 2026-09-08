"use client";

import { useState, useMemo } from "react";
import { QuestionSkill, QuestionType } from "@/app/admin/_lib/types";
import {
  QUESTION_TYPE_REGISTRY,
  QuestionTypeMeta,
  QuestionCategory,
  listByCategory,
} from "@/app/admin/_lib/questionTypeRegistry";

interface QuestionTypeCardPickerProps {
  initialType: string;
  initialSkill: string;
  onConfirm: (type: string, skill: string) => void;
  onCancel: () => void;
}

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  mcq: "Multiple Choice",
  completion: "Completion & Blanks",
  matching: "Matching",
  ordering: "Ordering & Flow",
  speaking: "Speaking",
  writing: "Writing",
};

const CATEGORY_ORDER: QuestionCategory[] = [
  "mcq",
  "completion",
  "matching",
  "ordering",
  "speaking",
  "writing",
];

const CATEGORY_ICONS: Record<QuestionCategory, string> = {
  mcq: "📝",
  completion: "✏️",
  matching: "🔗",
  ordering: "🔢",
  speaking: "🎙",
  writing: "📄",
};

function TypeCard({
  meta,
  selected,
  onClick,
}: {
  meta: QuestionTypeMeta;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3.5 rounded-xl border transition relative ${
        selected
          ? "bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-600/10"
          : "bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
      )}
      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-base leading-none mt-0.5">●</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">{meta.label}</div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{meta.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {meta.skillHints.slice(0, 2).map((s) => (
          <span
            key={s}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 font-mono"
          >
            {s}
          </span>
        ))}
      </div>
    </button>
  );
}

export function QuestionTypeCardPicker({
  initialType,
  initialSkill,
  onConfirm,
  onCancel,
}: QuestionTypeCardPickerProps) {
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [skill, setSkill] = useState<string>(initialSkill);
  const [skillFilter, setSkillFilter] = useState<string>("ALL");

  const selectedMeta = QUESTION_TYPE_REGISTRY[selectedType];

  const filteredCategories = useMemo(() => {
    if (skillFilter === "ALL") {
      return CATEGORY_ORDER.map((cat) => ({
        cat,
        items: listByCategory(cat),
      })).filter((g) => g.items.length > 0);
    }
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: listByCategory(cat).filter((m) => m.skillHints.includes(skillFilter)),
    })).filter((g) => g.items.length > 0);
  }, [skillFilter]);

  const handlePick = (meta: QuestionTypeMeta) => {
    setSelectedType(meta.type);
    if (meta.skillHints.length === 1) {
      setSkill(meta.skillHints[0]);
    } else if (!meta.skillHints.includes(skill)) {
      setSkill(meta.skillHints[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Choose Question Type</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick how candidates will answer this question.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
              Skill:
            </span>
            {["ALL", ...Object.values(QuestionSkill)].map((s) => (
              <button
                key={s}
                onClick={() => setSkillFilter(s)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition shrink-0 ${
                  skillFilter === s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No question types match this skill filter.
            </div>
          ) : (
            filteredCategories.map(({ cat, items }) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                  <span className="text-[10px] text-slate-600 font-mono">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {items.map((meta) => (
                    <TypeCard
                      key={meta.type}
                      meta={meta}
                      selected={selectedType === meta.type}
                      onClick={() => handlePick(meta)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400">Selected</div>
              <div className="text-sm font-bold text-indigo-300 truncate">
                {selectedMeta?.label || selectedType}
              </div>
            </div>
            <div className="shrink-0">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Skill
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(QuestionSkill).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedType, skill)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              Create Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { QuestionType as QuestionTypeEnum };
