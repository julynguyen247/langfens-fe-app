"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { startAttempt, startWritingExam, startSpeakingExam } from "@/utils/api";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { SkillBadge } from "@/components/ui/SkillBadge";

type Skill = "reading" | "listening" | "writing" | "speaking";

const SKILL_META: Record<
  Skill,
  { label: string; duration: string; questions: string; description: string }
> = {
  reading: {
    label: "Reading",
    duration: "60 min",
    questions: "40 questions",
    description:
      "Read passages carefully and answer comprehension questions. Manage your time across all sections.",
  },
  listening: {
    label: "Listening",
    duration: "30 min",
    questions: "40 questions",
    description:
      "Listen to recordings and answer questions. Audio plays once, so pay close attention.",
  },
  writing: {
    label: "Writing",
    duration: "60 min",
    questions: "2 tasks",
    description:
      "Complete Task 1 and Task 2. Allocate roughly 20 minutes for Task 1 and 40 minutes for Task 2.",
  },
  speaking: {
    label: "Speaking",
    duration: "11-14 min",
    questions: "3 parts",
    description:
      "Speak clearly and naturally. You will be recorded for each part of the test.",
  },
};

const RULES = [
  "Do not refresh or close the browser during the test.",
  "Answer all questions before submitting.",
  "Your progress is auto-saved periodically.",
  "Once submitted, you cannot change your answers.",
  "Ensure a stable internet connection throughout.",
];

export default function StartAttemptPage() {
  const { skill, examId } = useParams() as { skill: Skill; examId: string };
  const router = useRouter();
  const setAttempt = useAttemptStore((s) => s.setAttempt);
  const [loading, setLoading] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const meta = SKILL_META[skill] ?? SKILL_META.reading;

  const handleBeginTest = useCallback(async () => {
    setLoading(true);
    try {
      if (skill === "reading" || skill === "listening") {
        const res = await startAttempt(examId);
        const payload = res?.data?.data ?? res?.data;
        const attemptId: string | undefined =
          payload?.attemptId ?? payload?.id;

        if (!attemptId) throw new Error("Missing attemptId");

        setAttempt({ ...payload, attemptId });
        router.replace(`/do-test/${skill}/${attemptId}`);
        return;
      }

      if (skill === "writing") {
        const res = await startWritingExam(examId);
        const payload = res?.data?.data ?? res?.data;
        const writingExamId: string = payload?.id ?? examId;

        setAttempt({
          ...payload,
          examId: writingExamId,
          attemptId: writingExamId,
        });
        router.replace(`/do-test/${skill}/${writingExamId}`);
        return;
      }

      if (skill === "speaking") {
        await startSpeakingExam(examId);
        router.replace(`/do-test/${skill}/${examId}`);
        return;
      }

      throw new Error("Unknown skill");
    } catch (e) {
      console.error(e);
      alert("Không thể bắt đầu bài thi. Vui lòng thử lại.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [skill, examId, router, setAttempt]);

  return (
    <div className="bg-[var(--background)] min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <div
          className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 bg-[var(--surface)]"
        >
          {/* Skill badge */}
          <div className="mb-6">
            <SkillBadge skill={skill} size="lg" />
          </div>

          {/* Exam title */}
          <h1
            className="text-2xl font-bold text-[var(--text-heading)] mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {meta.label} Test
          </h1>

          {/* Description */}
          <p
            className="text-base text-[var(--text-body)] mb-6"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {meta.description}
          </p>

          {/* Duration + question count */}
          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-0.5">
                Duration
              </p>
              <p
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {meta.duration}
              </p>
            </div>
            <div
              className="w-px h-8 bg-[var(--border)]"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-0.5">
                Format
              </p>
              <p
                className="text-lg font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {meta.questions}
              </p>
            </div>
          </div>

          {/* Rules / instructions - collapsible */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setRulesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left py-3 px-4 rounded-xl bg-[var(--primary-light)] text-[var(--primary-dark)] font-semibold text-sm transition-colors hover:bg-[var(--primary-light)]/80"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span>Rules and instructions</span>
              <span
                className="inline-block transition-transform duration-200"
                style={{
                  transform: rulesOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                &#9662;
              </span>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: rulesOpen ? "auto" : 0,
                opacity: rulesOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <ul className="mt-3 space-y-2 px-4">
                {RULES.map((rule, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-body)] flex items-start gap-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <span
                      className="inline-block min-w-[20px] h-5 text-center rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold leading-5"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {i + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Begin Test button */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={handleBeginTest}
              disabled={loading}
              whileHover={loading ? {} : { y: -2 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className={`px-12 py-4 text-lg rounded-full bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] font-bold transition-all duration-150 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px]"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                  Starting...
                </span>
              ) : (
                "Begin Test"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
