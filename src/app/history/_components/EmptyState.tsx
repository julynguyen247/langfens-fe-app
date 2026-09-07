"use client";

import { useRouter } from "next/navigation";

export interface EmptyStateProps {
  variant: "no-data" | "no-matches";
}

export function EmptyState({ variant }: EmptyStateProps) {
  const router = useRouter();
  return (
    <div
      className="bg-white rounded-[2rem] border-[3px] border-dashed border-[var(--border)] p-12 text-center"
    >
      <p
        className="text-lg font-bold text-[var(--foreground)] mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {variant === "no-matches" ? "No matching attempts" : "No attempts yet"}
      </p>
      <p
        className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {variant === "no-matches"
          ? "Try widening the time range or clearing the exam-type filter to see more results."
          : "Take your first practice test to start building your history."}
      </p>

      <button
        type="button"
        onClick={() => router.push("/practice")}
        className="px-5 py-2.5 rounded-full text-sm font-bold bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Start practice
      </button>
    </div>
  );
}

export default EmptyState;
