"use client";

import { motion } from "framer-motion";
import { StatCard } from "./StatCard";
import {
  bandDescriptor,
  formatBand,
  percentToBand,
  type TrendSeries,
  type AnalyticsSummary,
} from "../_lib/utils";

// ---------------------------------------------------------------------------
// 2. KPI strip.
// ---------------------------------------------------------------------------

export function KpiStrip({
  summary,
  trend,
  streak: _streak,
}: {
  summary: AnalyticsSummary;
  trend: TrendSeries[];
  streak: number | null;
}) {
  // Average band is derived from `summary.avgScore` (percent) via percentToBand.
  const avgBandPct = summary.avgScore;
  const avgBand =
    avgBandPct != null && Number.isFinite(avgBandPct)
      ? percentToBand(avgBandPct)
      : null;

  // Best band is derived from the trend max (percent) so it tracks recent runs.
  let bestPct: number | null = null;
  for (const series of trend) {
    for (const p of series.points) {
      if (Number.isFinite(p.avgScore)) {
        if (bestPct == null || p.avgScore > bestPct) bestPct = p.avgScore;
      }
    }
  }
  const bestBand =
    bestPct != null ? percentToBand(bestPct) : avgBand;

  // Tests this week — count from trend points in the last 7 days.
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let testsThisWeek = 0;
  for (const series of trend) {
    for (const p of series.points) {
      const t = new Date(p.date).getTime();
      if (Number.isFinite(t) && t >= cutoff) testsThisWeek += 1;
    }
  }
  if (testsThisWeek === 0) {
    // Fallback: at minimum show the total so the card isn't blank.
    testsThisWeek = summary.totalAttempts ?? 0;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <StatCard
        label="Total attempts"
        value={summary.totalAttempts ?? 0}
        subLabel="Across all skills"
      />
      <StatCard
        label="Average band"
        value={avgBand != null ? formatBand(avgBand) : "—"}
        subLabel={avgBand != null ? bandDescriptor(avgBand) : "Pending"}
      />
      <StatCard
        label="Best band"
        value={bestBand != null ? formatBand(bestBand) : "—"}
        subLabel={bestBand != null ? bandDescriptor(bestBand) : "Pending"}
      />
      <StatCard
        label="Tests this week"
        value={testsThisWeek}
        subLabel="Past 7 days"
      />
    </motion.section>
  );
}
