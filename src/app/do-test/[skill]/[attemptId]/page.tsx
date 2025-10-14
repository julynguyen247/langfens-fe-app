// src/app/do-test/[skill]/[attemptId]/page.tsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PassageView from "./components/reading/PassageView";
import QuestionPanel from "./components/common/QuestionPanel";
import QuestionNav from "./components/common/QuestionNav";
import PassageFooter from "./components/reading/PassageFooter";

type Skill = "reading" | "listening" | "writing";

/* -------------------------- MOCK DATA -------------------------- */
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
      "In recent years, intelligent tutoring systems have emerged as a promising tool...",
  },
  {
    id: "p2",
    label: "07–13",
    total: 7,
    done: 0,
    title: "Passage B — Digital Wellbeing in Study",
    content:
      "Balancing screen time and focused study sessions is increasingly important...",
  },
];

/* -------------------------- PAGE ENTRY -------------------------- */
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

function ReadingScreen({ attemptId }: { attemptId: string }) {
  const searchParams = useSearchParams();
  const qParam = Number(searchParams.get("q"));
  const currentFromURL = Number.isFinite(qParam) && qParam >= 1 ? qParam : 1;

  const [passages, setPassages] = useState(
    MOCK_PASSAGES.map(({ id, label, total, done }) => ({
      id,
      label,
      total,
      done,
    }))
  );
  const [currentPassageId, setCurrentPassageId] = useState("p1");

  const activePassage = useMemo(
    () =>
      MOCK_PASSAGES.find((p) => p.id === currentPassageId) ?? MOCK_PASSAGES[0],
    [currentPassageId]
  );

  const handleChangePassage = (id: string) => setCurrentPassageId(id);
  const handleJumpRange = (dir: "prev" | "next") => {
    const idx = MOCK_PASSAGES.findIndex((p) => p.id === currentPassageId);
    if (idx === -1) return;
    const nextIdx =
      dir === "prev"
        ? Math.max(0, idx - 1)
        : Math.min(MOCK_PASSAGES.length - 1, idx + 1);
    setCurrentPassageId(MOCK_PASSAGES[nextIdx].id);
  };
  const handleGridClick = () => alert("Open Answer Sheet (mock)");

  return (
    <div className="flex flex-col bg-white rounded-xl shadow overflow-hidden">
      {/* --- Nội dung chính: Passage bên trái, Question bên phải --- */}
      <div className="flex flex-1 min-h-[70vh]">
        {/* Passage (trái) */}
        <div className="flex-1 border-r p-6 overflow-y-auto bg-gray-50">
          <PassageView
            passage={{
              title: activePassage?.title ?? "Passage",
              content: activePassage?.content ?? "",
            }}
          />
        </div>

        {/* Questions (phải) */}
        <div className="w-[480px] flex flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Questions {activePassage?.label}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <QuestionPanel
              attemptId={attemptId}
              questions={MOCK_READING_QUESTIONS}
            />
          </div>
          <div className="border-t bg-gray-50 p-3">
            <QuestionNav
              skill="reading"
              attemptId={attemptId}
              total={MOCK_READING_QUESTIONS.length}
              current={currentFromURL}
            />
          </div>
        </div>
      </div>

      <div className="border-t bg-white p-3">
        <PassageFooter
          passages={passages}
          currentPassageId={currentPassageId}
          onChangePassage={handleChangePassage}
          onJumpRange={handleJumpRange}
          onGridClick={handleGridClick}
          rangeLabel="07–13"
          rangePrevLabel="01–06"
        />
      </div>
    </div>
  );
}

/* ------------------------ Listening ------------------------ */
function ListeningScreen({ attemptId }: { attemptId: string }) {
  const searchParams = useSearchParams();
  const qParam = Number(searchParams.get("q"));
  const currentFromURL = Number.isFinite(qParam) && qParam >= 1 ? qParam : 1;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow overflow-hidden min-h-[80vh]">
      <div className="border-b p-4 bg-gray-50">
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

      <div className="flex-1 overflow-y-auto p-6">
        <QuestionPanel
          attemptId={attemptId}
          questions={MOCK_LISTENING_QUESTIONS}
        />
      </div>

      <div className="border-t bg-gray-50 p-3 sticky bottom-0">
        <QuestionNav
          skill="listening"
          attemptId={attemptId}
          total={MOCK_LISTENING_QUESTIONS.length}
          current={currentFromURL}
        />
      </div>
    </div>
  );
}

function WritingScreen({ attemptId }: { attemptId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
      <aside className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold">Prompt</h3>
        <p className="text-sm text-gray-600 mt-2">
          Hiển thị đề bài, yêu cầu, rubric… (bind theo attemptId:{" "}
          <b>{attemptId}</b>)
        </p>
        <ul className="text-sm text-gray-500 mt-3 list-disc pl-5">
          <li>≥ 250 words (Task 2)</li>
          <li>Thời gian gợi ý: 40 phút</li>
        </ul>
      </aside>

      <section className="bg-white rounded-xl shadow p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Your Essay</h3>
          <span className="text-sm text-gray-500">Words: 0</span>
        </div>
        <textarea
          className="w-full h-[420px] rounded-lg border p-3 outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="Write your essay here..."
        />
        <div className="mt-3 text-right">
          <button className="px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:brightness-95">
            Save Draft
          </button>
        </div>
      </section>
    </div>
  );
}
