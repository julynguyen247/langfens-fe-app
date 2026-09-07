"use client";

interface TopBarProps {
  title: string;
  category: string;
  timeRemainingSeconds: number;
  isSubmitted: boolean;
  estimatedBand?: number | null;
  totalScore?: number | null;
  maxScore?: number | null;
  answeredCount?: number;
  totalQuestions?: number;
  onOpenScoreModal?: () => void;
  onSubmitExam: () => void;
  onExit: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TopBar({
  title,
  category,
  timeRemainingSeconds,
  isSubmitted,
  estimatedBand,
  totalScore,
  maxScore,
  answeredCount = 0,
  totalQuestions = 0,
  onOpenScoreModal,
  onSubmitExam,
  onExit,
}: TopBarProps) {
  const isUrgent = !isSubmitted && timeRemainingSeconds <= 300; // Under 5 mins
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <header className="fixed top-0 inset-x-0 h-16 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 flex items-center justify-between px-6 select-none font-sans shadow-xs">
      {/* Left: Exit & Title */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onExit}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          title="Exit test"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-sm md:max-w-md">
              {title}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wider shrink-0">
              {category}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Progress / Timer or Review Mode */}
      <div className="flex items-center gap-4">
        {/* Progress pill if not submitted */}
        {!isSubmitted && totalQuestions > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <span className="text-[#2563EB] font-mono">
              {answeredCount}/{totalQuestions}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-mono">{progressPercent}%</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Review Mode</span>
            {estimatedBand !== undefined && estimatedBand !== null && (
              <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md ml-1 border border-emerald-200">
                Band {estimatedBand.toFixed(1)} ({totalScore}/{maxScore})
              </span>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-bold border-2 transition ${
              isUrgent
                ? "bg-rose-50 border-rose-400 text-rose-700 animate-pulse"
                : "bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Right: Submit or Score report button */}
      <div className="flex items-center gap-3">
        {isSubmitted ? (
          <button
            type="button"
            onClick={onOpenScoreModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs border-b-[3px] border-[#1E40AF] active:translate-y-0.5 transition-all"
          >
            Score Summary
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitExam}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs border-b-[4px] border-[#1E40AF] active:translate-y-0.5 transition-all"
          >
            Submit Exam
          </button>
        )}
      </div>
    </header>
  );
}
