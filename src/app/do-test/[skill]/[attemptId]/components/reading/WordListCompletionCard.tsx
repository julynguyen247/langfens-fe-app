"use client";

import React, { memo, useMemo, useCallback, useState } from "react";

type Choice = { value: string; label: string };

const RE_BLANK = /___(?:\[\d+\])?/g;

function extractBodyAfterColon(stem: string) {
  const m = stem.match(/Fill in blank[\s\S]*?:\s*\n+([\s\S]*)/i);
  return (m?.[1] ?? stem).trim();
}

function splitBodyByBlanks(body: string) {
  const regex = /___(?:\[\d+\])?/g;
  regex.lastIndex = 0;
  const parts: Array<{ kind: string; text: string; blankIndex?: number }> = [];
  let last = 0;
  let blankIndex = 0;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last) {
      parts.push({ kind: "text", text: body.slice(last, start) });
    }
    parts.push({ kind: "blank", text: body.slice(start, end), blankIndex });
    blankIndex++;
    last = end;
  }
  if (last < body.length) {
    parts.push({ kind: "text", text: body.slice(last) });
  }
  return { parts, blankCount: blankIndex };
}

const MatchingInformation = memo(function MatchingInformation({
  stem,
  wordList,
  values,
  onChange,
}: {
  stem: string;
  wordList: string[];
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
}) {
  const [activeBlank, setActiveBlank] = useState<number | null>(null);

  const body = useMemo(() => extractBodyAfterColon(stem), [stem]);
  const split = useMemo(() => splitBodyByBlanks(body), [body]);

  const forices: Choice[] = useMemo(() => {
    return (wordList ?? []).map((item) => {
      const m = item.match(/^([A-Z])\s*(?:[.)\-:])\s*(.+)$/);
      return m
        ? { value: m[1], label: m[2].trim() }
        : { value: item, label: item };
    }).sort((a, b) => a.value.localeCompare(b.value));
  }, [wordList]);

  const usedValues = useMemo(() => new Set(values.filter(Boolean)), [values]);

  const handleBlankClick = useCallback((blankIndex: number) => {
    setActiveBlank(activeBlank === blankIndex ? null : blankIndex);
  }, [activeBlank]);

  const handleWordClick = useCallback(
    (wordValue: string) => {
      if (activeBlank === null) return;

      const isAlreadySelected = values[activeBlank] === wordValue;
      onChange(activeBlank, isAlreadySelected ? "" : wordValue);
      setActiveBlank(null);
    },
    [activeBlank, onChange, values]
  );

  const handleClearBlank = useCallback(
    (blankIndex: number) => {
      onChange(blankIndex, "");
      setActiveBlank(null);
    },
    [onChange]
  );

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-sm leading-relaxed text-[var(--foreground)]">
        {split?.parts.map((p, i) => {
          if (p.kind === "text") {
            return (
              <span key={`t-${i}`} className="whitespace-pre-wrap">
                {p.text}
              </span>
            );
          }

          const blankIdx = p.blankIndex!;
          const selectedValue = values[blankIdx] ?? "";
          const selectedChoice = forices.find((c) => c.value === selectedValue);
          const isActive = activeBlank === blankIdx;

          return (
            <span key={`b-${i}`} className="inline-flex items-center mx-1">
              <button
                type="button"
                onClick={() => handleBlankClick(blankIdx)}
                className={`
                  inline-flex items-center justify-center min-w-[4rem] h-9 px-3
                  rounded-full border-[2px] border-b-[3px]
                  transition-all duration-150 text-sm font-bold
                  ${
                    selectedValue
                      ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)]"
                      : isActive
                      ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-[0_2px_0_var(--primary)] animate-pulse"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] shadow-[0_2px_0_rgba(0,0,0,0.06)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }
                `}
              >
                {selectedChoice ? (
                  <span className="flex items-center gap-1">
                    <span>{selectedChoice.value}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearBlank(blankIdx);
                      }}
                      className="ml-1 text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </span>
                  </span>
                ) : (
                  <span>?</span>
                )}
              </button>
            </span>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t-[2px] border-[var(--border-light)]">
        <div className="text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wide">
          Word Bank
        </div>
        <div className="flex flex-wrap gap-2">
          {forices.map((c) => {
            const isUsed = usedValues.has(c.value);
            const isSelectedForActive =
              activeBlank !== null && values[activeBlank] === c.value;

            return (
              <button
                key={`wl-${c.value}`}
                type="button"
                onClick={() => handleWordClick(c.value)}
                disabled={activeBlank === null}
                className={`
                  flex items-center gap-2 rounded-[1rem] border-[2px] border-b-[3px]
                  px-3 py-2 text-sm transition-all duration-150
                  ${
                    isSelectedForActive
                      ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)]"
                      : isUsed
                      ? "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] opacity-50 shadow-[0_2px_0_rgba(0,0,0,0.04)]"
                      : activeBlank !== null
                      ? "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.06)] cursor-pointer"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[0_2px_0_rgba(0,0,0,0.06)] cursor-not-allowed opacity-60"
                  }
                `}
              >
                <span className="w-6 h-6 rounded-full bg-[var(--border-light)] flex items-center justify-center font-bold text-xs">
                  {c.value}
                </span>
                <span className="font-medium">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeBlank !== null && (
        <div className="mt-3 text-xs text-[var(--primary)] font-semibold text-center">
          Tap a word to fill blank {activeBlank + 1}
        </div>
      )}
    </div>
  );
});

export default MatchingInformation;
