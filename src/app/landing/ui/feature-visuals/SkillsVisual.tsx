"use client";

export function SkillsVisual() {
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
