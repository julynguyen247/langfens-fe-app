"use client";

import React, { memo, useMemo, useCallback } from "react";

type Category = { value: string; label: string };
type Statement = { index: number; text: string };

type Props = {
  id: string;
  stem: string;
  value: string;
  onChange: (value: string) => void;
};

function parsePromptMd(stem: string): { intro: string; categories: Category[]; statements: Statement[] } {
  const text = stem.replace(/\\n/g, "\n").trim();
  
  const categoryRegex = /^([A-Z])\.\s+(.+)$/gm;
  const categories: Category[] = [];
  let match;
  
  while ((match = categoryRegex.exec(text)) !== null) {
    categories.push({ value: match[1], label: match[2].trim() });
  }
  
  const statementRegex = /^(\d+)\.\s+(.+)$/gm;
  const statements: Statement[] = [];
  
  while ((match = statementRegex.exec(text)) !== null) {
    statements.push({ index: parseInt(match[1]) - 1, text: match[2].trim() });
  }
  
  let intro = "";
  if (categories.length > 0) {
    const firstCategoryMatch = text.match(/^[A-Z]\.\s+/m);
    if (firstCategoryMatch && firstCategoryMatch.index !== undefined) {
      intro = text.slice(0, firstCategoryMatch.index).trim();
    }
  }
  
  return { intro, categories, statements };
}

const ClassificationCard = memo(function ClassificationCard({ stem, value, onChange }: Props) {
  const { intro, categories, statements } = useMemo(() => parsePromptMd(stem), [stem]);
  
  const answers = useMemo(() => {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  }, [value]);
  
  const handleSelect = useCallback(
    (statementIndex: number, categoryValue: string) => {
      const current = answers[statementIndex];
      const next = { ...answers };
      next[statementIndex] = current === categoryValue ? "" : categoryValue;
      onChange(JSON.stringify(next));
    },
    [answers, onChange]
  );
  
  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      {intro && (
        <div className="font-bold text-[var(--foreground)] mb-4 leading-relaxed">
          {intro}
        </div>
      )}
      
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.value}
            className="rounded-full border-[2px] border-b-[3px] border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_2px_0_rgba(0,0,0,0.06)]"
          >
            <span className="font-bold mr-2">{cat.value}.</span>
            {cat.label}
          </div>
        ))}
      </div>
      
      <div className="space-y-3">
        {statements.map((stmt) => {
          const selectedCategory = answers[stmt.index];
          
          return (
            <div
              key={stmt.index}
              className="rounded-[1rem] border-[2px] border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_2px_0_rgba(0,0,0,0.04)]"
            >
              <div className="text-sm text-[var(--foreground)] mb-3 leading-relaxed">
                <span className="font-bold mr-2">{stmt.index + 1}.</span>
                {stmt.text}
              </div>
              
              <div className="flex gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleSelect(stmt.index, cat.value)}
                      className={`
                        w-10 h-10 rounded-full font-bold text-sm
                        border-b-[4px] transition-all duration-150
                        ${
                          isSelected
                            ? "border-[var(--primary-dark)] bg-[var(--primary)] text-white shadow-[0_4px_0_var(--primary-dark)] scale-[0.97]"
                            : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_3px_0_rgba(0,0,0,0.08)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.08)]"
                        }
                      `}
                    >
                      {cat.value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ClassificationCard;
