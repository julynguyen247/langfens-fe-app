"use client";

type CriteriaItem = {
  name: string;
  score: number;
};

type ScoreHeaderProps = {
  band: number;
  criteria: CriteriaItem[];
  skill?: "writing" | "speaking";
};

export function ScoreHeader({ band, criteria, skill = "writing" }: ScoreHeaderProps) {
  const skillLabel = skill === "writing" ? "Writing Assessment" : "Speaking Assessment";

  return (
    <div className="bg-white border-b border-[var(--border)] p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: The Big Score */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              {skillLabel}
            </span>
          </div>
          <div className="text-8xl font-sans font-bold leading-none" style={{ color: 'var(--primary)' }}>
            {band.toFixed(1)}
          </div>
          <p className="mt-2 text-[10px] tracking-[0.25em] text-[var(--text-muted)]">
            Overall Band Score
          </p>
        </div>

        {/* Right: Criteria Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {criteria.map((item) => (
            <div
              key={item.name}
              className="bg-[var(--background)] border-[3px] border-[var(--border)] p-4 rounded-[1.5rem] text-center min-w-[100px] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            >
              <p className="text-[10px] font-bold text-[var(--text-muted)] mb-1 leading-tight">
                {item.name}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{item.score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
