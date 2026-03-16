"use client";

import { cn } from "@/lib/utils";

/* ─── Props ─── */
interface StepCardProps {
  step: { number: string; title: string; description: string };
  className?: string;
}

/* ═══════════════════════════════════════════════════════
   Step Visual SVGs — IELTS-themed illustrations
   ═══════════════════════════════════════════════════════ */

function StepVisual01() {
  return (
    <svg viewBox="0 0 480 270" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes expand-ring {
          0% { r: 14; opacity: 0.6; }
          100% { r: 50; opacity: 0; }
        }
        @keyframes node-pop {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dash-flow {
          0% { stroke-dashoffset: 16; }
          100% { stroke-dashoffset: 0; }
        }
        .ring-pulse { animation: expand-ring 2.4s ease-out infinite; transform-origin: center; }
        .ring-pulse-delay { animation: expand-ring 2.4s ease-out infinite 0.8s; }
        .ring-pulse-delay2 { animation: expand-ring 2.4s ease-out infinite 1.6s; }
        .node-anim { animation: node-pop 0.5s ease-out both; transform-origin: center; }
        .dash-anim { animation: dash-flow 1.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* Background grid dots */}
      {Array.from({ length: 7 }).map((_, col) =>
        Array.from({ length: 4 }).map((_, row) => (
          <circle
            key={`dot-${col}-${row}`}
            cx={60 + col * 60}
            cy={35 + row * 65}
            r={1}
            fill="var(--ocean-text-muted)"
            opacity={0.2}
          />
        ))
      )}

      {/* Center user circle */}
      <circle cx={240} cy={135} r={12} fill="var(--ocean-primary)" />
      <circle cx={240} cy={135} r={12} className="ring-pulse" fill="none" stroke="var(--ocean-primary)" strokeWidth={1} opacity={0.6} />
      <circle cx={240} cy={135} r={12} className="ring-pulse-delay" fill="none" stroke="var(--ocean-primary)" strokeWidth={1} opacity={0.6} />
      <circle cx={240} cy={135} r={12} className="ring-pulse-delay2" fill="none" stroke="var(--ocean-primary)" strokeWidth={1} opacity={0.6} />

      {/* User icon inside center circle */}
      <circle cx={240} cy={131} r={3.5} fill="var(--ocean-bg)" />
      <path d="M234 141a6 6 0 0112 0" stroke="var(--ocean-bg)" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Surrounding feature nodes */}
      {[
        { cx: 120, cy: 60, r: 8, fill: "var(--ocean-primary)", delay: "0.3s", label: "R" },
        { cx: 360, cy: 60, r: 8, fill: "var(--ocean-accent)", delay: "0.45s", label: "W" },
        { cx: 100, cy: 155, r: 7, fill: "var(--ocean-accent)", delay: "0.6s", label: "L" },
        { cx: 380, cy: 155, r: 7, fill: "var(--ocean-primary)", delay: "0.75s", label: "S" },
        { cx: 140, cy: 230, r: 6, fill: "var(--ocean-primary)", delay: "0.9s", label: "AI" },
        { cx: 340, cy: 230, r: 6, fill: "var(--ocean-accent)", delay: "1.05s", label: "XP" },
        { cx: 70, cy: 120, r: 5, fill: "var(--ocean-primary)", delay: "1.2s", label: "" },
        { cx: 410, cy: 120, r: 5, fill: "var(--ocean-accent)", delay: "1.35s", label: "" },
      ].map((node, i) => (
        <g key={`node-${i}`}>
          {/* Connection line */}
          <line
            x1={240}
            y1={135}
            x2={node.cx}
            y2={node.cy}
            stroke="var(--ocean-primary)"
            strokeWidth={0.8}
            strokeDasharray="4 4"
            opacity={0.25}
            className="dash-anim"
          />
          {/* Node circle */}
          <circle
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={node.fill}
            opacity={0.85}
            className="node-anim"
            style={{ animationDelay: node.delay }}
          />
          {/* Node label */}
          {node.label && (
            <text
              x={node.cx}
              y={node.cy + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--ocean-bg)"
              fontSize={node.r > 6 ? 7 : 5}
              fontFamily="var(--font-mono)"
              fontWeight={600}
            >
              {node.label}
            </text>
          )}
        </g>
      ))}

      {/* "LANGFENS" label under center */}
      <text
        x={240}
        y={170}
        textAnchor="middle"
        fill="var(--ocean-text-muted)"
        fontSize={8}
        fontFamily="var(--font-mono)"
        letterSpacing="0.15em"
      >
        LANGFENS
      </text>
    </svg>
  );
}

