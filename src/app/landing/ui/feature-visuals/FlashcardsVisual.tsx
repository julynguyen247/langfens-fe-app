"use client";

export function FlashcardsVisual() {
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
        <rect x="100" y="120" width="130" height="90" rx="10"
          fill="rgba(6,214,160,0.08)" stroke="rgba(6,214,160,0.2)" strokeWidth="1"
          transform="rotate(-5, 165, 165)" />
        <rect x="118" y="148" width="60" height="2.5" rx="1" fill="rgba(6,214,160,0.15)" transform="rotate(-5, 165, 165)" />
        <rect x="118" y="158" width="45" height="2.5" rx="1" fill="rgba(6,214,160,0.1)" transform="rotate(-5, 165, 165)" />
        <rect x="118" y="168" width="35" height="2.5" rx="1" fill="rgba(6,214,160,0.07)" transform="rotate(-5, 165, 165)" />
        <rect x="105" y="115" width="130" height="90" rx="10"
          fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1"
          transform="rotate(-5, 170, 160)" />
        <text x="150" y="166" fill="rgba(37,99,235,0.5)" fontSize="13" fontWeight="600"
          transform="rotate(-5, 170, 160)"
          style={{ fontFamily: "var(--font-heading)" }}>WORD</text>
      </g>

      {/* ── Center card pair (larger, animated flip) ── */}
      <g>
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
        <g className="flash-front">
          <rect x="210" y="100" width="180" height="120" rx="12"
            fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.35)" strokeWidth="1.5"
            filter="url(#flash-glow)" />
          <text x="300" y="168" textAnchor="middle" fill="rgba(37,99,235,0.7)" fontSize="20" fontWeight="700"
            style={{ fontFamily: "var(--font-heading)" }}>WORD</text>
        </g>
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
        <rect x="370" y="120" width="130" height="90" rx="10"
          fill="rgba(6,214,160,0.08)" stroke="rgba(6,214,160,0.2)" strokeWidth="1"
          transform="rotate(5, 435, 165)" />
        <rect x="388" y="148" width="60" height="2.5" rx="1" fill="rgba(6,214,160,0.15)" transform="rotate(5, 435, 165)" />
        <rect x="388" y="158" width="45" height="2.5" rx="1" fill="rgba(6,214,160,0.1)" transform="rotate(5, 435, 165)" />
        <rect x="388" y="168" width="35" height="2.5" rx="1" fill="rgba(6,214,160,0.07)" transform="rotate(5, 435, 165)" />
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
