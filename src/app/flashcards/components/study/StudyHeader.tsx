import { X } from "lucide-react";
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
    <header className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-indigo-900">{deckTitle}</h2>
        <p className="text-sm text-indigo-700">
          Thẻ {current}/{total}
        </p>
      </div>
      <button
        onClick={onExit}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
      >
        <X className="h-4 w-4" /> Thoát
      </button>
    </header>
  );
}
