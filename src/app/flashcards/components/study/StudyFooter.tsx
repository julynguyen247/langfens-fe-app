import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Check,
  RotateCcw,
} from "lucide-react";

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
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-indigo-700">
        {index + 1}/{total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="rounded-lg border px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
        >
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Trước
        </button>
        <button
          onClick={onFlip}
          className="rounded-lg border px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
        >
          {flipped ? "Ẩn đáp án" : "Hiện đáp án"}
        </button>
        <button
          onClick={onNext}
          className="rounded-lg border px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
        >
          Tiếp
          <ChevronRight className="ml-1 inline h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAgain}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
        >
          <RotateCcw className="mr-1 inline h-4 w-4" />
          Học lại
        </button>
        <button
          onClick={onKnow}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100"
        >
          <Check className="mr-1 inline h-4 w-4" />
          Đã biết
        </button>
        <button
          onClick={onToggleShuffle}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            shuffle
              ? "border-indigo-400 bg-indigo-50 text-indigo-800"
              : "text-indigo-700 hover:bg-indigo-50"
          }`}
        >
          <Shuffle className="mr-1 inline h-4 w-4" />
          {shuffle ? "Đang trộn" : "Trộn"}
        </button>
      </div>
    </footer>
  );
}
