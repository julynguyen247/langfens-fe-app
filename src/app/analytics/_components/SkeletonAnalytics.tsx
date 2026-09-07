"use client";

// Loading skeleton for the analytics page. Rendered for at least 50ms while
// the parallel data fetches resolve (see `loadData` min-delay in page.tsx).

export function SkeletonAnalytics() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header band */}
      <div
        className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] p-5 sm:p-6"
        style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.08)" }}
      >
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="lg:flex-1 space-y-3">
            <div className="h-7 w-64 bg-[var(--border)] rounded-full" />
            <div className="h-4 w-80 bg-[var(--border)] rounded-full" />
          </div>
          <div className="lg:w-[460px] space-y-2">
            <div className="h-3 w-40 bg-[var(--border)] rounded-full" />
            <div className="h-10 w-full bg-[var(--border)] rounded-full" />
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`kpi-${i}`}
            className="h-28 bg-white rounded-[2rem] border-[3px] border-[var(--border)]"
          />
        ))}
      </div>

      {/* Trend chart */}
      <div className="h-64 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />

      {/* Skill cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`skill-${i}`}
            className="h-40 bg-white rounded-[2rem] border-[3px] border-[var(--border)]"
          />
        ))}
      </div>

      {/* Two-col row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />
        <div className="h-64 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />
      </div>

      {/* AI band */}
      <div className="h-36 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />

      {/* Bottom two-col row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />
        <div className="h-64 bg-white rounded-[2rem] border-[3px] border-[var(--border)]" />
      </div>
    </div>
  );
}

export default SkeletonAnalytics;
