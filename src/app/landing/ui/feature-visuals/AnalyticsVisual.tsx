"use client";

export function AnalyticsVisual() {
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