function StepVisual02() {
  const barCount = 8;
  const barWidth = 12;
  const barGap = 6;
  const groupWidth = barCount * (barWidth + barGap) - barGap;
  const leftGroupX = 50;
  const rightGroupX = 480 - 50 - groupWidth;
  const baseY = 220;
  const maxBarH = 140;

  const leftHeights = [0.45, 0.7, 0.55, 0.85, 0.6, 0.75, 0.5, 0.9];
  const rightHeights = [0.5, 0.6, 0.8, 0.45, 0.7, 0.55, 0.65, 0.85];

  return (
    <svg viewBox="0 0 480 270" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes bar-grow {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes score-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .bar-anim {
          transform-origin: bottom center;
          animation: bar-grow 0.8s ease-out both;
        }
        .score-anim { animation: score-pulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* "READING" label */}
      <text
        x={leftGroupX + groupWidth / 2}
        y={25}
        textAnchor="middle"
        fill="var(--ocean-text-muted)"
        fontSize={9}
        fontFamily="var(--font-mono)"
        letterSpacing="0.15em"
      >
        READING
      </text>

      {/* "WRITING" label */}
      <text
        x={rightGroupX + groupWidth / 2}
        y={25}
        textAnchor="middle"
        fill="var(--ocean-text-muted)"
        fontSize={9}
        fontFamily="var(--font-mono)"
        letterSpacing="0.15em"
      >
        WRITING
      </text>

      {/* Left bar group */}
      {leftHeights.map((h, i) => {
        const barH = h * maxBarH;
        const x = leftGroupX + i * (barWidth + barGap);
        const color = i % 3 === 0 ? "var(--ocean-accent)" : "var(--ocean-primary)";
        return (
          <rect
            key={`l-${i}`}
            x={x}
            y={baseY - barH}
            width={barWidth}
            height={barH}
            rx={3}
            fill={color}
            opacity={0.8}
            className="bar-anim"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        );
      })}

      {/* Right bar group */}
      {rightHeights.map((h, i) => {
        const barH = h * maxBarH;
        const x = rightGroupX + i * (barWidth + barGap);
        const color = i % 3 === 0 ? "var(--ocean-accent)" : "var(--ocean-primary)";
        return (
          <rect
            key={`r-${i}`}
            x={x}
            y={baseY - barH}
            width={barWidth}
            height={barH}
            rx={3}
            fill={color}
            opacity={0.8}
            className="bar-anim"
            style={{ animationDelay: `${0.64 + i * 0.08}s` }}
          />
        );
      })}

      {/* VS divider */}
      <line
        x1={240}
        y1={40}
        x2={240}
        y2={230}
        stroke="var(--ocean-border)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.5}
      />
      <circle cx={240} cy={135} r={18} fill="var(--ocean-bg-light)" stroke="var(--ocean-primary)" strokeWidth={1} opacity={0.9} />
      <text
        x={240}
        y={136}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--ocean-primary)"
        fontSize={11}
        fontFamily="var(--font-heading)"
        fontWeight={700}
        className="score-anim"
      >
        VS
      </text>

      {/* Bottom baseline */}
      <line
        x1={leftGroupX - 5}
        y1={baseY + 1}
        x2={leftGroupX + groupWidth + 5}
        y2={baseY + 1}
        stroke="var(--ocean-border)"
        strokeWidth={0.5}
        opacity={0.5}
      />
      <line
        x1={rightGroupX - 5}
        y1={baseY + 1}
        x2={rightGroupX + groupWidth + 5}
        y2={baseY + 1}
        stroke="var(--ocean-border)"
        strokeWidth={0.5}
        opacity={0.5}
      />

      {/* Score badge */}
      <rect x={180} y={240} width={120} height={24} rx={12} fill="var(--ocean-primary)" opacity={0.15} />
      <rect x={180} y={240} width={120} height={24} rx={12} fill="none" stroke="var(--ocean-primary)" strokeWidth={0.5} opacity={0.4} />
      <text
        x={240}
        y={253}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--ocean-primary)"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fontWeight={600}
        className="score-anim"
      >
        AI SCORE: 7.5
      </text>
    </svg>
  );
}

