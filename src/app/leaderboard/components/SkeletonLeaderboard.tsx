"use client";

export function SkeletonLeaderboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-10 bg-[var(--border)] rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[var(--border)] rounded-full" />
          <div className="h-4 w-32 bg-[var(--border)] rounded-full" />
        </div>
      </div>
      <div className="flex items-end justify-center gap-4 py-6">
        <div className="w-24 h-40 bg-[var(--border)] rounded-t-xl" />
        <div className="w-24 h-52 bg-[var(--border)] rounded-t-xl" />
        <div className="w-24 h-32 bg-[var(--border)] rounded-t-xl" />
      </div>
      <div className="bg-[var(--border)] rounded-[1.5rem] h-96" />
    </div>
  );
}
