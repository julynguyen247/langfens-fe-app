"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "../components/ChatInterface";
import { useRoleplaySession } from "@/hooks/useRoleplaySession";
import { RoleplayScenario } from "@/types/speaking";
import { MOCK_SCENARIOS } from "../mockData";
import { cn } from "@/lib/utils";

export default function RoleplaySessionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Find the scenario by slug
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Find scenario from mock data (in production, fetch from API)
    const found = MOCK_SCENARIOS.find((s: RoleplayScenario) => s.slug === slug);
    if (found) {
      setScenario(found);
    }
    setIsLoading(false);
  }, [slug]);

  const {
    messages,
    isLoading: isSessionLoading,
    isSessionEnded,
    sendMessage,
    turnCount,
  } = useRoleplaySession({
    scenario: scenario!,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Scenario not found
          </h2>
          <button
            onClick={() => router.push("/speaking/roleplay")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/speaking/roleplay")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {scenario.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Turn {turnCount} of {scenario.turn_count_target}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  scenario.difficulty === "BAND_5" && "bg-green-100 text-green-700",
                  scenario.difficulty === "BAND_6" && "bg-yellow-100 text-yellow-700",
                  scenario.difficulty === "BAND_7" && "bg-orange-100 text-orange-700",
                  scenario.difficulty === "BAND_8" && "bg-red-100 text-red-700"
                )}
              >
                {scenario.difficulty.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (turnCount / scenario.turn_count_target) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scenario info */}
      <div className="bg-blue-50 border-b shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Your role:</span> {scenario.user_role}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">AI role:</span> {scenario.agent_role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          onRecordingChange={setIsRecording}
          isRecording={isRecording}
          disabled={isSessionLoading}
        />
      </div>

      {/* Session ended modal */}
      {isSessionEnded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Session Complete!
              </h2>
              <p className="text-gray-600">
                Great job completing this roleplay scenario. You had{" "}
                {turnCount} turns.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-medium text-gray-900">Target Vocabulary:</h3>
              <div className="flex flex-wrap gap-2">
                {scenario.target_vocabulary.map((word) => (
                  <span
                    key={word}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/speaking/roleplay")}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Back to Scenarios
              </button>
              <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                View Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
