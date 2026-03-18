"use client";

export function StepVisual01() {
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
          <line
            x1={240} y1={135} x2={node.cx} y2={node.cy}
            stroke="var(--ocean-primary)" strokeWidth={0.8}
            strokeDasharray="4 4" opacity={0.25} className="dash-anim"
          />
          <circle
            cx={node.cx} cy={node.cy} r={node.r}
            fill={node.fill} opacity={0.85}
            className="node-anim" style={{ animationDelay: node.delay }}
          />
          {node.label && (
            <text
              x={node.cx} y={node.cy + 1}
              textAnchor="middle" dominantBaseline="central"
              fill="var(--ocean-bg)" fontSize={node.r > 6 ? 7 : 5}
              fontFamily="var(--font-mono)" fontWeight={600}
            >
              {node.label}
            </text>
          )}
        </g>
      ))}

      {/* "LANGFENS" label under center */}
      <text
        x={240} y={170} textAnchor="middle"
        fill="var(--ocean-text-muted)" fontSize={8}
        fontFamily="var(--font-mono)" letterSpacing="0.15em"
      >
        LANGFENS
      </text>
    </svg>
  );
}
