"use client";

import { useEffect, useState } from "react";
import { RagFeedbackCard } from "@/components/rag/RagFeedbackCard";
import type { RagFeedbackEnvelope } from "@/types/rag";

export default function ListeningFeedbackPage() {
  const [envelope, setEnvelope] = useState<RagFeedbackEnvelope | null>(null);

  useEffect(() => {
    setEnvelope({
      item_id: "sample-listening-item",
      domain: "listening",
      overall_band: 7.0,
      criteria: [
        {
          name: "comprehension",
          band: 7.0,
          comment: "Static sample. Wire to /api-listening/explain-item later.",
          evidence_ids: ["transcript:sample-listening-item:quote"],
        },
      ],
      evidence: [
        {
          id: "transcript:sample-listening-item:quote",
          text: "The library closes at six.",
          source: "transcript:inline",
          relevance: 1.0,
        },
      ],
      suggestions: [
        { text: "Listen for numbers carefully.", target: "comprehension" },
      ],
    });
  }, []);

  if (!envelope) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-3xl font-black text-slate-900">
        Listening feedback
      </h1>
      <RagFeedbackCard envelope={envelope} />
    </div>
  );
}
