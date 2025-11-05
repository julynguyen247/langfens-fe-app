"use client";
import { FiGrid, FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Passage = { id: string; label: string; total: number; done: number };

export default function PassageFooter({
  passages,
  currentPassageId,
  onChangePassage,
  onJumpRange,
  onGridClick,
  rangeLabel,
  rangePrevLabel,
}: {
  passages: Passage[];
  currentPassageId: string;
  onChangePassage: (id: string) => void;
  onJumpRange: (dir: "prev" | "next") => void;
  onGridClick: () => void;
  rangeLabel: string;
  rangePrevLabel?: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className=" px-16 py-3 ml-16">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={onGridClick}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Mở answer sheet"
          >
            <FiGrid className="text-lg" />
          </button>

          <div className="flex items-center gap-2  justify-center ">
            {passages.map((p) => {
              const active = p.id === currentPassageId;
              return (
                <button
                  key={p.id}
                  onClick={() => onChangePassage(p.id)}
                  className={`px-3 h-9 rounded-full border text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  title={`${p.label} (${p.done}/${p.total})`}
                >
                  {p.label}{" "}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onJumpRange("prev")}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <FiChevronLeft /> {rangePrevLabel ?? "Prev"}
            </button>
            <button
              onClick={() => onJumpRange("next")}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {rangeLabel} <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
