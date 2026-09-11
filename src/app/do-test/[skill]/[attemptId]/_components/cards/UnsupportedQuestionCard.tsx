import React from "react";

export interface UnsupportedQuestionCardProps {
  backendType: string;
}

export function UnsupportedQuestionCard({ backendType }: UnsupportedQuestionCardProps) {
  return (
    <div
      data-testid="unsupported-question-card"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 my-2 text-amber-900"
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className="material-symbols-rounded text-amber-600">warning</span>
        <span>Unsupported question type: {backendType}</span>
      </div>
      <p className="mt-1 text-sm text-amber-700">
        This question format is not supported by the test runner yet.
      </p>
    </div>
  );
}
