// app/do-test/[skill]/[attemptId]/layout.tsx
"use client";

import { useMemo } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import TopBar from "./components/common/TopBar";
import TimerDisplay from "./components/common/TimerDisplay";
import QuestionNav from "./components/common/QuestionNav";
import PassageFooter from "./components/reading/PassageFooter";
import { useAttemptStore } from "@/app/store/useAttemptStore";

type Skill = "reading" | "listening" | "writing";

function getDeadlineMs(
  startedAt: string,
  durationSec: number,
  timeLeft?: number
) {
  if (Number.isFinite(timeLeft) && (timeLeft ?? 0) > 0) {
    return Date.now() + (timeLeft as number) * 1000;
  }
  return new Date(startedAt).getTime() + durationSec * 1000;
}

export default function DoTestAttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { skill, attemptId } = useParams() as {
    skill: Skill;
    attemptId: string;
  };
  const attempt = useAttemptStore((s) => s.byId[attemptId]);

  const initialSeconds = useMemo(() => {
    if (!attempt) return 0;
    const dl = getDeadlineMs(
      attempt.startedAt,
      attempt.durationSec,
      attempt.timeLeft
    );
    return Math.max(0, Math.floor((dl - Date.now()) / 1000));
  }, [attempt]);

  const passages = useMemo(() => {
    if (!attempt) return [];
    return [...attempt.paper.sections]
      .sort((a, b) => a.idx - b.idx)
      .map((sec) => {
        const qs = [...(sec.questions ?? [])].sort((a, b) => a.idx - b.idx);
        const total = qs.length;
        const start = total ? qs[0].idx : sec.idx;
        const label = total
          ? `${String(start).padStart(2, "0")}–${String(
              start + total - 1
            ).padStart(2, "0")}`
          : `S${sec.idx}`;
        return { id: sec.id, label, total, done: 0 };
      });
  }, [attempt]);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const currentSecId = sp.get("sec") ?? passages[0]?.id ?? "";

  const currentIndex = Math.max(
    0,
    passages.findIndex((p) => p.id === currentSecId)
  );
  const currentPassage = passages[currentIndex] ?? passages[0];

  const gotoSection = (id: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("sec", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const jumpRange = (dir: "prev" | "next") => {
    if (!passages.length) return;
    const nextIdx =
      dir === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(passages.length - 1, currentIndex + 1);
    gotoSection(passages[nextIdx].id);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden">
      <TopBar
        title={`Làm bài ${skill[0].toUpperCase() + skill.slice(1)}`}
        subtitle={
          attempt
            ? `IELTS Online Test · ${attempt.attemptId.slice(0, 6)}...`
            : "—"
        }
        rightSlot={<TimerDisplay initialSeconds={initialSeconds} />}
      />

      <main className="flex-1 min-h-0 w-full mx-auto overflow-y-auto">
        {!attempt ? (
          <div className="p-6 text-slate-600">
            Không có dữ liệu đề trong phiên. Vui lòng quay lại trang trước và
            bấm Start lại.
          </div>
        ) : (
          children
        )}
      </main>

      {!!attempt && (
        <>
          {/* <div className="border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="mx-auto max-w-6xl py-3 mb-16">
              <QuestionNav
                total={currentPassage?.total ?? 0}
                current={1}
                attemptId={attempt.attemptId}
                skill={skill}
              />
            </div>
          </div> */}

          <PassageFooter
            passages={passages}
            currentPassageId={currentSecId}
            onChangePassage={(id) => gotoSection(id)}
            onJumpRange={(dir) => jumpRange(dir)}
            onGridClick={() => console.log("open answer sheet")}
            rangeLabel={currentPassage?.label ?? ""}
            rangePrevLabel={passages[currentIndex - 1]?.label ?? ""}
          />
        </>
      )}
    </div>
  );
}
