"use client";

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] p-5 sm:p-6 animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-[var(--border)] rounded-full" />
                <div className="h-6 w-16 bg-[var(--border)] rounded-full" />
                <div className="h-6 w-14 bg-[var(--border)] rounded-full" />
              </div>
              <div className="h-5 w-2/3 bg-[var(--border)] rounded-full" />
              <div className="h-4 w-1/3 bg-[var(--border)] rounded-full" />
            </div>
            <div className="hidden sm:block w-20 h-10 bg-[var(--border)] rounded-2xl" />
            <div className="hidden sm:block w-20 h-10 bg-[var(--border)] rounded-2xl" />
            <div className="w-24 h-12 bg-[var(--border)] rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonList;
