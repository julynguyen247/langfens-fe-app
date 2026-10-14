"use client";

import { UserAnswerValue } from "../../_lib/types";

interface ShortAnswerCardProps {
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function ShortAnswerCard({
  value,
  onChange,
}: ShortAnswerCardProps) {
  const userVal = typeof value === "string" ? value : "";

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={userVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your short answer here..."
          className="w-full rounded-2xl border-2 px-4 py-3 text-xs sm:text-sm border-slate-300 bg-white text-slate-900 focus:border-[#2563EB] focus:outline-none transition-all shadow-2xs"
        />
      </div>
    </div>
  );
}
