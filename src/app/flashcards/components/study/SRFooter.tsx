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

  // Khi chưa lật, chỉ hiển thị 1 nút "Show answer"
  if (!flipped) {
    return (
      <footer className="sticky bottom-4 mt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="hidden items-center gap-2 sm:flex">
            <NavBtn onClick={onPrev} title="Câu trước (←)">
              ←
            </NavBtn>
          </div>

          <button
            onClick={onFlip}
            className="h-11 flex-1 rounded-xl bg-slate-900 text-white transition hover:brightness-110 active:scale-[0.99]"
            title="Space"
          >
            Hiện đáp án (Space)
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <NavBtn onClick={onNext} title="Câu tiếp (→)">
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

  // Đã lật: hiện 4 nút SR
  return (
    <footer className="sticky bottom-4 mt-8">
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 rounded-2xl border bg-white/90 p-3 shadow-lg backdrop-blur sm:grid-cols-6">
        {/* Prev (ẩn trên mobile) */}
        <div className="hidden sm:block">
          <NavBtn onClick={onPrev} title="Câu trước (←)">
            ←
          </NavBtn>
        </div>

        {/* 4 mức độ */}
        <SRBtn label="Again" hotkey="1" onClick={() => onGrade("again")} className="bg-red-100 text-red-700 ring-red-200 hover:bg-red-200" />
        <SRBtn label="Hard"  hotkey="2" onClick={() => onGrade("hard")}  className="bg-amber-100 text-amber-800 ring-amber-200 hover:bg-amber-200" />
        <SRBtn label="Good"  hotkey="3" onClick={() => onGrade("good")}  className="bg-emerald-100 text-emerald-800 ring-emerald-200 hover:bg-emerald-200" />
        <SRBtn label="Easy"  hotkey="4" onClick={() => onGrade("easy")}  className="bg-blue-100 text-blue-800 ring-blue-200 hover:bg-blue-200" />

        {/* Next (ẩn trên mobile) */}
        <div className="hidden sm:block">
          <NavBtn onClick={onNext} title="Câu tiếp (→)">
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
      className={`h-11 w-full rounded-xl ring-1 transition active:scale-[0.99] ${className}`}
      title={`${label} (${hotkey})`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <kbd className="rounded border border-current/30 px-1 text-[10px] opacity-70">{hotkey}</kbd>
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
      className="h-11 w-11 rounded-xl border bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
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
    <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between text-xs text-slate-500">
      <div>
        Thẻ {index + 1} / {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleShuffle}
          className={`rounded-full border px-2 py-[2px] transition ${shuffle ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-50"}`}
          title="Bật/Tắt xáo trộn"
        >
          Shuffle
        </button>
      </div>
    </div>
  );
}
