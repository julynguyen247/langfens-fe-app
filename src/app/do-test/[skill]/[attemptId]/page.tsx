// src/app/do-test/[skill]/[attemptId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import PassageView from "./components/reading/PassageView";
import QuestionPanel from "./components/common/QuestionPanel";

type Skill = "reading" | "listening" | "writing";

const MOCK_READING_QUESTIONS = Array.from({ length: 13 }, (_, i) => ({
  id: i + 1,
  stem: `Reading Q${i + 1}: Choose the correct answer.`,
  choices: [
    { value: "A", label: "Option A" },
    { value: "B", label: "Option B" },
    { value: "C", label: "Option C" },
    { value: "D", label: "Option D" },
  ],
}));

const MOCK_LISTENING_QUESTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  stem: `Listening Q${i + 1}: What did the speaker mean?`,
  choices: ["A", "B", "C", "D"],
}));

const MOCK_PASSAGES = [
  {
    id: "p1",
    label: "01–06",
    total: 6,
    done: 3,
    title: "Passage A — The Dawn of AI Tutors",
    content:
      "In recent years, intelligent tutoring systems have emerged as a promising tool...\n\n".repeat(
        50
      ),
  },
  {
    id: "p2",
    label: "07–13",
    total: 7,
    done: 0,
    title: "Passage B — Digital Wellbeing in Study",
    content:
      "Balancing screen time and focused study sessions is increasingly important...\n\n".repeat(
        50
      ),
  },
];

export default function DoTestAttemptPage() {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };

  if (skill === "reading") return <ReadingScreen attemptId={attemptId} />;
  if (skill === "listening") return <ListeningScreen attemptId={attemptId} />;
  if (skill === "writing") return <WritingScreen attemptId={attemptId} />;

  return <div className="p-6">Unknown skill: {String(skill)}</div>;
}

function WritingScreen({ attemptId }: { attemptId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 h-full min-h-0">
      <aside className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Prompt</h3>
          <p className="text-sm text-gray-600 mt-2">
            Hiển thị đề bài, yêu cầu, rubric… (bind theo attemptId:{" "}
            <b>{attemptId}</b>)
          </p>
          <ul className="text-sm text-gray-500 mt-3 list-disc pl-5">
            <li>≥ 250 words (Task 2)</li>
            <li>Thời gian gợi ý: 40 phút</li>
          </ul>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {Array.from({ length: 40 })
              .map(() => "Extra prompt details…")
              .join(" ")}
          </p>
        </div>
      </aside>

      <section className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Your Essay</h3>
          <span className="text-sm text-gray-500">Words: 0</span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <textarea
            className="w-full min-h-[320px] h-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Write your essay here..."
          />
        </div>
        <div className="p-4 border-t text-right">
          <button className="px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:brightness-95">
            Save Draft
          </button>
        </div>
      </section>
    </div>
  );
}

function ReadingScreen({ attemptId }: { attemptId: string }) {
  const [currentPassageId, setCurrentPassageId] = useState("p1");
  const activePassage = useMemo(
    () =>
      MOCK_PASSAGES.find((p) => p.id === currentPassageId) ?? MOCK_PASSAGES[0],
    [currentPassageId]
  );

  return (
    <div className="flex h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden border-r bg-gray-50 ">
        <PassageView
          passage={{
            title: activePassage.title,
            content: activePassage.content,
          }}
        />
      </div>

      <div className="w-[480px] flex flex-col h-full min-h-0 overflow-hidden ">
        <div className="border-b p-4 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            Questions {activePassage.label}
          </h2>
        </div>
        <div className="flex-1 min-h-0 ">
          <QuestionPanel
            attemptId={attemptId}
            questions={MOCK_READING_QUESTIONS}
          />
        </div>
      </div>
    </div>
  );
}

function ListeningScreen({ attemptId }: { attemptId: string }) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow overflow-hidden">
      <div className="border-b p-4 bg-gray-50 sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Listening Section
        </h2>
        <div className="rounded-lg border bg-white p-3 text-sm text-gray-600 flex items-center justify-between">
          <span>
            🎧 AudioPlayer placeholder — bind with attemptId: <b>{attemptId}</b>
          </span>
          <button className="text-blue-600 text-sm font-medium hover:underline">
            Replay
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-6">
        <QuestionPanel
          attemptId={attemptId}
          questions={MOCK_LISTENING_QUESTIONS}
        />
      </div>
    </div>
  );
}
