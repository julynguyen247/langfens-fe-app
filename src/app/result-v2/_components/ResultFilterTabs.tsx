"use client";

export type ResultFilterType = "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED";

interface ResultFilterTabsProps {
  activeFilter: ResultFilterType;
  totalCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  onChange: (filter: ResultFilterType) => void;
}

export function ResultFilterTabs({
  activeFilter,
  totalCount,
  correctCount,
  incorrectCount,
  unansweredCount,
  onChange,
}: ResultFilterTabsProps) {
  const tabs: { type: ResultFilterType; label: string; count: number; color: string }[] = [
    { type: "ALL", label: "All Questions", count: totalCount, color: "text-slate-700" },
    { type: "CORRECT", label: "Correct", count: correctCount, color: "text-emerald-700" },
    { type: "INCORRECT", label: "Incorrect", count: incorrectCount, color: "text-rose-700" },
    { type: "UNANSWERED", label: "Unanswered", count: unansweredCount, color: "text-slate-500" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.type;
        return (
          <button
            key={tab.type}
            type="button"
            onClick={() => onChange(tab.type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-2 cursor-pointer shrink-0 ${
              isActive
                ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive
                  ? "bg-blue-800 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
