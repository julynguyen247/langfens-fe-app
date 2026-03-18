"use client";

export function StepVisual03() {
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
            x={32} y={tick.y + 1} textAnchor="end" dominantBaseline="central"
            fill="var(--ocean-text-muted)" fontSize={7} fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
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
          key={tick.label} x={tick.x} y={255}
          textAnchor="middle" fill="var(--ocean-text-muted)"
          fontSize={7} fontFamily="var(--font-mono)"
        >
          {tick.label}
        </text>
      ))}

      {/* Area fill under the curve */}
      <path d={`${pathD} L 440 240 L 40 240 Z`} fill="url(#areaFill)" clipPath="url(#chartClip)" />

      {/* Progress line */}
      <path
        d={pathD} stroke="var(--ocean-primary)" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" fill="none" className="line-anim"
      />

      {/* Data points with pulse */}
      {dataPoints.map((pt, i) => (
        <g key={`pt-${i}`}>
          <circle cx={pt.cx} cy={pt.cy} r={4} fill="var(--ocean-primary)" className="point-anim" style={{ animationDelay: pt.delay }} />
          <circle cx={pt.cx} cy={pt.cy} r={2} fill="var(--ocean-bg)" />
        </g>
      ))}

      {/* "+2.0 Bands" badge (top-right) */}
      <rect x={370} y={4} width={100} height={22} rx={11} fill="#22C55E" opacity={0.15} />
      <rect x={370} y={4} width={100} height={22} rx={11} fill="none" stroke="#22C55E" strokeWidth={0.7} opacity={0.6} />
      <text
        x={420} y={16} textAnchor="middle" dominantBaseline="central"
        fill="#22C55E" fontSize={10} fontFamily="var(--font-mono)" fontWeight={700}
      >
        +2.0 Bands
      </text>

      {/* "BAND SCORE" label */}
      <text
        x={16} y={130} textAnchor="middle" dominantBaseline="central"
        fill="var(--ocean-text-muted)" fontSize={6} fontFamily="var(--font-mono)"
        letterSpacing="0.1em" transform="rotate(-90 16 130)"
      >
        BAND SCORE
      </text>
    </svg>
  );
}
