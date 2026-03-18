"use client";

export function StepVisual02() {
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
        x={leftGroupX + groupWidth / 2} y={25}
        textAnchor="middle" fill="var(--ocean-text-muted)"
        fontSize={9} fontFamily="var(--font-mono)" letterSpacing="0.15em"
      >
        READING
      </text>

      {/* "WRITING" label */}
      <text
        x={rightGroupX + groupWidth / 2} y={25}
        textAnchor="middle" fill="var(--ocean-text-muted)"
        fontSize={9} fontFamily="var(--font-mono)" letterSpacing="0.15em"
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
            key={`l-${i}`} x={x} y={baseY - barH}
            width={barWidth} height={barH} rx={3}
            fill={color} opacity={0.8}
            className="bar-anim" style={{ animationDelay: `${i * 0.08}s` }}
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
            key={`r-${i}`} x={x} y={baseY - barH}
            width={barWidth} height={barH} rx={3}
            fill={color} opacity={0.8}
            className="bar-anim" style={{ animationDelay: `${0.64 + i * 0.08}s` }}
          />
        );
      })}

      {/* VS divider */}
      <line x1={240} y1={40} x2={240} y2={230} stroke="var(--ocean-border)" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
      <circle cx={240} cy={135} r={18} fill="var(--ocean-bg-light)" stroke="var(--ocean-primary)" strokeWidth={1} opacity={0.9} />
      <text
        x={240} y={136} textAnchor="middle" dominantBaseline="central"
        fill="var(--ocean-primary)" fontSize={11} fontFamily="var(--font-heading)"
        fontWeight={700} className="score-anim"
      >
        VS
      </text>

      {/* Bottom baseline */}
      <line x1={leftGroupX - 5} y1={baseY + 1} x2={leftGroupX + groupWidth + 5} y2={baseY + 1} stroke="var(--ocean-border)" strokeWidth={0.5} opacity={0.5} />
      <line x1={rightGroupX - 5} y1={baseY + 1} x2={rightGroupX + groupWidth + 5} y2={baseY + 1} stroke="var(--ocean-border)" strokeWidth={0.5} opacity={0.5} />

      {/* Score badge */}
      <rect x={180} y={240} width={120} height={24} rx={12} fill="var(--ocean-primary)" opacity={0.15} />
      <rect x={180} y={240} width={120} height={24} rx={12} fill="none" stroke="var(--ocean-primary)" strokeWidth={0.5} opacity={0.4} />
      <text
        x={240} y={253} textAnchor="middle" dominantBaseline="central"
        fill="var(--ocean-primary)" fontSize={10} fontFamily="var(--font-mono)"
        fontWeight={600} className="score-anim"
      >
        AI SCORE: 7.5
      </text>
    </svg>
  );
}
