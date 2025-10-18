// app/do-test/[skill]/[attemptId]/layout.tsx
"use client";

import { useParams } from "next/navigation";
import TopBar from "./components/common/TopBar";
import TimerDisplay from "./components/common/TimerDisplay";
import QuestionNav from "./components/common/QuestionNav";
import PassageFooter from "./components/reading/PassageFooter";

type Skill = "reading" | "listening" | "writing";

export default function DoTestAttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };

  const BOTTOM_SAFE_SPACE = "pb-[136px]";

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden">
      <TopBar
        title={`Làm bài ${skill[0].toUpperCase() + skill.slice(1)}`}
        subtitle={`IELTS Online Test · ${attemptId.slice(0, 6)}...`}
        rightSlot={<TimerDisplay initialSeconds={75 * 60} />}
      />
      <main className={`flex-1 min-h-0 w-full mx-auto overflow-y-auto `}>
        {children}
      </main>

      <div className="border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl  py-3 mb-16">
          <QuestionNav
            total={13}
            current={1}
            attemptId={attemptId}
            skill={skill}
          />
        </div>
      </div>

      <PassageFooter
        passages={[
          {
            id: "s1",
            label: skill === "reading" ? "Passage 1" : "Section 1",
            total: 13,
            done: 4,
          },
          {
            id: "s2",
            label: skill === "reading" ? "Passage 2" : "Section 2",
            total: 13,
            done: 0,
          },
          {
            id: "s3",
            label: skill === "reading" ? "Passage 3" : "Section 3",
            total: 13,
            done: 0,
          },
        ]}
        currentPassageId="s1"
        onChangePassage={(id) => console.log("change section", id)}
        onJumpRange={(dir) => console.log("jump", dir)}
        onGridClick={() => console.log("open answer sheet")}
        rangeLabel="07–13"
        rangePrevLabel="01–06"
      />
    </div>
  );
}
