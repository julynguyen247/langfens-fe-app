"use client";

// Strengths + Focus-areas pill list. Each pill carries a hover tooltip
// showing accuracy and correct/total counts. Up to 5 rows per section.

import { useState } from "react";
import {
  formatQuestionType,
  type QuestionTypeAccuracy,
} from "../_lib/utils";

export interface StrengthsFocusProps {
  strengths: QuestionTypeAccuracy[];
  weaknesses: QuestionTypeAccuracy[];
}

const STRENGTH_PILL =
  "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)] hover:bg-[var(--skill-speaking-light)]";
const WEAKNESS_PILL =
  "bg-red-50 text-[var(--destructive)] border-red-200 hover:bg-red-100";

export function StrengthsFocus({
  strengths,
  weaknesses,
}: StrengthsFocusProps) {
  const topStrengths = strengths.slice(0, 5);
  const topWeaknesses = weaknesses.slice(0, 5);
  const hasAny = topStrengths.length > 0 || topWeaknesses.length > 0;

  return (
    <div>
      <p
        className="text-lg font-bold text-[var(--foreground)] mb-4"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Strengths & focus areas
      </p>

      {!hasAny ? (
        <p
          className="text-sm text-[var(--text-muted)] py-6 text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Complete more tests to see your strengths and focus areas.
        </p>
      ) : (
        <div className="space-y-5">
          {topStrengths.length > 0 && (
            <div>
              <p
                className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Strengths
              </p>
              <div className="flex flex-wrap gap-2">
                {topStrengths.map((item) => (
                  <Pill
                    key={item.type}
                    item={item}
                    variant="strength"
                    label={formatQuestionType(item.type)}
                  />
                ))}
              </div>
            </div>
          )}

          {topWeaknesses.length > 0 && (
            <div>
              <p
                className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Focus areas
              </p>
              <div className="flex flex-wrap gap-2">
                {topWeaknesses.map((item) => (
                  <Pill
                    key={item.type}
                    item={item}
                    variant="weakness"
                    label={formatQuestionType(item.type)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PillProps {
  item: QuestionTypeAccuracy;
  variant: "strength" | "weakness";
  label: string;
}

function Pill({ item, variant, label }: PillProps) {
  const [show, setShow] = useState(false);
  const style = variant === "strength" ? STRENGTH_PILL : WEAKNESS_PILL;
  const accuracy = Math.round(item.accuracy);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-[2px] cursor-default transition-colors ${style}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--foreground)] text-white text-xs rounded-xl shadow-lg whitespace-nowrap z-10 pointer-events-none">
          <div
            className="font-bold"
            style={{ fontFamily: "var(--font-code)" }}
          >
            {accuracy}% accuracy
          </div>
          <div
            className="text-[var(--border)]"
            style={{ fontFamily: "var(--font-code)" }}
          >
            {item.correctAnswers}/{item.totalQuestions} correct
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[var(--foreground)]" />
        </div>
      )}
    </div>
  );
}

export default StrengthsFocus;
