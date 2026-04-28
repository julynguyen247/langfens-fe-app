export default function StudyFooter({
  flipped,
  onFlip,
  onPrev,
  onNext,
  onAgain,
  onKnow,
  index,
  total,
  shuffle,
  onToggleShuffle,
}: {
  flipped: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAgain: () => void;
  onKnow: () => void;
  index: number;
  total: number;
  shuffle: boolean;
  onToggleShuffle: () => void;
}) {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div
        className="text-sm font-bold text-[var(--primary)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {index + 1}/{total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="rounded-full border-[3px] border-[var(--border)] border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
        >
          Prev
        </button>
        <button
          onClick={onFlip}
          className="rounded-full border-[3px] border-[var(--border)] border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
        >
          {flipped ? "Hide Answer" : "Show Answer"}
        </button>
        <button
          onClick={onNext}
          className="rounded-full border-[3px] border-[var(--border)] border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
        >
          Next
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAgain}
          className="rounded-full border-[3px] border-[var(--destructive)]/30 border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--destructive)] hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
        >
          Don&apos;t Know
        </button>
        <button
          onClick={onKnow}
          className="rounded-full border-[3px] border-[var(--skill-speaking)]/30 border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--skill-speaking)] hover:bg-[var(--skill-speaking-light)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
        >
          Know
        </button>
        <button
          onClick={onToggleShuffle}
          className={`rounded-full border-[3px] border-b-[5px] px-3 py-1.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] ${
            shuffle
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }`}
        >
          {shuffle ? "Shuffled" : "Shuffle"}
        </button>
      </div>
    </footer>
  );
}