function StepVisual03() {
  const pathD = "M 40 200 Q 100 190 140 170 T 220 130 T 300 100 T 380 50 T 440 30";
  const dataPoints = [
    { cx: 40, cy: 200, delay: "0.4s" },
    { cx: 140, cy: 170, delay: "0.7s" },
    { cx: 220, cy: 130, delay: "1.0s" },
    { cx: 300, cy: 100, delay: "1.3s" },
    { cx: 380, cy: 50, delay: "1.6s" },
    { cx: 440, cy: 30, delay: "1.9s" },
  ];

  return (
    <svg viewBox="0 0 480 270" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ocean-primary)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--ocean-primary)" stopOpacity={0.02} />
        </linearGradient>
        <clipPath id="chartClip">
          <rect x={40} y={10} width={410} height={230} />
        </clipPath>
      </defs>
      <style>{`
        @keyframes line-draw {
          0% { stroke-dashoffset: 600; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes profit-flash {
          0%, 100% { r: 4; opacity: 1; }
          50% { r: 6; opacity: 0.7; }
        }
        .line-anim {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: line-draw 2s ease-out forwards;
        }
        .point-anim { animation: profit-flash 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* Y axis */}
      <line x1={40} y1={10} x2={40} y2={240} stroke="var(--ocean-border)" strokeWidth={0.5} opacity={0.5} />
      {/* X axis */}
      <line x1={40} y1={240} x2={450} y2={240} stroke="var(--ocean-border)" strokeWidth={0.5} opacity={0.5} />

      {/* Y axis labels (band scores) */}
      {[
        { label: "9.0", y: 20 },
        { label: "7.0", y: 80 },
        { label: "5.0", y: 160 },
        { label: "3.0", y: 220 },
      ].map((tick) => (
        <g key={tick.label}>
          <line x1={36} y1={tick.y} x2={40} y2={tick.y} stroke="var(--ocean-border)" strokeWidth={0.5} opacity={0.4} />
          <text
            x={32}
            y={tick.y + 1}
            textAnchor="end"
            dominantBaseline="central"
            fill="var(--ocean-text-muted)"
            fontSize={7}
            fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
          {/* Horizontal grid line */}
          <line x1={40} y1={tick.y} x2={450} y2={tick.y} stroke="var(--ocean-border)" strokeWidth={0.3} opacity={0.2} strokeDasharray="4 4" />
        </g>
      ))}

      {/* X axis labels (weeks) */}
      {[
        { label: "W1", x: 80 },
        { label: "W4", x: 180 },
        { label: "W7", x: 280 },
        { label: "W10", x: 380 },
      ].map((tick) => (
        <text
          key={tick.label}
          x={tick.x}
          y={255}
          textAnchor="middle"
          fill="var(--ocean-text-muted)"
          fontSize={7}
          fontFamily="var(--font-mono)"
        >
          {tick.label}
        </text>
      ))}

      {/* Area fill under the curve */}
      <path
        d={`${pathD} L 440 240 L 40 240 Z`}
        fill="url(#areaFill)"
        clipPath="url(#chartClip)"
      />

      {/* Progress line */}
      <path
        d={pathD}
        stroke="var(--ocean-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="line-anim"
      />

      {/* Data points with pulse */}
      {dataPoints.map((pt, i) => (
        <g key={`pt-${i}`}>
          <circle
            cx={pt.cx}
            cy={pt.cy}
            r={4}
            fill="var(--ocean-primary)"
            className="point-anim"
            style={{ animationDelay: pt.delay }}
          />
          <circle
            cx={pt.cx}
            cy={pt.cy}
            r={2}
            fill="var(--ocean-bg)"
          />
        </g>
      ))}

      {/* "+2.0 Bands" badge (top-right) */}
      <rect x={370} y={4} width={100} height={22} rx={11} fill="#22C55E" opacity={0.15} />
      <rect x={370} y={4} width={100} height={22} rx={11} fill="none" stroke="#22C55E" strokeWidth={0.7} opacity={0.6} />
      <text
        x={420}
        y={16}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#22C55E"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fontWeight={700}
      >
        +2.0 Bands
      </text>

      {/* "BAND SCORE" label */}
      <text
        x={16}
        y={130}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--ocean-text-muted)"
        fontSize={6}
        fontFamily="var(--font-mono)"
        letterSpacing="0.1em"
        transform="rotate(-90 16 130)"
      >
        BAND SCORE
      </text>
    </svg>
  );
}

/* ─── Visual selector ─── */
function StepVisual({ stepNumber }: { stepNumber: string }) {
  switch (stepNumber) {
    case "01":
      return <StepVisual01 />;
    case "02":
      return <StepVisual02 />;
    case "03":
      return <StepVisual03 />;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════
   StepCard Component
   ═══════════════════════════════════════════════════════ */

export default function StepCard({ step, className }: StepCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-[var(--ocean-border)] bg-[var(--ocean-bg-light)] p-8 transition-all duration-500 hover:border-[var(--ocean-primary)]/30 hover:shadow-[0_0_40px_rgba(37,99,235,0.12)] lg:p-10",
        className
      )}
    >
      {/* Watermark number */}
      <span className="absolute right-6 top-4 font-heading text-[120px] font-bold leading-none text-gradient-ocean opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500 select-none">
        {step.number}
      </span>

      {/* Corner glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--ocean-primary)]/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Visual container */}
      <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-[var(--ocean-border)]/50 bg-[var(--ocean-bg)]">
        <StepVisual stepNumber={step.number} />
      </div>

      {/* Step label */}
      <span className="mb-2 block font-code text-xs uppercase tracking-[0.2em] text-[var(--ocean-primary)]">
        Step {step.number}
      </span>

      {/* Title */}
      <h3 className="font-heading text-2xl font-bold text-[var(--ocean-text)] transition-colors duration-300 group-hover:text-[var(--ocean-primary)]">
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-base leading-relaxed text-[var(--ocean-text-secondary)]">
        {step.description}
      </p>
    </div>
  );
}
