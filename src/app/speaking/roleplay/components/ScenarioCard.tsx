"use client";

import { RoleplayScenario, Difficulty, IeltsPart } from "@/types/speaking";
import { cn } from "@/lib/utils";

interface Props {
  scenario: RoleplayScenario;
  onSelect: (scenario: RoleplayScenario) => void;
  isLoading?: boolean;
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  BAND_5: { label: "Band 5", className: "bg-green-100 text-green-700" },
  BAND_6: { label: "Band 6", className: "bg-yellow-100 text-yellow-700" },
  BAND_7: { label: "Band 7", className: "bg-orange-100 text-orange-700" },
  BAND_8: { label: "Band 8+", className: "bg-red-100 text-red-700" },
};

const partConfig: Record<IeltsPart, { label: string }> = {
  PART_1: { label: "Part 1" },
  PART_2: { label: "Part 2" },
  PART_3: { label: "Part 3" },
  PART_4: { label: "Part 4" },
  SITUATIONAL: { label: "Situational" },
};

export function ScenarioCard({ scenario, onSelect, isLoading }: Props) {
  const difficulty = difficultyConfig[scenario.difficulty];
  const part = partConfig[scenario.ielts_part];

  return (
    <button
      onClick={() => onSelect(scenario)}
      disabled={isLoading}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "bg-white border-gray-200 hover:border-blue-300",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {scenario.title}
            </h3>
            <span className={cn("px-2 py-0.5 text-xs rounded-full shrink-0", difficulty.className)}>
              {difficulty.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {scenario.context}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {part.label}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~{scenario.duration_min} min
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {scenario.turn_count_target} turns
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
