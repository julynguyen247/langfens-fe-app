"use client";

// Light-blue AI Study Coach band. Renders 3 recommendation chips and a
// primary CTA pill → /study-plan. Hides cleanly when there's nothing to show.

import Link from "next/link";
import type { AiInsight, Recommendation } from "../_lib/utils";

export interface AiCoachBannerProps {
  recommendations: Recommendation[];
  insights: AiInsight[];
}

export function AiCoachBanner({
  recommendations,
  insights,
}: AiCoachBannerProps) {
  if (recommendations.length === 0 && insights.length === 0) return null;

  const top = recommendations.slice(0, 3);
  const leadInsight = insights[0]?.message;
  const leadReason = recommendations[0]?.reasons?.[0];
  const focusText =
    leadInsight ??
    leadReason ??
    "Based on your recent performance, focus on the question types you find challenging.";

  return (
    <section
      className="rounded-[2rem] border-[3px] border-[var(--border)] p-5 sm:p-6"
      style={{
        backgroundColor: "var(--primary-light)",
        boxShadow: "0 4px 0 rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 border-b-[3px] border-[var(--primary-dark)]">
          <span
            className="text-white font-bold text-sm"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AI
          </span>
        </div>
        <div className="flex-1">
          <h3
            className="text-lg font-bold text-[var(--foreground)] mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AI Study Coach
          </h3>
          <p
            className="text-[var(--text-body)] leading-relaxed mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {focusText}
          </p>

          {top.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {top.map((rec) => {
                const truncated =
                  rec.title.length > 30
                    ? rec.title.slice(0, 30) + "…"
                    : rec.title;
                return (
                  <Link
                    key={rec.examId}
                    href={`/practice?examId=${rec.examId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border-[2px] border-[var(--border)] text-sm text-[var(--primary)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
                    style={{ fontFamily: "var(--font-heading)" }}
                    title={rec.title}
                  >
                    {truncated}
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/study-plan"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            View study plan
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AiCoachBanner;
