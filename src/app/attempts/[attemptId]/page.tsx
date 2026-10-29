"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAttemptResult } from "./hooks/useAttemptResult";
import { WritingResultView } from "./components/WritingResultView";
import { SpeakingResultView } from "./components/SpeakingResultView";
import { AttemptReview } from "@/features/exam/components/AttemptReview";

function SubjectiveResult({ attemptId, source }: { attemptId: string; source: "writing" | "speaking" }) {
  const router = useRouter();
  const { attemptData, writingDetail, speakingDetail, loading } = useAttemptResult(attemptId, source);
  if (loading) return <p role="status" className="p-8 text-center">Loading results...</p>;
  if (!attemptData) return <div className="p-8 text-center space-y-4"><p>No results found.</p><button type="button" className="rounded-full border px-4 py-2" onClick={() => router.push("/history")}>Back to history</button></div>;
  if (source === "writing" && writingDetail) return <WritingResultView attemptData={attemptData} writingDetail={writingDetail} attemptId={attemptId} />;
  const overallBand = attemptData.bandScore ?? attemptData.writingBand ?? attemptData.speakingBand;
  return <SpeakingResultView attemptData={attemptData} speakingDetail={speakingDetail} overallBand={overallBand} headerTitle={source === "writing" ? "Writing Result" : "Speaking Result"} />;
}

export default function AttemptResultPage() {
  const { attemptId } = useParams() as { attemptId: string };
  const source = useSearchParams().get("source");
  return source === "writing" || source === "speaking"
    ? <SubjectiveResult key={attemptId} attemptId={attemptId} source={source} />
    : <AttemptReview key={attemptId} attemptId={attemptId} />;
}
