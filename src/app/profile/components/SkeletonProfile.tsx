"use client";

// ====================================
// SKELETON LOADER
// ====================================
export function SkeletonProfile() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-[var(--primary-light)] mb-4" />
        <div className="h-7 w-48 bg-[var(--border)] rounded-full mb-3" />
        <div className="h-4 w-32 bg-[var(--background)] rounded-full mb-4" />
        <div className="h-3.5 w-full max-w-sm bg-[var(--background)] rounded-full" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 text-center space-y-2"
          >
            <div className="h-8 w-16 bg-[var(--border)] rounded-full mx-auto" />
            <div className="h-3 w-20 bg-[var(--background)] rounded-full mx-auto" />
          </div>
        ))}
      </div>

      {/* Tab area skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-[var(--border)] rounded-full" />
          ))}
        </div>
        <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8">
          <div className="h-6 w-40 bg-[var(--border)] rounded-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 bg-[var(--background)] rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
