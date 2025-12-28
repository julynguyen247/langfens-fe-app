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

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

export function ScoreHeader({ band, criteria, skill = "writing" }: ScoreHeaderProps) {
  const skillIcon = skill === "writing" ? "edit_note" : "mic";
  const skillLabel = skill === "writing" ? "Writing Assessment" : "Speaking Assessment";

  return (
    <div className="bg-white border-b border-slate-200 p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: The Big Score */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <Icon name={skillIcon} className="text-xl text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {skillLabel}
            </span>
          </div>
          <div className="text-8xl font-serif font-bold text-[#3B82F6] leading-none">
            {band.toFixed(1)}
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Overall Band Score
          </p>
        </div>

        {/* Right: Criteria Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {criteria.map((item) => (
            <div
              key={item.name}
              className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-center min-w-[100px]"
            >
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 leading-tight">
                {item.name}
              </p>
              <p className="text-2xl font-bold text-slate-800">{item.score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
