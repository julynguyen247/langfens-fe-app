"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  // Legacy props (for backwards compatibility)
  rightSlot?: React.ReactNode;
  submitButton?: React.ReactNode;
  // Enhanced props (new interface)
  startedAt?: string | Date;
  durationSec?: number;
  onTimeUp?: () => void;
  totalQuestions?: number;
  answeredCount?: number;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  mobileMenu?: React.ReactNode;
}

type SubmitState = "idle" | "confirming" | "submitting";

/**
 * Enhanced TopBar with timer, progress indicator, and submit functionality.
 * Maintains backwards compatibility with legacy rightSlot/submitButton props.
 */
export default function TopBar({
  title = "Reading Test",
  subtitle = "IELTS Online Test",
  onClose,
  rightSlot,
  submitButton,
  startedAt,
  durationSec = 60 * 60,
  onTimeUp,
  totalQuestions = 0,
  answeredCount = 0,
  onSubmit,
  isSubmitting = false,
  mobileMenu,
}: TopBarProps) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);

  // Check if using legacy mode (rightSlot/submitButton) or enhanced mode
  const isLegacyMode = !!rightSlot || !!submitButton;

  // Calculate time left
  const calculateTimeLeft = useCallback(() => {
    if (!startedAt) return durationSec;
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    return Math.max(0, durationSec - elapsed);
  }, [startedAt, durationSec]);

  // Timer effect
  useEffect(() => {
    if (!startedAt || isLegacyMode) return;

    setSeconds(calculateTimeLeft());

    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setSeconds(remaining);

      if (remaining <= 0 && !hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        clearInterval(intervalRef.current!);
        onTimeUp?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculateTimeLeft, onTimeUp, startedAt, isLegacyMode]);

  // Format time
  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Timer color
  const getTimerClass = () => {
    if (seconds === null) return "";
    if (seconds <= 60) return "border-red-300 bg-red-50 text-red-600 animate-pulse";
    if (seconds <= 5 * 60) return "border-orange-300 bg-orange-50 text-orange-600";
    return "border-[var(--skill-reading-border)] bg-[var(--skill-reading-light)] text-[var(--skill-reading)]";
  };

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleSubmitClick = () => {
    setSubmitState("confirming");
  };

  const handleConfirmSubmit = () => {
    setSubmitState("submitting");
    onSubmit?.();
  };

  const handleCancelSubmit = () => {
    setSubmitState("idle");
  };

  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Legacy mode: render with slot-based interface
  if (isLegacyMode) {
    return (
      <>
        <header className="fixed top-0 left-0 w-full h-14 md:h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-3 md:px-6 z-50">
          {/* LEFT: Exit & Title */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <button
              onClick={handleClose}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border-[3px] flex items-center justify-center hover:bg-[var(--background)] transition-colors flex-shrink-0"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              title="Exit Test"
            >
              <span className="text-base md:text-lg font-bold leading-none">&times;</span>
            </button>

            <div className="min-w-0">
              <h1 className="font-sans font-bold text-sm md:text-lg text-[var(--foreground)] leading-tight truncate max-w-[120px] sm:max-w-xs md:max-w-md">
                {title}
              </h1>
              <p className="hidden sm:block text-xs text-[var(--text-muted)] font-sans truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {/* RIGHT: Slots */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {rightSlot}
            {submitButton}
            {mobileMenu && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-8 h-8 rounded-lg border-[3px] flex items-center justify-center hover:bg-[var(--background)] transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && mobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/20 z-40 md:hidden"
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-white border-b border-[var(--border)] z-50 md:hidden"
              >
                <div className="p-4">{mobileMenu}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Enhanced mode: render with built-in timer, progress, and submit
  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 md:h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-3 md:px-6 z-50">
        {/* LEFT: Exit & Title */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <button
            onClick={handleClose}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full border-[3px] flex items-center justify-center hover:bg-[var(--background)] transition-colors flex-shrink-0"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            title="Exit Test"
          >
            <span className="text-base md:text-lg font-bold leading-none">&times;</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-sans font-bold text-sm md:text-lg text-[var(--foreground)] leading-tight truncate max-w-[120px] sm:max-w-xs md:max-w-md">
              {title}
            </h1>
            <p className="hidden sm:block text-xs text-[var(--text-muted)] font-sans truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* CENTER: Progress (desktop only) */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-[var(--background)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-medium text-[var(--text-muted)] whitespace-nowrap">
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>

          {seconds !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-[2px] transition-colors duration-500 ${getTimerClass()}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="font-semibold tabular-nums text-sm">
                {formatTime(seconds)}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Timer (mobile), Submit */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {seconds !== null && (
            <div
              className={`lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-[2px] transition-colors duration-500 ${getTimerClass()}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="font-semibold tabular-nums text-sm">
                {formatTime(seconds)}
              </span>
            </div>
          )}

          {mobileMenu && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-lg border-[3px] flex items-center justify-center hover:bg-[var(--background)] transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}

          <motion.button
            onClick={handleSubmitClick}
            disabled={submitState === "submitting" || isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-semibold text-sm
                       hover:bg-[var(--primary-hover)] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_4px_0_var(--primary-dark)]"
          >
            {submitState === "submitting" || isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </motion.button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && mobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-white border-b border-[var(--border)] z-50 md:hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-muted)]">Progress</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {answeredCount} of {totalQuestions} answered
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--primary)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {mobileMenu}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {submitState === "confirming" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelSubmit}
              className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[101] bg-white rounded-[2rem] p-6 shadow-2xl max-w-sm w-full"
            >
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Submit Test?
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                You have answered <span className="font-semibold text-[var(--primary)]">{answeredCount}</span> of{" "}
                <span className="font-semibold">{totalQuestions}</span> questions.
                {answeredCount < totalQuestions && (
                  <span className="block mt-1 text-amber-600">
                    {totalQuestions - answeredCount} questions are still unanswered.
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubmit}
                  className="flex-1 py-3 px-4 rounded-xl border-[3px] border-[var(--border)] font-semibold
                           text-[var(--text-muted)] hover:bg-[var(--background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--primary)] font-semibold text-white
                           hover:bg-[var(--primary-hover)] transition-colors
                           shadow-[0_4px_0_var(--primary-dark)]"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
