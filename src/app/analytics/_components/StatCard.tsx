"use client";

// Stat tile shown in the 4-up KPI strip near the top of the analytics page.
// Copied verbatim from `history/_components/StatCard.tsx`.

import type { CSSProperties, ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Optional smaller secondary line, e.g. "Good user". */
  subLabel?: ReactNode;
  /** When true, the value is rendered with the mono numeric font. */
  numeric?: boolean;
  /** When true, renders a shimmer placeholder instead of real value. */
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  subLabel,
  numeric = true,
  loading = false,
}: StatCardProps) {
  const valueStyle: CSSProperties = numeric
    ? { fontFamily: "var(--font-code)" }
    : { fontFamily: "var(--font-heading)" };

  return (
    <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150">
      <p
        className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </p>

      {loading ? (
        <div className="h-9 w-24 rounded-full bg-[var(--border)] animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-3xl sm:text-4xl font-bold text-[var(--foreground)]"
            style={valueStyle}
          >
            {value}
          </span>
        </div>
      )}

      {subLabel && !loading && (
        <p
          className="text-xs mt-2 font-bold text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {subLabel}
        </p>
      )}
    </div>
  );
}

export default StatCard;
