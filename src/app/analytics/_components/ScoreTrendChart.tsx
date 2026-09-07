"use client";

// Inline SVG line chart for the "Score trend — last 30 days" section.
// One path per skill that has data. Skill colours come from globals.css
// `--skill-reading` / `--skill-listening` / `--skill-writing` / `--skill-speaking`.
// Width fills container, height ~140px. No external deps.
//
// ---------------------------------------------------------------------------
// Axis semantics
// ---------------------------------------------------------------------------
// The trend endpoint returns `avgScore` on a percent 0–100 scale (see
// _lib/utils.ts CONTRACT comment). To keep this chart compatible with the
// history page (which assumes band 0–9) and with future callers, the Y-axis is
// parameterised:
//   - `yMin`, `yMax`         default to 0 / 100 (matches the percent scale)
//   - `yLabel`               axis tick label suffix (default "%")
//   - `formatHoverValue`     optional callback to format the per-skill hover
//                            value; default renders `v.toFixed(1) + yLabel`.
//                            Pass a callback to show both percent and band, e.g.
//                            `v => ${v.toFixed(0)}% (${band} band)`.
// The history chart is a strict superset of this chart (only the defaults
// change).

import { useState } from "react";
import {
  SKILL_LABEL,
  smoothPath,
  type SkillKey,
} from "../../history/_lib/utils";

export interface TrendSeries {
  skill: SkillKey;
  /** ISO date strings ("YYYY-MM-DD" or full ISO). Order ascending. */
  points: Array<{ date: string; avgScore: number }>;
}

export interface ScoreTrendChartProps {
  series: TrendSeries[];
  height?: number;
  /** Y-axis minimum. Default 0. */
  yMin?: number;
  /** Y-axis maximum. Default 100 (matches the percent scale). */
  yMax?: number;
  /** Suffix appended to Y ticks and tooltip values. Default "%". */
  yLabel?: string;
  /** Override the hover/tooltip value formatter. */
  formatHoverValue?: (value: number) => string;
}

const SKILL_COLORS: Record<SkillKey, string> = {
  reading: "var(--skill-reading)",
  listening: "var(--skill-listening)",
  writing: "var(--skill-writing)",
  speaking: "var(--skill-speaking)",
};

interface HoverState {
  x: number;
  y: number;
  date: string;
  // per-skill value at hovered x
  values: Record<SkillKey, number | null>;
}

