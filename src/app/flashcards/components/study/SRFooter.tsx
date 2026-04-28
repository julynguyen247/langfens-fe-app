// app/flashcards/components/study/SRFooter.tsx
"use client";

type Grade = "again" | "hard" | "good" | "easy";

export default function SRFooter(props: {
  flipped: boolean;
  onFlip: () => void;
  onGrade: (g: Grade) => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
  shuffle?: boolean;
  onToggleShuffle?: () => void;
}) {
  const {
    flipped,
    onFlip,
    onGrade,
    onPrev,
    onNext,
    index,
    total,
    shuffle,
    onToggleShuffle,
  } = props;

  // When not flipped, show a single "Show answer" button
  if (!flipped) {
    return (
      <footer className="sticky bottom-4 mt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-3 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
          <div className="hidden items-center gap-2 sm:flex">
            <NavBtn onClick={onPrev} title="Previous card">
              ←
            </NavBtn>
          </div>

          <button
            onClick={onFlip}
            className="h-11 flex-1 rounded-full border-b-[4px] border-[var(--primary-dark)] bg-[var(--primary)] font-bold text-white transition-all hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
            title="Space"
          >
            Show Answer (Space)
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <NavBtn onClick={onNext} title="Next card">
              →
            </NavBtn>
          </div>
        </div>

        <BarBottomMeta
          index={index}
          total={total}
          shuffle={!!shuffle}
          onToggleShuffle={onToggleShuffle}
        />
      </footer>
    );
  }

  // Flipped: show 4 SR grade ghost buttons
  return (
    <footer className="sticky bottom-4 mt-8">
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-3 shadow-[0_4px_0_rgba(0,0,0,0.08)] sm:grid-cols-6">
        {/* Prev (hidden on mobile) */}
        <div className="hidden sm:block">
          <NavBtn onClick={onPrev} title="Previous card">
            ←
          </NavBtn>
        </div>

        {/* 4 grade levels - ghost button style */}
        <SRBtn label="Again" hotkey="1" onClick={() => onGrade("again")} className="bg-white text-[var(--destructive)] border-[3px] border-[var(--destructive)]/30 border-b-[5px] hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]" />
        <SRBtn label="Hard"  hotkey="2" onClick={() => onGrade("hard")}  className="bg-white text-[var(--accent-gold)] border-[3px] border-[var(--accent-gold)]/30 border-b-[5px] hover:bg-[var(--skill-writing-light)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]" />
        <SRBtn label="Good"  hotkey="3" onClick={() => onGrade("good")}  className="bg-white text-[var(--skill-speaking)] border-[3px] border-[var(--skill-speaking)]/30 border-b-[5px] hover:bg-[var(--skill-speaking-light)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]" />
        <SRBtn label="Easy"  hotkey="4" onClick={() => onGrade("easy")}  className="bg-white text-[var(--primary)] border-[3px] border-[var(--primary)]/30 border-b-[5px] hover:bg-[var(--primary-light)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]" />

        {/* Next (hidden on mobile) */}
        <div className="hidden sm:block">
          <NavBtn onClick={onNext} title="Next card">
            →
          </NavBtn>
        </div>
      </div>

      <BarBottomMeta
        index={index}
        total={total}
        shuffle={!!shuffle}
        onToggleShuffle={onToggleShuffle}
      />
    </footer>
  );
}

/** ===== Sub components ===== */
function SRBtn({
  label,
  hotkey,
  onClick,
  className = "",
}: {
  label: string;
  hotkey: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 w-full rounded-full transition-all ${className}`}
      title={`${label} (${hotkey})`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold">{label}</span>
        <kbd className="rounded-full border-[2px] border-current/30 px-1.5 text-[10px] font-bold opacity-70">{hotkey}</kbd>
      </div>
    </button>
  );
}

function NavBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-11 w-11 rounded-full border-[3px] border-[var(--border)] border-b-[5px] bg-white font-bold text-[var(--foreground)] shadow-[0_2px_0_rgba(0,0,0,0.08)] transition-all hover:bg-[var(--background)] hover:border-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]"
    >
      {children}
    </button>
  );
}

function BarBottomMeta({
  index,
  total,
  shuffle,
  onToggleShuffle,
}: {
  index: number;
  total: number;
  shuffle: boolean;
  onToggleShuffle?: () => void;
}) {
  return (
    <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between text-xs font-bold text-[var(--text-muted)]">
      <div style={{ fontFamily: "var(--font-mono)" }}>
        {index + 1} / {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleShuffle}
          className={`rounded-full border-[3px] border-b-[5px] px-3 py-[2px] font-bold transition-all hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] ${shuffle ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)]"}`}
          title="Toggle shuffle"
        >
          Shuffle
        </button>
      </div>
    </div>
  );
}
