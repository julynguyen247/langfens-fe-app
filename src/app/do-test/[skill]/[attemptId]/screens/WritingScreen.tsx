"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAttemptStore } from "@/stores/useAttemptStore";
import { useLoadingStore } from "@/stores/loading";
import Modal from "@/components/Modal";
import { getWritingExamById, gradeWriting } from "@/services/writing";
import { motion } from "framer-motion";
import WritingAssistRail from "../components/writing/WritingAssistRail";

export function WritingScreen({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { setLoading } = useLoadingStore();

  const attempt = useAttemptStore((s) => s.byId[attemptId]);
  const examId =
    (attempt as any)?.paper?.id ?? (attempt as any)?.examId ?? attemptId;

  const [exam, setExam] = useState<any | null>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  const [errorExam, setErrorExam] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [grading, setGrading] = useState(false);
  const submittingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistWord, setAssistWord] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchExam() {
      try {
        setLoadingExam(true);
        setErrorExam(null);

        if (attempt && (attempt as any).taskText) {
          if (!cancelled) setExam(attempt);
          return;
        }

        const res = await getWritingExamById(examId);
        if (cancelled) return;
        setExam(res.data?.data ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setErrorExam("Could not load writing test. Please try again.");
      } finally {
        if (!cancelled) setLoadingExam(false);
      }
    }

    fetchExam();
    return () => {
      cancelled = true;
    };
  }, [examId, attempt]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setAnswer(v);
    setWordCount(v.trim().split(/\s+/).filter(Boolean).length);
  };

  // Capture the word at the caret on double-click so the assist panel can
  // look it up immediately. The native browser selection is what we want
  // (a single token like "education" not the whole sentence).
  const handleTextareaDoubleClick = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const sel = (typeof window !== "undefined"
      ? window.getSelection()
      : null)?.toString();
    const text = (sel && sel.trim()) || answer;
    const match = text.match(/[A-Za-z][A-Za-z'-]*/);
    if (match) {
      setAssistWord(match[0].toLowerCase());
      setAssistOpen(true);
    }
  };

  const handleOpenConfirmSubmit = () => {
    if (!answer.trim()) {
      alert("You haven't written anything yet.");
      return;
    }
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    if (!answer.trim()) {
      alert("You haven't written anything yet.");
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setGrading(true);
      setLoading(true);

      const res = await gradeWriting(exam?.id ?? examId, answer, seconds);
      const payload = res.data?.data;
      const submissionId =
        payload?.submissionId ?? (payload as any)?.submissionId;

      if (submissionId) router.push(`/attempts/${submissionId}?source=writing`);
      else alert("Grading complete but submissionId not found.");
    } catch (e) {
      console.error(e);
      alert("Grading failed!");
    } finally {
      setGrading(false);
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    await doSubmit();
  };

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-[var(--border)] border-t-[var(--primary)]" />
        <p className="text-sm text-[var(--text-muted)] font-bold">Loading writing test...</p>
      </div>
    );
  }

  if (errorExam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--destructive)] font-bold">{errorExam}</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] font-bold">
          Writing test not found. Go back and try again.
        </p>
      </div>
    );
  }

  const examTitle: string = exam?.title ?? "Writing Task";
  const writingPrompt: string =
    exam?.taskText ??
    "Write an essay of at least 150 words on the following topic:\n\nDo you think technology improves the quality of life? Why or why not?";

  // Heuristic: Task 2 essays require 250 words; Task 1 requires 150.
  const isTaskTwo = /task\s*2|task2/i.test(examTitle);
  const wordTarget = isTaskTwo ? 250 : 150;
  const wordProgress = Math.min(100, Math.round((wordCount / wordTarget) * 100));
  const reachedTarget = wordCount >= wordTarget;

  const formatTimeLeft = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-[var(--background)]">

        {/* LEFT: PROMPT */}
        <div className="w-1/2 overflow-y-auto p-6">
          {/* Accent strip */}
          <div className="mx-auto max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-[var(--skill-writing-light)] text-[var(--skill-writing)] text-xs font-bold px-4 py-1.5 border-[2px] border-[var(--skill-writing-border)] border-b-[4px]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--skill-writing)]" />
                Step 1 of 1
              </span>
              <span
                className="text-xs font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Target: {wordTarget} words
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
            >
              {/* Task badge */}
              <span
                className="inline-block rounded-full bg-[var(--skill-writing)] text-white text-xs font-bold px-4 py-1.5 mb-5 border-b-[3px] border-[#B45309]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {examTitle}
              </span>

              {/* Prompt heading */}
              <h2
                className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Your task
              </h2>

              {/* Prompt body */}
              <p className="text-lg leading-loose text-[var(--text-body)] whitespace-pre-line">
                {writingPrompt}
              </p>

              {/* Task image */}
              {(exam as any)?.imageUrl && (
                <div className="mt-6">
                  <Image
                    src={(exam as any).imageUrl}
                    alt={`${examTitle} chart`}
                    width={800}
                    height={500}
                    className="w-full h-auto rounded-2xl border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
                  />
                </div>
              )}

              {/* Tips footer */}
              <div className="mt-8 pt-6 border-t-[2px] border-dashed border-[var(--border)]">
                <p
                  className="text-sm font-bold text-[var(--skill-writing)] mb-3 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="w-1.5 h-5 rounded-full bg-[var(--skill-writing)] inline-block" />
                  Quick tips
                </p>
                <ul className="text-sm text-[var(--text-body)] space-y-2">
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">1.</span>
                    <span>Write at least <strong>{wordTarget} words</strong> for a strong response.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">2.</span>
                    <span>Plan your structure: intro, body, conclusion.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--skill-writing)] font-bold">3.</span>
                    <span>Check spelling and grammar before submitting.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="w-1/2 flex flex-col bg-white relative border-l-[3px] border-[var(--border)]">

          {/* Editor header */}
          <div className="shrink-0 h-14 border-b-[2px] border-[var(--border)] bg-[var(--skill-writing-light)] flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-white border-[2px] border-[var(--skill-writing-border)] flex items-center justify-center">
                <span className="text-[var(--skill-writing)] font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>W</span>
              </span>
              <div>
                <p
                  className="text-sm font-bold text-[var(--foreground)] leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Your response
                </p>
                <p
                  className="text-[11px] text-[var(--text-muted)] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Type directly in the box below
                </p>
              </div>
            </div>

            {/* Word target ring + assist toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAssistOpen((v) => !v)}
                title="Open dictionary & translate"
                className={`h-10 px-3 rounded-full font-bold text-xs border-[2px] border-b-[4px] transition-all flex items-center gap-1.5 ${
                  assistOpen
                    ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                    : "bg-white text-[var(--skill-writing)] border-[var(--skill-writing-border)] hover:-translate-y-0.5"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span
                  className="w-5 h-5 rounded-md bg-[var(--skill-writing-light)] border-[2px] border-[var(--skill-writing-border)] flex items-center justify-center text-[10px]"
                  style={{ color: "var(--skill-writing)" }}
                >
                  A
                </span>
                Assist
              </button>
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--skill-writing-border)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="var(--skill-writing)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="94.2"
                    initial={{ strokeDashoffset: 94.2 }}
                    animate={{ strokeDashoffset: 94.2 - (94.2 * wordProgress) / 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--text-muted)]"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {wordProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* Word count progress bar */}
          <div className="shrink-0 px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {reachedTarget
                  ? "Target reached"
                  : `${wordTarget - wordCount} words to go`}
              </span>
              <span
                className={`text-[11px] font-bold ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--text-muted)]"}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {wordCount} / {wordTarget}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--background)] overflow-hidden border-[2px] border-[var(--border)]">
              <motion.div
                className="h-full rounded-full bg-[var(--skill-writing)]"
                initial={{ width: 0 }}
                animate={{ width: `${wordProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Typing area */}
          <div className="relative flex-1 min-h-0">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={handleChange}
              onDoubleClick={handleTextareaDoubleClick}
              className="w-full h-full p-8 resize-none outline-none text-lg text-[var(--foreground)] leading-8 selection:bg-[var(--skill-writing-light)] bg-white placeholder:text-[var(--text-muted)] placeholder:italic"
              placeholder="Start typing your answer here. Tip: outline 2 to 3 main ideas before you begin writing. Double-click a word to look it up."
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Status bar */}
          <div className="shrink-0 h-18 border-t-[3px] border-[var(--border)] bg-[var(--background)] px-6 py-3 flex items-center justify-between z-10">

            {/* Stats */}
            <div className="flex items-center gap-5">
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Words
                </span>
                <span
                  className={`text-2xl font-bold leading-none mt-0.5 ${reachedTarget ? "text-[var(--skill-writing)]" : "text-[var(--foreground)]"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {wordCount}
                </span>
              </div>
              <div className="w-px h-10 bg-[var(--border)]" />
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Time
                </span>
                <span
                  className="text-2xl font-bold text-[var(--foreground)] leading-none mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatTimeLeft(seconds)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleOpenConfirmSubmit}
              disabled={grading}
              whileTap={grading ? undefined : { scale: 0.97 }}
              className={`font-bold py-3 px-8 rounded-full text-sm transition-all duration-150 ${
                grading
                  ? "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
                  : "bg-[var(--skill-writing)] text-white border-b-[4px] border-[#B45309] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {grading ? "Grading..." : "Submit Answer"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Assist rail (dictionary + translate) */}
      <WritingAssistRail
        open={assistOpen}
        onClose={() => setAssistOpen(false)}
        initialWord={assistWord}
      />

      {/* Confirmation Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Writing Answer"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-5 py-2.5 rounded-full border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold text-sm hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-5 py-2.5 rounded-full bg-[var(--skill-writing)] text-white font-bold text-sm border-b-[4px] border-[#B45309] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Submit
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-body)]">
          Are you sure you want to submit your writing for grading?
          <br />
          <span className="text-[var(--text-muted)]">Word count: <strong>{wordCount}</strong> -- Time: <strong>{formatTimeLeft(seconds)}</strong></span>
        </p>
      </Modal>
    </>
  );
}
