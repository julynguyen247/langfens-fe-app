"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { PageSource } from "./types";
import { useAttemptResult } from "./hooks/useAttemptResult";
import { AttemptResultView } from "./components/AttemptResultView";
import { WritingResultView } from "./components/WritingResultView";
import { SpeakingResultView } from "./components/SpeakingResultView";

export default function AttemptResultPage() {
  const { attemptId } = useParams() as { attemptId: string };
  const searchParams = useSearchParams();
  const source = (searchParams.get("source") ?? "attempt") as PageSource;
  const router = useRouter();

  const {
    attemptData,
    writingDetail,
    speakingDetail,
    loading,
    activeSkill,
    setActiveSkill,
  } = useAttemptResult(attemptId, source);

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p
          className="text-base font-bold text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Loading results...
        </p>
      </div>
    );

  if (!attemptData)
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <p className="text-base text-[var(--text-muted)]">
          No results found.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Go Home
        </button>
      </div>
    );

  const overallBand =
    attemptData.bandScore ??
    attemptData.writingBand ??
    attemptData.speakingBand;

  const headerTitle =
    source === "attempt"
      ? "IELTS Result"
      : source === "writing"
      ? "Writing Result"
      : "Speaking Result";

  if (source === "attempt") {
    return (
      <AttemptResultView
        attemptData={attemptData}
        activeSkill={activeSkill}
        setActiveSkill={setActiveSkill}
        overallBand={overallBand}
      />
    );
  }

  if (source === "writing" && writingDetail) {
    return (
      <WritingResultView
        attemptData={attemptData}
        writingDetail={writingDetail}
        attemptId={attemptId}
      />
    );
  }

  return (
    <SpeakingResultView
      attemptData={attemptData}
      speakingDetail={speakingDetail}
      overallBand={overallBand}
      headerTitle={headerTitle}
    />
  );
}
