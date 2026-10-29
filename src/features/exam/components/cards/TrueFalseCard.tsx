"use client";

import type { InternalDeliveryOption, UserAnswerValue } from "../../types";

function normalizeStatement(value: string) {
  const text = value.replace(/^[A-Z]\.\s+/, "").toUpperCase().replace(/[\s_]+/g, "").trim();
  return ({ T: "TRUE", F: "FALSE", Y: "YES", N: "NO", NG: "NOTGIVEN" } as Record<string, string>)[text] ?? text;
}

export function TrueFalseCard({ questionType, options, value, onChange }: {
  questionType: string;
  options: InternalDeliveryOption[];
  value?: UserAnswerValue;
  onChange: (value: UserAnswerValue) => void;
}) {
  const defaults = questionType === "YES_NO_NOT_GIVEN" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];
  const choices = options.length ? options : defaults.map((contentMd, i) => ({ id: "", idx: i + 1, contentMd }));
  const selected = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {choices.map(option => {
      const active = selected.some(id => option.id ? id === option.id || normalizeStatement(id) === normalizeStatement(option.contentMd) : normalizeStatement(id) === normalizeStatement(option.contentMd));
      return <button key={option.id || option.idx} type="button" aria-pressed={active} aria-label={`Select ${option.contentMd}`} onClick={() => onChange(option.id || option.contentMd)} className={`rounded-2xl border-2 px-4 py-4 text-sm font-bold ${active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}>{option.contentMd}</button>;
    })}
  </div>;
}
