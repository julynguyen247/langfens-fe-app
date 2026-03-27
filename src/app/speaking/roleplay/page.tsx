"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScenarioCard } from "./components/ScenarioCard";
import { useRoleplayScenarios } from "@/hooks/useRoleplayScenarios";
import { MOCK_SCENARIOS } from "./mockData";
import { RoleplayScenario } from "@/types/speaking";
import { cn } from "@/lib/utils";

export default function RoleplayPage() {
  const router = useRouter();
  const { scenarios, isLoading, error } = useRoleplayScenarios();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  // Use mock data in development, real data in production
  const displayScenarios = scenarios.length > 0 ? scenarios : MOCK_SCENARIOS;

  const filteredScenarios = selectedDifficulty
    ? displayScenarios.filter((s) => s.difficulty === selectedDifficulty)
    : displayScenarios;

  const handleScenarioSelect = (scenario: RoleplayScenario) => {
    // Navigate to the session page with the scenario slug
    router.push(`/speaking/roleplay/${scenario.slug}`);
  };

  const difficultyFilters = [
    { value: null, label: "All Levels" },
    { value: "BAND_5", label: "Band 5" },
    { value: "BAND_6", label: "Band 6" },
    { value: "BAND_7", label: "Band 7" },
    { value: "BAND_8", label: "Band 8+" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Speaking Roleplay
              </h1>
              <p className="text-sm text-gray-500">
                Practice real IELTS speaking scenarios with an AI partner
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {difficultyFilters.map((filter) => (
              <button
                key={filter.value ?? "all"}
                onClick={() => setSelectedDifficulty(filter.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedDifficulty === filter.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Scenarios grid */}
        {!isLoading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onSelect={handleScenarioSelect}
                />
              ))}
            </div>

            {filteredScenarios.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500">No scenarios found for this level</p>
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  View all scenarios
                </button>
              </div>
            )}
          </>
        )}

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            How Roleplay Practice Works
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium shrink-0">
                1
              </span>
              <span>Choose a scenario that matches your target band score</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium shrink-0">
                2
              </span>
              <span>Practice with the AI interviewer - respond naturally as you would in the real test</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium shrink-0">
                3
              </span>
              <span>Get feedback on your vocabulary, grammar, and fluency after completing the session</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
