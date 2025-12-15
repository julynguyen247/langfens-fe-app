"use client";

import { useMemo, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import TopBar from "./components/common/TopBar";
import TimerDisplay from "./components/common/TimerDisplay";
import PassageFooter from "./components/reading/PassageFooter";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { useLoadingStore } from "@/app/store/loading";
import Modal from "@/components/Modal";
import { submitAttempt } from "@/utils/api";

type Skill = "reading" | "listening" | "writing" | "speaking";

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
  const isAutoGraded = skill === "reading" || skill === "listening";

  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const { setLoading } = useLoadingStore();

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialSeconds = useMemo(() => {
    if (!attempt) return 0;
    if (skill === "writing" || skill === "speaking") return 0;
    const dl = getDeadlineMs(
      attempt.startedAt,
      attempt.durationSec,
      attempt.timeLeft
    );
    return Math.max(0, Math.floor((dl - Date.now()) / 1000));
  }, [attempt, skill]);

  const passages = useMemo(() => {
    if (!attempt || skill !== "reading") return [];
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
  }, [attempt, skill]);

  const currentSecId =
    sp.get("sec") ?? (passages.length > 0 ? passages[0].id : "");

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

  const prettySkill =
    skill === "reading"
      ? "Reading"
      : skill === "listening"
      ? "Listening"
      : skill === "writing"
      ? "Writing"
      : "Speaking";

  const subtitle =
    skill === "reading" || skill === "listening"
      ? attempt
        ? `IELTS Online Test · ${attempt.attemptId.slice(0, 6)}...`
        : "—"
      : "IELTS Online Practice";

  const showTimer = skill === "reading" || skill === "listening";

  const handleExit = () => {
    setOpenConfirm(true);
  };

  const confirmExit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setLoading(true);

      if (isAutoGraded && attempt) {
        await submitAttempt(attempt.attemptId);
        router.replace(`/attempts/${attempt.attemptId}`);
        return;
      }

      router.replace("/home");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden">
        <TopBar
          title={`Làm bài ${prettySkill}`}
          subtitle={subtitle}
          onClose={handleExit}
          rightSlot={
            showTimer ? <TimerDisplay initialSeconds={initialSeconds} /> : null
          }
        />

        <main className="flex-1 min-h-0 w-full mx-auto overflow-y-auto">
          {children}
        </main>

        {skill === "reading" && attempt && passages.length > 0 && (
          <PassageFooter
            passages={passages}
            currentPassageId={currentSecId}
            onChangePassage={gotoSection}
            onJumpRange={jumpRange}
            onGridClick={() => {}}
            rangeLabel={currentPassage?.label ?? ""}
            rangePrevLabel={passages[currentIndex - 1]?.label ?? ""}
          />
        )}
      </div>

      <Modal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="Xác nhận thoát bài"
        footer={
          <>
            <button
              onClick={() => setOpenConfirm(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Ở lại làm tiếp
            </button>
            <button
              onClick={confirmExit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Thoát
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          {isAutoGraded
            ? "Nếu bạn thoát bây giờ, bài làm sẽ được nộp và chấm điểm ngay."
            : "Nếu bạn thoát bây giờ, phần làm hiện tại sẽ không được lưu."}
        </p>
      </Modal>
    </>
  );
}
