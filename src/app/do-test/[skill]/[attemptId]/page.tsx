"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PassageView from "./components/reading/PassageView";
import QuestionPanel from "./components/common/QuestionPanel";
import { useAttemptStore } from "@/app/store/useAttemptStore";

type Skill = "reading" | "listening" | "writing";

export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  if (!attempt)
    return (
      <div className="p-6">Không có dữ liệu đề. Hãy quay lại và Start lại.</div>
    );

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  // if (skill === "writing") return <WritingScreen attemptId={attemptId} />;
  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

function ReadingScreen({ attemptId }: { attemptId: string }) {
  const attempt = useAttemptStore((s) => s.byId[attemptId])!;
  const sections = useMemo(
    () => [...(attempt.paper.sections ?? [])].sort((a, b) => a.idx - b.idx),
    [attempt.paper.sections]
  );

  const sp = useSearchParams();
  const secFromUrl = sp.get("sec");
  const activeSec = sections.find((s) => s.id === secFromUrl) ?? sections[0];

  const panelQuestions = useMemo(
    () =>
      (activeSec?.questions ?? [])
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .map((q) => ({
          id: String(q.idx),
          stem: q.promptMd,
          choices: (q.options ?? [])
            .slice()
            .sort((a, b) => a.idx - b.idx)
            .map((op) => ({ value: String(op.idx), label: op.contentMd })),
        })),
    [activeSec]
  );

  if (!activeSec) {
    return <div className="p-6">Không tìm thấy section.</div>;
  }

  return (
    <div className="flex h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden border-r bg-gray-50">
        <PassageView
          passage={{
            title: activeSec.title,
            content: activeSec.instructionsMd,
          }}
        />
      </div>
      <div className="w-[480px] flex flex-col h-full min-h-0 overflow-hidden">
        <div className="border-b p-4 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <QuestionPanel attemptId={attemptId} questions={panelQuestions} />
        </div>
      </div>
    </div>
  );
}

function ListeningScreen({ attemptId }: { attemptId: string }) {
  const attempt = useAttemptStore((s) => s.byId[attemptId])!;
  const qs = attempt.paper.sections
    .flatMap((s) => s.questions ?? [])
    .filter((q) => q.skill?.toLowerCase() === "listening");

  const panelQuestions = qs
    .sort((a, b) => a.idx - b.idx)
    .map((q) => ({
      id: q.id,
      stem: q.promptMd,
      choices: (q.options ?? [])
        .sort((a, b) => a.idx - b.idx)
        .map((op) => ({ value: String(op.idx), label: op.contentMd })),
    }));

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden p-6">
      <QuestionPanel attemptId={attemptId} questions={panelQuestions} />
    </div>
  );
}

function WritingScreen() {
  return <div className="p-6">Bind prompt viết từ sections nếu có.</div>;
}
