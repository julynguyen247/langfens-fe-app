"use client";

// Filter row at the top of the attempts list. Skill tabs, time range pills,
// exam type pills, sort pills, and a clear-filters button.

export type SkillTabKey = "reading" | "writing" | "speaking";
export type TimeRangeKey = "7d" | "30d" | "90d" | "all";
export type ExamTypeFilter = "all" | "academic" | "general";
export type SortKey = "newest" | "highest" | "lowest";

export interface FilterBarProps {
  activeSkill: SkillTabKey;
  counts: Record<SkillTabKey, number>;
  onSkillChange: (next: SkillTabKey) => void;

  timeRange: TimeRangeKey;
  onTimeRangeChange: (next: TimeRangeKey) => void;

  examType: ExamTypeFilter;
  onExamTypeChange: (next: ExamTypeFilter) => void;

  sort: SortKey;
  onSortChange: (next: SortKey) => void;

  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const SKILL_TABS: Array<{ key: SkillTabKey; label: string }> = [
  { key: "reading", label: "Reading / Listening" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];

const TIME_OPTIONS: Array<{ key: TimeRangeKey; label: string }> = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

const EXAM_OPTIONS: Array<{ key: ExamTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "academic", label: "Academic" },
  { key: "general", label: "General Training" },
];

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Newest first" },
  { key: "highest", label: "Highest band" },
  { key: "lowest", label: "Lowest band" },
];

function PillRow<T extends string>({
  options,
  active,
  onChange,
  size = "md",
}: {
  options: Array<{ key: T; label: string }>;
  active: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={
              size === "sm"
                ? `px-3 py-1.5 rounded-full text-xs font-bold border-b-[3px] transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] hover:-translate-y-0.5"
                      : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                  }`
                : `px-4 py-2 rounded-full text-sm font-bold border-b-[4px] transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] hover:-translate-y-0.5"
                      : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                  }`
            }
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({
  activeSkill,
  counts,
  onSkillChange,
  timeRange,
  onTimeRangeChange,
  examType,
  onExamTypeChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Skill tabs */}
      <div className="flex flex-wrap gap-2">
        {SKILL_TABS.map((tab) => {
          const isActive = activeSkill === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSkillChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold border-b-[4px] transition-all duration-150 ${
                isActive
                  ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] hover:-translate-y-0.5"
                  : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {tab.label}
              <span
                className={`ml-2 inline-flex items-center justify-center min-w-6 px-2 h-5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--background)] text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time range + Exam type + Sort + clear */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
        <div className="flex flex-col gap-1.5">
          <p
            className="text-[11px] font-bold text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Time range
          </p>
          <PillRow options={TIME_OPTIONS} active={timeRange} onChange={onTimeRangeChange} size="sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <p
            className="text-[11px] font-bold text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Exam type
          </p>
          <PillRow options={EXAM_OPTIONS} active={examType} onChange={onExamTypeChange} size="sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <p
            className="text-[11px] font-bold text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sort by
          </p>
          <PillRow options={SORT_OPTIONS} active={sort} onChange={onSortChange} size="sm" />
        </div>

        <div className="lg:ml-auto self-end">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 rounded-full text-xs font-bold border-[2px] border-[var(--border)] text-[var(--text-muted)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