export function ScoreTrendChart({
  series,
  height = 140,
  yMin = 0,
  yMax = 100,
  yLabel = "%",
  formatHoverValue,
}: ScoreTrendChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const width = 600;
  const padTop = 12;
  const padBottom = 26;
  const padLeft = 38;
  const padRight = 12;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const yRange = yMax - yMin;

  const allDates: string[] = [];
  {
    const set = new Set<string>();
    for (const s of series) {
      for (const p of s.points) set.add(p.date);
    }
    set.forEach((d) => allDates.push(d));
    allDates.sort();
  }

  if (allDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-sm text-[var(--text-muted)]">
        No trend data yet.
      </div>
    );
  }

  const xFor = (date: string): number => {
    if (allDates.length === 1) return padLeft + chartW / 2;
    const idx = allDates.indexOf(date);
    const ratio = idx / (allDates.length - 1);
    return padLeft + ratio * chartW;
  };

  const yFor = (value: number): number => {
    const clamped = Math.max(yMin, Math.min(yMax, value));
    const ratio = (clamped - yMin) / yRange;
    return padTop + chartH - ratio * chartH;
  };

  const renderedSeries = series
    .filter((s) => s.points.length > 0)
    .map((s) => {
      const coords = s.points.map((p) => ({
        x: xFor(p.date),
        y: yFor(p.avgScore),
        date: p.date,
        avg: p.avgScore,
        skill: s.skill,
      }));
      const d = smoothPath(coords.map((c) => ({ x: c.x, y: c.y })));
      return { skill: s.skill, d, coords, color: SKILL_COLORS[s.skill] };
    });

  // Y-axis grid lines: pick 4 even ticks between yMin and yMax.
  const tickStep = yMax === 9 ? 2 : 25;
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + 0.0001; v += tickStep) {
    yTicks.push(v);
  }

  const xTickIndices: number[] = [];
  const tickCount = Math.min(6, allDates.length);
  for (let i = 0; i < tickCount; i++) {
    const idx = Math.round(
      (i * (allDates.length - 1)) / Math.max(1, tickCount - 1),
    );
    if (!xTickIndices.includes(idx)) xTickIndices.push(idx);
  }
  xTickIndices.sort((a, b) => a - b);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const target = e.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    if (
      svgX < padLeft ||
      svgX > width - padRight ||
      allDates.length === 0
    ) {
      setHover(null);
      return;
    }
    const ratio = (svgX - padLeft) / chartW;
    const idx = Math.round(ratio * (allDates.length - 1));
    const clampedIdx = Math.max(0, Math.min(allDates.length - 1, idx));
    const date = allDates[clampedIdx];
    if (!date) {
      setHover(null);
      return;
    }
    const xPx = xFor(date);
    const yPx = padTop + chartH / 2;
    const values: Record<SkillKey, number | null> = {
      reading: null,
      listening: null,
      writing: null,
      speaking: null,
    };
    for (const s of series) {
      const pt = s.points.find((p) => p.date === date);
      if (pt) values[s.skill] = pt.avgScore;
    }
    setHover({ x: xPx, y: yPx, date, values });
  }

  const formatValue = (v: number): string => {
    if (formatHoverValue) return formatHoverValue(v);
    // Default: round to integer when on percent scale, 1 decimal on band scale.
    const decimals = yMax === 9 ? 1 : 0;
    return `${v.toFixed(decimals)}${yLabel}`;
  };

  return (
    <div className="w-full">
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          aria-label="Score trend chart"
          role="img"
        >
          {/* Y grid + labels */}
          {yTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={padLeft - 4}
                  y={y + 2}
                  textAnchor="end"
                  fontSize={7}
                  fill="var(--text-muted)"
                  style={{ fontFamily: "var(--font-code)" }}
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Series paths */}
          {renderedSeries.map((s) => (
            <g key={s.skill}>
              <path
                d={s.d}
                fill="none"
                stroke={s.color}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {s.coords.map((c) => (
                <circle
                  key={`${c.date}-${s.skill}`}
                  cx={c.x}
                  cy={c.y}
                  r={1.6}
                  fill="white"
                  stroke={s.color}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          ))}

          {/* X-axis labels */}
          {xTickIndices.map((i) => {
            const date = allDates[i];
            if (!date) return null;
            return (
              <text
                key={date}
                x={xFor(date)}
                y={height - 6}
                textAnchor="middle"
                fontSize={7}
                fill="var(--text-muted)"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {formatShortDateLabel(date)}
              </text>
            );
          })}

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={padTop}
                y2={height - padBottom}
                stroke="var(--primary)"
                strokeWidth={0.8}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
              {renderedSeries.map((s) => {
                const v = hover.values[s.skill];
                if (v == null) return null;
                return (
                  <circle
                    key={`hover-${s.skill}`}
                    cx={hover.x}
                    cy={yFor(v)}
                    r={2.4}
                    fill="white"
                    stroke={s.color}
                    strokeWidth={1.4}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: `${(hover.x / width) * 100}%`,
              top: `${(hover.y / height) * 100}%`,
              transform: "translate(-50%, calc(-100% - 10px))",
            }}
          >
            <div className="bg-[var(--foreground)] text-white text-xs rounded-xl px-3 py-2 shadow-lg whitespace-nowrap">
              <div
                className="font-bold mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {formatShortDateLabel(hover.date)}
              </div>
              {renderedSeries.map((s) => {
                const v = hover.values[s.skill];
                if (v == null) return null;
                return (
                  <div
                    key={s.skill}
                    className="flex items-center gap-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>
                      {SKILL_LABEL[s.skill]}: {formatValue(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {renderedSeries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {renderedSeries.map((s) => (
            <div key={s.skill} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="text-xs text-[var(--text-body)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {SKILL_LABEL[s.skill]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatShortDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate().toString();
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
}

export default ScoreTrendChart;
