// Skeleton mirror of PracticeCard. Pulses on the same anatomy so the
// grid stays calm while exams load.
export function SkeletonPracticeCard() {
  return (
    <div className="animate-pulse rounded-[2rem] bg-white border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
      {/* Hero */}
      <div className="relative aspect-[16/10] bg-[var(--border)]/40" />

      {/* Meta strip */}
      <div className="px-4 pt-3 pb-2 border-b-[2px] border-[var(--border-light)] flex gap-2">
        <div className="h-6 w-16 rounded-full bg-[var(--border)]/60" />
        <div className="h-6 w-20 rounded-full bg-[var(--border)]/60" />
        <div className="h-6 w-12 rounded-full bg-[var(--border)]/60" />
      </div>

      {/* Sub-line placeholder */}
      <div className="px-4 pt-2 pb-1">
        <div className="h-3 w-2/3 rounded-full bg-[var(--border)]/50" />
      </div>

      {/* CTA bar */}
      <div className="px-4 pt-2 pb-4 mt-auto">
        <div className="h-10 w-full rounded-full bg-[var(--border)]/60" />
      </div>
    </div>
  );
}
