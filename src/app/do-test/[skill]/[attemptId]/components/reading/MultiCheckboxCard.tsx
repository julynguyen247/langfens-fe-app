"use client";

import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Choice = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  stem: string; // e.g., "Choose THREE letters A-F"
  choices: Choice[];
  value: string; // JSON array of selected option IDs
  onChange: (value: string) => void;
};

// Memoized markdown components
const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

/**
 * Checkbox component for MULTIPLE_CHOICE_MULTIPLE questions.
 * User can select multiple options, order doesn't matter.
 */
const MultiCheckboxCard = memo(function MultiCheckboxCard({
  stem,
  choices,
  value,
  onChange,
}: Props) {
  const text = useMemo(() => stem.replace(/\\n/g, "\n"), [stem]);
  
  // Parse current selections from JSON array or empty array
  const parseValue = useCallback((v: string): string[] => {
    try {
      const parsed = JSON.parse(v || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  
  const [selected, setSelected] = useState<string[]>(() => parseValue(value));
  const isInitialMount = useRef(true);
  
  // Sync with parent when value changes externally (from saved answers)
  useEffect(() => {
    const parsed = parseValue(value);
    if (JSON.stringify(parsed) !== JSON.stringify(selected)) {
      setSelected(parsed);
    }
  }, [value, parseValue]);
  
  // Notify parent when selection changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const jsonValue = JSON.stringify(selected);
    if (jsonValue !== value) {
      onChange(jsonValue);
    }
  }, [selected, value, onChange]);
  
  const handleToggle = useCallback((choiceValue: string) => {
    setSelected(prev =>
      prev.includes(choiceValue)
        ? prev.filter(v => v !== choiceValue)
        : [...prev, choiceValue]
    );
  }, []);

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="text-slate-900 leading-relaxed font-bold">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <div className="space-y-2">
        {choices.map((choice) => {
          const isChecked = selected.includes(choice.value);
          return (
            <label
              key={choice.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                ${isChecked 
                  ? "bg-blue-50 border-blue-300" 
                  : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(choice.value)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 
                          focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-slate-700">{choice.label}</span>
            </label>
          );
        })}
      </div>
      
      <span className="text-xs text-slate-500">
        {selected.length > 0 
          ? `Selected: ${selected.length}` 
          : "Select the correct options. Order doesn't matter."}
      </span>
    </div>
  );
});

export default MultiCheckboxCard;
