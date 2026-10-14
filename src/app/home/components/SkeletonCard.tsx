"use client";

// ====================================
// SKELETON COMPONENTS
// ====================================
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--border)] animate-pulse rounded-[2rem] ${className}`}
    />
  );
}
