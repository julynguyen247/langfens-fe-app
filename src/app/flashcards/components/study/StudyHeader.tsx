export default function StudyHeader({
  deckTitle,
  current,
  total,
  onExit,
}: {
  deckTitle: string;
  current: number;
  total: number;
  onExit: () => void;
}) {
  return (
    <header className="flex items-center justify-between rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div>
        <h2
          className="text-lg font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {deckTitle}
        </h2>
        <p
          className="text-sm font-bold text-[var(--primary)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Card {current}/{total}
        </p>
      </div>
      <button
        onClick={onExit}
        className="inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--border)] border-b-[5px] px-4 py-1.5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
      >
        Exit
      </button>
    </header>
  );
}
