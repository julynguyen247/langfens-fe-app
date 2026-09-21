"use client";

import { ScoreTrendChart } from "./ScoreTrendChart";
import { formatBand, percentToBand, type TrendSeries } from "../_lib/utils";

import { CARD_CLASS } from "../_lib/presentation";

// ---------------------------------------------------------------------------
// 3. Score trend section.
// ---------------------------------------------------------------------------

export function ScoreTrendSection({ trend }: { trend: TrendSeries[] }) {
  return (
    <section className={CARD_CLASS}>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h2
          className="text-xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Score trend — last 30 days
        </h2>
        <p
          className="text-xs text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Hover for daily values (percent and band).
        </p>
      </div>
      <ScoreTrendChart
        series={trend}
        yMin={0}
        yMax={100}
        yLabel="%"
        formatHoverValue={(v) => {
          const band = percentToBand(v);
          return `${v.toFixed(0)}% (band ${formatBand(band)})`;
        }}
      />
    </section>
  );
}
