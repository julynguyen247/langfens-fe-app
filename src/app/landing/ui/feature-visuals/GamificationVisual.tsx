"use client";

export function GamificationVisual() {
  const milestones = [
    { x: 80, y: 187 },
    { x: 160, y: 130 },
    { x: 230, y: 220 },
    { x: 300, y: 140 },
    { x: 370, y: 230 },
    { x: 430, y: 150 },
    { x: 490, y: 200 },
    { x: 540, y: 187 },
  ];

  const optimalPath = `M ${milestones.map((m) => `${m.x} ${m.y}`).join(" L ")}`;

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
