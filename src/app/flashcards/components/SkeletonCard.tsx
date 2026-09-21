"use client";

// ====================================
// SKELETON CARD
// ====================================
export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white border-[3px] border-[var(--border)] rounded-[2rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-5 bg-[var(--border)] rounded-full w-3/4 mb-3" />
          <div className="h-4 bg-[var(--background)] rounded-full w-full mb-2" />
        </div>
        <div className="w-[52px] h-[52px] rounded-full bg-[var(--background)]" />
      </div>
      <div className="flex gap-2 mt-4 mb-5">
        <div className="h-6 bg-[var(--background)] rounded-full w-20" />
        <div className="h-6 bg-[var(--background)] rounded-full w-16" />
      </div>
      <div className="h-10 bg-[var(--border)] rounded-full" />
    </div>
  );
}
