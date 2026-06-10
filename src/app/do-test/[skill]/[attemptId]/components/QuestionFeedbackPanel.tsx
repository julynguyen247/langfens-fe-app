"use client";

import { RagFeedbackCard } from "@/components/rag/RagFeedbackCard";
import type { RagFeedbackEnvelope } from "@/types/rag";

export function QuestionFeedbackPanel({
  envelope,
}: {
  envelope?: RagFeedbackEnvelope;
}) {
  if (!envelope) return null;
  return (
    <div className="mt-4">
      <RagFeedbackCard envelope={envelope} />
    </div>
  );
}
