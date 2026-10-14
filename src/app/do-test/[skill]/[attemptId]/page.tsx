"use client";

import { useParams } from "next/navigation";
import { useAttemptStore } from "@/stores/useAttemptStore";

import { ReadingScreen } from "./screens/ReadingScreen";
import { ListeningScreen } from "./screens/ListeningScreen";
import { SpeakingScreen } from "./screens/SpeakingScreen";
import { WritingScreen } from "./screens/WritingScreen";

type Skill = "reading" | "listening" | "writing" | "speaking";

export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p className="text-sm text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Loading test... If you refreshed, please go back and re-enter.
        </p>
      </div>
    );
  }

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  if (skill === "speaking") return <SpeakingScreen attemptId={attemptId} />;
  if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6 text-[var(--text-muted)]">Unknown skill: {String(skill)}</div>;
}

export { ReadingScreen } from "./screens/ReadingScreen";
