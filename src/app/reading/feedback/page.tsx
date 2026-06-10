"use client";

import { useEffect, useState } from "react";
import { RagFeedbackCard } from "@/components/rag/RagFeedbackCard";
import type { RagFeedbackEnvelope } from "@/types/rag";

export default function ReadingFeedbackPage() {
  const [envelope, setEnvelope] = useState<RagFeedbackEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, render a static sample envelope so the page is testable.
    // Real wiring (gateway call, route params) is out of scope for this plan.
    setEnvelope({
      item_id: "sample-reading-item",
      domain: "reading",
      overall_band: 6.5,
      criteria: [
        {
          name: "comprehension",
          band: 6.5,
          comment: "Static sample. Wire to /api-reading/explain-item later.",
          evidence_ids: ["passage:sample-reading-item:quote"],
        },
      ],
      evidence: [
        {
          id: "passage:sample-reading-item:quote",
          text: "The library opens at nine.",
          source: "passage:inline",
          relevance: 1.0,
        },
      ],
      suggestions: [
        { text: "Re-read paragraph 1 carefully.", target: "comprehension" },
      ],
    });
  }, []);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!envelope) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-3xl font-black text-slate-900">
        Reading feedback
      </h1>
      <RagFeedbackCard envelope={envelope} />
    </div>
  );
}
