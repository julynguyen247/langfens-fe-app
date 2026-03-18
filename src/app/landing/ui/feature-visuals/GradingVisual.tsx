"use client";

import React from "react";

export function GradingVisual() {
  const groups = [
    { label: "TA", color: "#2563EB", heights: [0.6, 0.8, 0.55, 0.9, 0.7, 0.75] },
    { label: "CC", color: "#06D6A0", heights: [0.5, 0.7, 0.85, 0.65, 0.8, 0.6] },
    { label: "LR", color: "#2563EB", heights: [0.7, 0.55, 0.75, 0.9, 0.6, 0.85] },
    { label: "GRA", color: "#06D6A0", heights: [0.65, 0.8, 0.6, 0.7, 0.9, 0.55] },
  ];

  const barWidth = 10;
  const barGap = 4;
  const groupGap = 30;
  const maxHeight = 180;
  const baseY = 280;

  const totalGroupWidth = groups.length * (6 * barWidth + 5 * barGap) + (groups.length - 1) * groupGap;
  const startX = (600 - totalGroupWidth) / 2;

  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AI Auto-Grading: animated bar chart showing IELTS scoring criteria"
      className="w-full h-auto"
    >
      <style>{`
        @keyframes grading-bar-grow {
          0%   { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes grading-line-draw {
          0%   { stroke-dashoffset: 800; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes grading-band-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        @keyframes grading-dot-pop {
          0%   { r: 0; opacity: 0; }
          60%  { r: 3.5; opacity: 1; }
          100% { r: 2.5; opacity: 0.9; }
        }
        .grading-bar {
          transform-origin: bottom center;
          animation: grading-bar-grow 1s ease-out forwards;
        }
        .grading-line {
          stroke-dasharray: 800;
          animation: grading-line-draw 2s ease-out 0.8s forwards;
          stroke-dashoffset: 800;
        }
        .grading-band {
          animation: grading-band-pulse 2.5s ease-in-out infinite;
        }
        .grading-dot {
          animation: grading-dot-pop 0.5s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .grading-bar,
          .grading-line,
          .grading-band,
          .grading-dot {
            animation: none !important;
            transform: scaleY(1) !important;
            stroke-dashoffset: 0 !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <defs>
        <filter id="grading-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Grid lines ── */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <g key={`grid-${i}`}>
          <line
            x1="60" y1={baseY - maxHeight * pct}
            x2="540" y2={baseY - maxHeight * pct}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="52" y={baseY - maxHeight * pct + 4}
            textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {(pct * 9).toFixed(1)}
          </text>
        </g>
      ))}

      {/* ── Baseline ── */}
      <line x1="60" y1={baseY} x2="540" y2={baseY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* ── Bar groups ── */}
      {(() => {
        let cx = startX;
        const elements: React.ReactNode[] = [];
        const linePoints: string[] = [];

        groups.forEach((group, gi) => {
          elements.push(
            <text
              key={`label-${gi}`}
              x={cx + (6 * barWidth + 5 * barGap) / 2}
              y={baseY + 22}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize="9"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {group.label}
            </text>
          );

          group.heights.forEach((h, bi) => {
            const x = cx + bi * (barWidth + barGap);
            const barH = maxHeight * h;
            const topY = baseY - barH;
            const delay = gi * 0.15 + bi * 0.05;

            linePoints.push(`${x + barWidth / 2},${topY}`);

            elements.push(
              <rect
                key={`bar-${gi}-${bi}`}
                x={x}
                y={topY}
                width={barWidth}
                height={barH}
                rx="2"
                fill={group.color}
                opacity="0.6"
                className="grading-bar"
                style={{ animationDelay: `${delay}s` } as React.CSSProperties}
              />
            );

            elements.push(
              <circle
                key={`dot-${gi}-${bi}`}
                cx={x + barWidth / 2}
                cy={topY}
                r="2.5"
                fill={group.color}
                className="grading-dot"
                style={{ animationDelay: `${delay + 0.8}s` } as React.CSSProperties}
              />
            );
          });

          cx += 6 * (barWidth + barGap) + groupGap;
        });

        if (linePoints.length > 1) {
          elements.push(
            <polyline
              key="avg-line"
              points={linePoints.join(" ")}
              fill="none"
              stroke="#F0F4F8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
              className="grading-line"
            />
          );
        }

        return elements;
      })()}

      {/* ── Band score label ── */}
      <rect x="240" y="310" width="120" height="40" rx="12" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.2)" strokeWidth="1" />
      <text
        x="300" y="337"
        textAnchor="middle" fill="#2563EB" fontSize="18" fontWeight="700"
        className="grading-band"
        style={{ fontFamily: "var(--font-mono)" }}
        filter="url(#grading-glow)"
      >
        BAND 7.0
      </text>
    </svg>
  );
}
