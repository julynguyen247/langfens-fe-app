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

// Material Icon
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
  const isSubmitting = useAttemptStore((s) => s.isSubmitting);
  const setIsSubmitting = useAttemptStore((s) => s.setIsSubmitting);
  const { setLoading } = useLoadingStore();

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const passages = useMemo(() => {
    if (!attempt || skill !== "reading") return [];
    return [...attempt.paper.sections]
      .sort((a, b) => a.idx - b.idx)
      .map((sec) => {
        const qs = [...(sec.questionGroups ?? [])].sort(
          (a, b) => a.idx - b.idx
        );
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
  const searchParams = useSearchParams();

  // Get test title from current section or paper
  const testTitle = useMemo(() => {
    if (!attempt) return "Test";
    const sections = attempt.paper?.sections ?? [];
    const activeSec = sections.find((s: any) => s.id === currentSecId) ?? sections[0];
    return activeSec?.title || attempt.paper?.title || "Reading Test";
  }, [attempt, currentSecId]);

  const gotoSection = (id: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sec", id);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
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
    skill === "reading" && passages.length > 1
      ? `Reading Passage ${currentIndex + 1}`
      : prettySkill + " Test";

  const showTimer = skill === "reading" || skill === "listening";

  const handleExit = () => {
    setOpenConfirm(true);
  };

  const clearAttempt = useAttemptStore((s) => s.clear);

  const confirmExit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setLoading(true);

      if (isAutoGraded && attempt) {
        await submitAttempt(attempt.attemptId);
        clearAttempt(attemptId);
        router.replace(`/attempts/${attempt.attemptId}`);
        return;
      }

      router.replace("/home");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !attempt) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      await submitAttempt(attempt.attemptId);
      clearAttempt(attemptId);
      router.replace(`/attempts/${attempt.attemptId}`);
    } catch {
      alert("Submit failed. Please try again.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Timer component with blue theme
  const timerSlot = showTimer && attempt ? (
    <TimerDisplay
      startedAt={attempt.startedAt}
      durationSec={attempt.durationSec}
      onTimeUp={confirmExit}
    />
  ) : null;

  // Submit button
  const submitButton = isAutoGraded && attempt ? (
    <button
      onClick={() => setSubmitConfirm(true)}
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-60"
    >
      {isSubmitting ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Submitting...
        </>
      ) : (
        <>
          <Icon name="send" className="text-lg" />
          Submit Test
        </>
      )}
    </button>
  ) : null;

  return (
    <>
      <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
        <TopBar
          title={testTitle}
          subtitle={subtitle}
          onClose={handleExit}
          rightSlot={timerSlot}
          submitButton={submitButton}
        />

        {/* Main content with responsive pt to account for fixed header */}
        <main className="flex-1 min-h-0 w-full overflow-hidden pt-14 md:pt-16">
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

      {/* Exit Confirmation Modal */}
      <Modal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="Exit Test?"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setOpenConfirm(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Continue Test
            </button>
            <button
              onClick={confirmExit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Exit & Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          {isAutoGraded
            ? "If you exit now, your test will be submitted and graded immediately."
            : "If you exit now, your progress will not be saved."}
        </p>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        open={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        title="Submit Test?"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSubmitConfirm(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSubmitConfirm(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50 transition-colors"
            >
              Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Are you sure you want to submit your test? You cannot change your answers after submission.
        </p>
      </Modal>
    </>
  );
}
