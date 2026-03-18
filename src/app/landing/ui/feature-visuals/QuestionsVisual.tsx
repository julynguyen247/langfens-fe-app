"use client";

export function QuestionsVisual() {
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

  const primaryHighlight = new Set([0, 5, 7, 10]);
  const accentHighlight = new Set([2, 6, 9]);

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
