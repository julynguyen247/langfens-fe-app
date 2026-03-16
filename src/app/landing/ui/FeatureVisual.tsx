"use client";

import { useState, useEffect } from "react";

type FeatureVisualType =
  | "skills"
  | "grading"
  | "questions"
  | "analytics"
  | "flashcards"
  | "gamification";

interface FeatureVisualProps {
  type: FeatureVisualType;
}

/* ═══════════════════════════════════════════════════════════════════════
   1. SkillsVisual — "All 4 IELTS Skills" (network graph)
   ═══════════════════════════════════════════════════════════════════════ */

function SkillsVisual() {
  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="All 4 IELTS Skills: interconnected network graph of Reading, Writing, Listening, and Speaking"
      className="w-full h-auto"
    >
      <style>{`
        /* ── Hub pulse rings ── */
        @keyframes skills-pulse-ring {
          0%   { r: 18; opacity: 0.6; }
          100% { r: 60; opacity: 0; }
        }
        .skills-ring {
          animation: skills-pulse-ring 3s ease-out infinite;
        }
        .skills-ring-delay {
          animation: skills-pulse-ring 3s ease-out 1s infinite;
        }
        .skills-ring-delay2 {
          animation: skills-pulse-ring 3s ease-out 2s infinite;
        }

        /* ── Satellite drift ── */
        @keyframes skills-drift-1 {
          0%, 100% { transform: translate(0px, 0px); }
          50%      { transform: translate(4px, -6px); }
        }
        @keyframes skills-drift-2 {
          0%, 100% { transform: translate(0px, 0px); }
          50%      { transform: translate(-5px, 4px); }
        }
        @keyframes skills-drift-3 {
          0%, 100% { transform: translate(0px, 0px); }
          50%      { transform: translate(6px, 3px); }
        }
        .skills-sat-1 { animation: skills-drift-1 6s ease-in-out infinite; }
        .skills-sat-2 { animation: skills-drift-2 7s ease-in-out infinite; }
        .skills-sat-3 { animation: skills-drift-3 8s ease-in-out infinite; }

        /* ── Node glow pulse ── */
        @keyframes skills-node-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        .skills-node-pulse { animation: skills-node-pulse 3s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .skills-ring,
          .skills-ring-delay,
          .skills-ring-delay2,
          .skills-sat-1,
          .skills-sat-2,
          .skills-sat-3,
          .skills-node-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <defs>
        <radialGradient id="skills-hub-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
        </radialGradient>
        <filter id="skills-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Connection edges (hub to main nodes) ── */}
      {[
        [300, 187, 300, 75],   // hub -> Reading (top)
        [300, 187, 440, 187],  // hub -> Writing (right)
        [300, 187, 300, 300],  // hub -> Listening (bottom)
        [300, 187, 160, 187],  // hub -> Speaking (left)
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={`edge-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(37,99,235,0.15)"
          strokeWidth="1.5"
        />
      ))}

      {/* ── Satellite edges ── */}
      {[
        // Reading satellites
        [300, 75, 250, 40], [300, 75, 350, 40], [300, 75, 270, 110],
        // Writing satellites
        [440, 187, 490, 150], [440, 187, 490, 225], [440, 187, 410, 140],
        // Listening satellites
        [300, 300, 250, 340], [300, 300, 350, 340], [300, 300, 330, 260],
        // Speaking satellites
        [160, 187, 110, 150], [160, 187, 110, 225], [160, 187, 190, 240],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={`sat-edge-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(37,99,235,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* ── Hub pulse rings ── */}
      <circle cx="300" cy="187" r="18" fill="none" stroke="#2563EB" strokeWidth="1" className="skills-ring" />
      <circle cx="300" cy="187" r="18" fill="none" stroke="#2563EB" strokeWidth="1" className="skills-ring-delay" />
      <circle cx="300" cy="187" r="18" fill="none" stroke="#2563EB" strokeWidth="0.5" className="skills-ring-delay2" />

      {/* ── Center hub ── */}
      <circle cx="300" cy="187" r="18" fill="url(#skills-hub-grad)" filter="url(#skills-glow)" />

      {/* ── Main skill nodes ── */}
      {/* Reading (top) - primary */}
      <circle cx="300" cy="75" r="14" fill="#2563EB" opacity="0.85" className="skills-node-pulse" />
      <text x="300" y="80" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700"
        style={{ fontFamily: "var(--font-heading)" }}>R</text>

      {/* Writing (right) - accent */}
      <circle cx="440" cy="187" r="14" fill="#06D6A0" opacity="0.85" className="skills-node-pulse"
        style={{ animationDelay: "0.5s" } as React.CSSProperties} />
      <text x="440" y="192" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700"
        style={{ fontFamily: "var(--font-heading)" }}>W</text>

      {/* Listening (bottom) - primary */}
      <circle cx="300" cy="300" r="14" fill="#2563EB" opacity="0.85" className="skills-node-pulse"
        style={{ animationDelay: "1s" } as React.CSSProperties} />
      <text x="300" y="305" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700"
        style={{ fontFamily: "var(--font-heading)" }}>L</text>

      {/* Speaking (left) - accent */}
      <circle cx="160" cy="187" r="14" fill="#06D6A0" opacity="0.85" className="skills-node-pulse"
        style={{ animationDelay: "1.5s" } as React.CSSProperties} />
      <text x="160" y="192" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700"
        style={{ fontFamily: "var(--font-heading)" }}>S</text>

      {/* ── Satellite nodes (Reading) ── */}
      <g className="skills-sat-1">
        <circle cx="250" cy="40" r="6" fill="#2563EB" opacity="0.5" />
        <circle cx="350" cy="40" r="7" fill="#2563EB" opacity="0.4" />
        <circle cx="270" cy="110" r="5" fill="#2563EB" opacity="0.45" />
      </g>

      {/* ── Satellite nodes (Writing) ── */}
      <g className="skills-sat-2">
        <circle cx="490" cy="150" r="6" fill="#06D6A0" opacity="0.5" />
        <circle cx="490" cy="225" r="5" fill="#06D6A0" opacity="0.4" />
        <circle cx="410" cy="140" r="7" fill="#06D6A0" opacity="0.45" />
      </g>

      {/* ── Satellite nodes (Listening) ── */}
      <g className="skills-sat-3">
        <circle cx="250" cy="340" r="7" fill="#2563EB" opacity="0.5" />
        <circle cx="350" cy="340" r="5" fill="#2563EB" opacity="0.4" />
        <circle cx="330" cy="260" r="6" fill="#2563EB" opacity="0.45" />
      </g>

      {/* ── Satellite nodes (Speaking) ── */}
      <g className="skills-sat-1" style={{ animationDelay: "2s" } as React.CSSProperties}>
        <circle cx="110" cy="150" r="5" fill="#06D6A0" opacity="0.5" />
        <circle cx="110" cy="225" r="7" fill="#06D6A0" opacity="0.4" />
        <circle cx="190" cy="240" r="6" fill="#06D6A0" opacity="0.45" />
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. GradingVisual — "AI Auto-Grading" (waveform bars)
   ═══════════════════════════════════════════════════════════════════════ */

function GradingVisual() {
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

  // Calculate starting positions
  const totalGroupWidth = groups.length * (6 * barWidth + 5 * barGap) + (groups.length - 1) * groupGap;
  let startX = (600 - totalGroupWidth) / 2;

  // Build all bars and points for moving average line
  const allBars: { x: number; topY: number; color: string }[] = [];

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
          // Group label
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

            allBars.push({ x: x + barWidth / 2, topY, color: group.color });
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

            // Peak dot
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

        // Moving average line
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

/* ═══════════════════════════════════════════════════════════════════════
   3. QuestionsVisual — "20+ Question Types" (card grid)
   ═══════════════════════════════════════════════════════════════════════ */

function QuestionsVisual() {
  const cols = 4;
  const rows = 3;
  const cardW = 100;
  const cardH = 60;
  const gapX = 18;
  const gapY = 16;

  const totalW = cols * cardW + (cols - 1) * gapX;
  const totalH = rows * cardH + (rows - 1) * gapY;
  const offX = (600 - totalW) / 2;
  const offY = (375 - totalH) / 2;

  // Indices for highlighted cards
  const primaryHighlight = new Set([0, 5, 7, 10]); // ocean-primary border
  const accentHighlight = new Set([2, 6, 9]);       // ocean-accent border

  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="20+ Question Types: grid of question type cards"
      className="w-full h-auto"
    >
      <style>{`
        @keyframes questions-appear {
          0%   { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes questions-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        .questions-card {
          animation: questions-appear 0.5s ease-out forwards,
                     questions-float 5s ease-in-out infinite;
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .questions-card {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const idx = row * cols + col;
          const x = offX + col * (cardW + gapX);
          const y = offY + row * (cardH + gapY);
          const delay = row * 0.15 + col * 0.15;
          const floatDelay = idx * 0.4;

          let borderColor = "rgba(255,255,255,0.06)";
          let borderWidth = 1;
          let fillOpacity = 0.02;

          if (primaryHighlight.has(idx)) {
            borderColor = "#2563EB";
            borderWidth = 1.5;
            fillOpacity = 0.06;
          } else if (accentHighlight.has(idx)) {
            borderColor = "#06D6A0";
            borderWidth = 1.5;
            fillOpacity = 0.05;
          }

          return (
            <g
              key={idx}
              className="questions-card"
              style={{
                animationDelay: `${delay}s, ${delay + 0.5}s`,
                "--float-delay": `${floatDelay}s`,
              } as React.CSSProperties}
            >
              <rect
                x={x} y={y}
                width={cardW} height={cardH}
                rx="8"
                fill={`rgba(255,255,255,${fillOpacity})`}
                stroke={borderColor}
                strokeWidth={borderWidth}
              />
              {/* Text placeholder lines */}
              <rect x={x + 12} y={y + 16} width={cardW * 0.55} height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
              <rect x={x + 12} y={y + 26} width={cardW * 0.4} height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
              <rect x={x + 12} y={y + 36} width={cardW * 0.3} height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. AnalyticsVisual — "Analytics & Band Prediction" (flow graph)
   ═══════════════════════════════════════════════════════════════════════ */

function AnalyticsVisual() {
  const center = { x: 300, y: 187 };
  const sources = [
    { label: "R", angle: -90, dist: 130, color: "#2563EB" },
    { label: "W", angle: -30, dist: 130, color: "#2563EB" },
    { label: "L", angle: 30, dist: 130, color: "#2563EB" },
    { label: "S", angle: 90, dist: 130, color: "#2563EB" },
    { label: "V", angle: 150, dist: 130, color: "#2563EB" },
    { label: "G", angle: 210, dist: 130, color: "#2563EB" },
  ];

  const sourceNodes = sources.map((s) => ({
    ...s,
    x: center.x + Math.cos((s.angle * Math.PI) / 180) * s.dist,
    y: center.y + Math.sin((s.angle * Math.PI) / 180) * s.dist,
  }));

  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Analytics and Band Prediction: data flow from skills to predicted band score"
      className="w-full h-auto"
    >
      <style>{`
        @keyframes analytics-flow {
          0%   { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes analytics-pulse-ring {
          0%   { r: 28; opacity: 0.5; }
          100% { r: 65; opacity: 0; }
        }
        @keyframes analytics-center-glow {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 8px rgba(6,214,160,0.3)); }
          50%      { opacity: 1; filter: drop-shadow(0 0 20px rgba(6,214,160,0.6)); }
        }
        @keyframes analytics-source-drift {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(var(--dx, 2px), var(--dy, -2px)); }
        }
        .analytics-flow-line {
          stroke-dasharray: 6 4;
          animation: analytics-flow 1.5s linear infinite;
        }
        .analytics-ring {
          animation: analytics-pulse-ring 3s ease-out infinite;
        }
        .analytics-ring-delay {
          animation: analytics-pulse-ring 3s ease-out 1.5s infinite;
        }
        .analytics-center {
          animation: analytics-center-glow 3s ease-in-out infinite;
        }
        .analytics-source {
          animation: analytics-source-drift 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .analytics-flow-line,
          .analytics-ring,
          .analytics-ring-delay,
          .analytics-center,
          .analytics-source {
            animation: none !important;
          }
        }
      `}</style>

      <defs>
        <radialGradient id="analytics-center-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06D6A0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.5" />
        </radialGradient>
        <filter id="analytics-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Flow paths (curved lines from sources to center) ── */}
      {sourceNodes.map((node, i) => {
        const midX = (node.x + center.x) / 2 + (i % 2 === 0 ? 20 : -20);
        const midY = (node.y + center.y) / 2 + (i % 3 === 0 ? -15 : 15);
        return (
          <path
            key={`flow-${i}`}
            d={`M ${node.x} ${node.y} Q ${midX} ${midY} ${center.x} ${center.y}`}
            stroke={node.color}
            strokeWidth="1.5"
            fill="none"
            opacity="0.25"
            className="analytics-flow-line"
            style={{ animationDelay: `${i * 0.25}s` } as React.CSSProperties}
          />
        );
      })}

      {/* ── Center pulse rings ── */}
      <circle cx={center.x} cy={center.y} r="28" fill="none" stroke="#06D6A0" strokeWidth="1" className="analytics-ring" />
      <circle cx={center.x} cy={center.y} r="28" fill="none" stroke="#06D6A0" strokeWidth="0.5" className="analytics-ring-delay" />

      {/* ── Center node ── */}
      <circle
        cx={center.x} cy={center.y} r="28"
        fill="url(#analytics-center-grad)"
        filter="url(#analytics-glow)"
        className="analytics-center"
      />
      <text
        x={center.x} y={center.y + 2}
        textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize="18" fontWeight="700"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        7.5
      </text>

      {/* ── Source nodes ── */}
      {sourceNodes.map((node, i) => (
        <g
          key={`source-${i}`}
          className="analytics-source"
          style={{
            "--dx": `${(i % 2 === 0 ? 3 : -3)}px`,
            "--dy": `${(i % 3 === 0 ? -3 : 3)}px`,
            animationDelay: `${i * 0.8}s`,
          } as React.CSSProperties}
        >
          <circle cx={node.x} cy={node.y} r="12" fill={node.color} opacity="0.2" />
          <circle cx={node.x} cy={node.y} r="8" fill={node.color} opacity="0.6" />
          <text
            x={node.x} y={node.y + 1}
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize="9" fontWeight="600"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   5. FlashcardsVisual — "Flashcards & Vocabulary" (card flip)
   ═══════════════════════════════════════════════════════════════════════ */

function FlashcardsVisual() {
  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flashcards and Vocabulary: animated flashcard pairs with flip effect"
      className="w-full h-auto"
    >
      <style>{`
        @keyframes flash-flip-front {
          0%, 40%   { opacity: 1; }
          50%, 90%  { opacity: 0; }
          100%      { opacity: 1; }
        }
        @keyframes flash-flip-back {
          0%, 40%   { opacity: 0; }
          50%, 90%  { opacity: 1; }
          100%      { opacity: 0; }
        }
        @keyframes flash-sparkle {
          0%, 35%, 55%, 100% { opacity: 0; r: 0; }
          45%                { opacity: 1; r: 3; }
          50%                { opacity: 0.5; r: 1; }
        }
        @keyframes flash-particle {
          0%   { opacity: 0; transform: translateY(0); }
          20%  { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-40px); }
        }
        @keyframes flash-float {
          0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50%      { transform: translateY(-4px) rotate(var(--rot, 0deg)); }
        }
        .flash-front {
          animation: flash-flip-front 6s ease-in-out infinite;
        }
        .flash-back {
          animation: flash-flip-back 6s ease-in-out infinite;
        }
        .flash-sparkle {
          animation: flash-sparkle 6s ease-in-out infinite;
        }
        .flash-particle {
          animation: flash-particle 4s ease-out infinite;
        }
        .flash-float {
          animation: flash-float 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .flash-front,
          .flash-back,
          .flash-sparkle,
          .flash-particle,
          .flash-float {
            animation: none !important;
          }
          .flash-front { opacity: 1 !important; }
          .flash-back  { opacity: 0 !important; }
        }
      `}</style>

      <defs>
        <filter id="flash-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Floating particles ── */}
      {[
        { cx: 220, cy: 280, delay: 0 },
        { cx: 260, cy: 300, delay: 1.2 },
        { cx: 340, cy: 290, delay: 0.6 },
        { cx: 380, cy: 310, delay: 1.8 },
        { cx: 300, cy: 270, delay: 2.4 },
        { cx: 250, cy: 260, delay: 3.0 },
        { cx: 350, cy: 275, delay: 0.9 },
      ].map((p, i) => (
        <circle
          key={`particle-${i}`}
          cx={p.cx} cy={p.cy} r="1.5"
          fill="#2563EB" opacity="0"
          className="flash-particle"
          style={{ animationDelay: `${p.delay}s` } as React.CSSProperties}
        />
      ))}

      {/* ── Left card pair (smaller, rotated -5deg) ── */}
      <g className="flash-float" style={{ "--rot": "-5deg" } as React.CSSProperties}>
        {/* Back */}
        <rect x="100" y="120" width="130" height="90" rx="10"
          fill="rgba(6,214,160,0.08)" stroke="rgba(6,214,160,0.2)" strokeWidth="1"
          transform="rotate(-5, 165, 165)" />
        <rect x="118" y="148" width="60" height="2.5" rx="1" fill="rgba(6,214,160,0.15)" transform="rotate(-5, 165, 165)" />
        <rect x="118" y="158" width="45" height="2.5" rx="1" fill="rgba(6,214,160,0.1)" transform="rotate(-5, 165, 165)" />
        <rect x="118" y="168" width="35" height="2.5" rx="1" fill="rgba(6,214,160,0.07)" transform="rotate(-5, 165, 165)" />
        {/* Front */}
        <rect x="105" y="115" width="130" height="90" rx="10"
          fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1"
          transform="rotate(-5, 170, 160)" />
        <text x="150" y="166" fill="rgba(37,99,235,0.5)" fontSize="13" fontWeight="600"
          transform="rotate(-5, 170, 160)"
          style={{ fontFamily: "var(--font-heading)" }}>WORD</text>
      </g>

      {/* ── Center card pair (larger, animated flip) ── */}
      <g>
        {/* Back card */}
        <g className="flash-back">
          <rect x="210" y="100" width="180" height="120" rx="12"
            fill="rgba(6,214,160,0.1)" stroke="rgba(6,214,160,0.3)" strokeWidth="1.5" />
          <text x="260" y="140" fill="rgba(6,214,160,0.4)" fontSize="10"
            style={{ fontFamily: "var(--font-mono)" }}>DEFINITION</text>
          <rect x="235" y="152" width="100" height="3" rx="1.5" fill="rgba(6,214,160,0.15)" />
          <rect x="235" y="164" width="80" height="3" rx="1.5" fill="rgba(6,214,160,0.1)" />
          <rect x="235" y="176" width="90" height="3" rx="1.5" fill="rgba(6,214,160,0.08)" />
          <rect x="235" y="188" width="60" height="3" rx="1.5" fill="rgba(6,214,160,0.06)" />
        </g>
        {/* Front card */}
        <g className="flash-front">
          <rect x="210" y="100" width="180" height="120" rx="12"
            fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"
            filter="url(#flash-glow)" />
          <text x="300" y="168" textAnchor="middle" fill="rgba(37,99,235,0.7)" fontSize="20" fontWeight="700"
            style={{ fontFamily: "var(--font-heading)" }}>WORD</text>
        </g>
        {/* Sparkle dots at corners during flip */}
        {[
          { cx: 210, cy: 100 },
          { cx: 390, cy: 100 },
          { cx: 210, cy: 220 },
          { cx: 390, cy: 220 },
        ].map((s, i) => (
          <circle
            key={`sparkle-${i}`}
            cx={s.cx} cy={s.cy} r="0"
            fill="#F0F4F8"
            className="flash-sparkle"
            style={{ animationDelay: `${i * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </g>

      {/* ── Right card pair (smaller, rotated +5deg) ── */}
      <g className="flash-float" style={{ "--rot": "5deg", animationDelay: "1.5s" } as React.CSSProperties}>
        {/* Back */}
        <rect x="370" y="120" width="130" height="90" rx="10"
          fill="rgba(6,214,160,0.08)" stroke="rgba(6,214,160,0.2)" strokeWidth="1"
          transform="rotate(5, 435, 165)" />
        <rect x="388" y="148" width="60" height="2.5" rx="1" fill="rgba(6,214,160,0.15)" transform="rotate(5, 435, 165)" />
        <rect x="388" y="158" width="45" height="2.5" rx="1" fill="rgba(6,214,160,0.1)" transform="rotate(5, 435, 165)" />
        <rect x="388" y="168" width="35" height="2.5" rx="1" fill="rgba(6,214,160,0.07)" transform="rotate(5, 435, 165)" />
        {/* Front */}
        <rect x="375" y="115" width="130" height="90" rx="10"
          fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1"
          transform="rotate(5, 440, 160)" />
        <text x="420" y="166" fill="rgba(37,99,235,0.5)" fontSize="13" fontWeight="600"
          transform="rotate(5, 440, 160)"
          style={{ fontFamily: "var(--font-heading)" }}>WORD</text>
      </g>

      {/* ── Subtle label ── */}
      <text x="300" y="260" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="10"
        style={{ fontFamily: "var(--font-mono)" }}>
        TAP TO FLIP
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   6. GamificationVisual — "Gamification" (XP path routing)
   ═══════════════════════════════════════════════════════════════════════ */

function GamificationVisual() {
  // Winding path nodes from left to right
  const milestones = [
    { x: 80, y: 187 },   // LVL 1 (start)
    { x: 160, y: 130 },  // milestone 1
    { x: 230, y: 220 },  // milestone 2
    { x: 300, y: 140 },  // milestone 3
    { x: 370, y: 230 },  // milestone 4
    { x: 430, y: 150 },  // milestone 5
    { x: 490, y: 200 },  // milestone 6
    { x: 540, y: 187 },  // LVL 10 (end)
  ];

  // Build optimal path as smooth curve
  const optimalPath = `M ${milestones.map((m) => `${m.x} ${m.y}`).join(" L ")}`;

  // Build alternative routes (subtle, partially overlapping)
  const altRoutes = [
    `M 80 187 Q 120 80 200 100 Q 280 120 300 140 Q 340 170 400 190 Q 460 210 540 187`,
    `M 80 187 Q 140 260 220 250 Q 300 240 350 200 Q 420 140 480 170 Q 510 185 540 187`,
    `M 80 187 Q 130 150 180 160 Q 250 170 300 140 Q 380 100 450 130 Q 500 150 540 187`,
    `M 80 187 Q 150 280 240 260 Q 320 250 370 230 Q 440 200 490 200 L 540 187`,
  ];

  return (
    <svg
      viewBox="0 0 600 375"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gamification: XP leveling path from Level 1 to Level 10"
      className="w-full h-auto"
    >
      <style>{`
        @keyframes gam-flow {
          0%   { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes gam-travel {
          0%   { offset-distance: 0%; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes gam-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes gam-star-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.2); }
        }
        @keyframes gam-node-pop {
          0%   { r: 0; opacity: 0; }
          60%  { r: 9; opacity: 0.8; }
          100% { r: 7; opacity: 0.6; }
        }
        .gam-alt-route {
          stroke-dasharray: 4 6;
          animation: gam-flow 2s linear infinite;
        }
        .gam-optimal {
          stroke-dasharray: 8 4;
          animation: gam-flow 1.5s linear infinite;
        }
        .gam-label-blink {
          animation: gam-blink 2s ease-in-out infinite;
        }
        .gam-star {
          animation: gam-star-pulse 2.5s ease-in-out infinite;
        }
        .gam-milestone {
          animation: gam-node-pop 0.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .gam-alt-route,
          .gam-optimal,
          .gam-label-blink,
          .gam-star,
          .gam-milestone {
            animation: none !important;
            opacity: 0.6 !important;
          }
        }
      `}</style>

      <defs>
        <filter id="gam-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gam-glow-gold">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Optimal path for animateMotion */}
        <path
          id="gam-optimal-path"
          d={`M ${milestones.map((m) => `${m.x} ${m.y}`).join(" L ")}`}
        />
      </defs>

      {/* ── "XP PATH" label ── */}
      <text
        x="300" y="55"
        textAnchor="middle" fill="#2563EB" fontSize="11" fontWeight="600"
        className="gam-label-blink"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        XP PATH
      </text>

      {/* ── Alternative routes (subtle) ── */}
      {altRoutes.map((d, i) => (
        <path
          key={`alt-${i}`}
          d={d}
          stroke="#2563EB"
          strokeWidth="1"
          fill="none"
          opacity="0.1"
          className="gam-alt-route"
          style={{ animationDelay: `${i * 0.3}s` } as React.CSSProperties}
        />
      ))}

      {/* ── Optimal route (highlighted) ── */}
      <path
        d={optimalPath}
        stroke="#06D6A0"
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="gam-optimal"
        filter="url(#gam-glow)"
      />

      {/* ── Traveling dot along optimal path ── */}
      <circle r="4" fill="#06D6A0" opacity="0.9" filter="url(#gam-glow)">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path={`M ${milestones.map((m) => `${m.x} ${m.y}`).join(" L ")}`}
        />
      </circle>

      {/* ── Milestone nodes ── */}
      {milestones.slice(1, -1).map((m, i) => (
        <g key={`milestone-${i}`}>
          <circle
            cx={m.x} cy={m.y} r="7"
            fill="rgba(37,99,235,0.15)"
            stroke="#2563EB"
            strokeWidth="1"
            opacity="0.6"
            className="gam-milestone"
            style={{ animationDelay: `${i * 0.15}s` } as React.CSSProperties}
          />
          <circle cx={m.x} cy={m.y} r="3" fill="#2563EB" opacity="0.4" />
        </g>
      ))}

      {/* ── Stars near some milestones ── */}
      {[
        { x: 170, y: 112 },
        { x: 310, y: 122 },
        { x: 440, y: 132 },
      ].map((s, i) => (
        <text
          key={`star-${i}`}
          x={s.x} y={s.y}
          textAnchor="middle" fontSize="14"
          fill="#F59E0B"
          className="gam-star"
          style={{ animationDelay: `${i * 0.6}s` } as React.CSSProperties}
        >
          &#9733;
        </text>
      ))}

      {/* ── Start node: LVL 1 ── */}
      <circle cx={milestones[0].x} cy={milestones[0].y} r="16"
        fill="rgba(37,99,235,0.15)" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx={milestones[0].x} cy={milestones[0].y} r="12"
        fill="#2563EB" opacity="0.7" />
      <text
        x={milestones[0].x} y={milestones[0].y - 24}
        textAnchor="middle" fill="#2563EB" fontSize="9" fontWeight="600"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        LVL 1
      </text>

      {/* ── End node: LVL 10 ── */}
      <circle cx={milestones[7].x} cy={milestones[7].y} r="16"
        fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="1.5"
        filter="url(#gam-glow-gold)" />
      <circle cx={milestones[7].x} cy={milestones[7].y} r="12"
        fill="#F59E0B" opacity="0.7" />
      <text
        x={milestones[7].x} y={milestones[7].y - 24}
        textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="600"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        LVL 10
      </text>

      {/* ── Bottom label ── */}
      <text
        x="300" y="310"
        textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="10"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        EARN XP &bull; UNLOCK ACHIEVEMENTS
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Export — FeatureVisual
   ═══════════════════════════════════════════════════════════════════════ */

export function FeatureVisual({ type }: FeatureVisualProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  switch (type) {
    case "skills":
      return <SkillsVisual />;
    case "grading":
      return <GradingVisual />;
    case "questions":
      return <QuestionsVisual />;
    case "analytics":
      return <AnalyticsVisual />;
    case "flashcards":
      return <FlashcardsVisual />;
    case "gamification":
      return <GamificationVisual />;
    default:
      return null;
  }
}
