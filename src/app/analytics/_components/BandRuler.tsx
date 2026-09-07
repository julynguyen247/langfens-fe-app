"use client";

// Inline SVG band scale 1.0–9.0 with a marker at the predicted band.
// ~40px tall, tick every 0.5. Copied from history verbatim.

import type { CSSProperties } from "react";

export interface BandRulerProps {
  /** Predicted band, e.g. 7.5. When null/undefined the marker is hidden. */
  predictedBand?: number | null;
  /** Optional inline style override for the wrapper. */
  style?: CSSProperties;
}

const MIN = 1.0;
const MAX = 9.0;
const STEP = 0.5;

export function BandRuler({ predictedBand, style }: BandRulerProps) {
  const ticks: number[] = [];
  for (let v = MIN; v <= MAX + 0.0001; v += STEP) {
    ticks.push(Math.round(v * 10) / 10);
  }

  const width = 100;
  const height = 40;
  const padX = 1;
  const innerW = width - padX * 2;

  const xFor = (band: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, band));
    const ratio = (clamped - MIN) / (MAX - MIN);
    return padX + ratio * innerW;
  };

  const hasMarker =
    typeof predictedBand === "number" && !Number.isNaN(predictedBand);

  return (
    <div className="w-full" style={style}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        aria-label="IELTS band scale"
        role="img"
      >
        {/* Backing strip */}
        <rect
          x={padX}
          y={height - 12}
          width={innerW}
          height={6}
          rx={3}
          fill="var(--primary-light)"
        />

        {/* Ticks + labels */}
        {ticks.map((tick) => {
          const x = xFor(tick);
          const isMajor = tick % 1 === 0;
          return (
            <g key={tick}>
              <line
                x1={x}
                x2={x}
                y1={height - 14}
                y2={height - 8}
                stroke="var(--text-muted)"
                strokeWidth={isMajor ? 0.6 : 0.4}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={x}
                y={height - 1}
                fontSize={3.6}
                textAnchor="middle"
                fill="var(--text-muted)"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Predicted marker — triangle pointer above the strip */}
        {hasMarker && (
          <g>
            <line
              x1={xFor(predictedBand as number)}
              x2={xFor(predictedBand as number)}
              y1={0}
              y2={height - 14}
              stroke="var(--primary-dark)"
              strokeWidth={0.8}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={xFor(predictedBand as number)}
              cy={height - 9}
              r={2.4}
              fill="var(--primary)"
              stroke="var(--primary-dark)"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default BandRuler;
