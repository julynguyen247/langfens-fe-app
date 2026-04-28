"use client";

import React, { memo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface MobileTabBarProps {
  activeTab: "passage" | "questions";
  onTabChange: (tab: "passage" | "questions") => void;
  questionCount: number;
  answeredCount: number;
  currentQuestionIndex?: number;
  onNavigateQuestion?: (direction: "prev" | "next") => void;
}

const TABS = [
  { id: "passage" as const, label: "Passage" },
  { id: "questions" as const, label: "Questions" },
];

/**
 * Mobile-specific tab navigation between Passage and Questions.
 * Supports swipe gestures and shows question progress.
 */
const MobileTabBar = memo(function MobileTabBar({
  activeTab,
  onTabChange,
  questionCount,
  answeredCount,
  currentQuestionIndex = 0,
  onNavigateQuestion,
}: MobileTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const dragOffset = useMotionValue(0);

  // Handle swipe gesture
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setDragStart("touches" in e ? e.touches[0].clientX : e.clientX);
  }, []);

  const handleDragEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (dragStart === null) return;

      const endX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
      const diff = endX - dragStart;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(diff) > threshold) {
        if (diff > 0 && activeTab === "questions") {
          onTabChange("passage");
        } else if (diff < 0 && activeTab === "passage") {
          onTabChange("questions");
        }
      }

      setDragStart(null);
      dragOffset.set(0);
    },
    [dragStart, activeTab, onTabChange, dragOffset]
  );

  const handleDrag = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (dragStart === null) return;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const diff = currentX - dragStart;
      dragOffset.set(diff);
    },
    [dragStart, dragOffset]
  );

  // Calculate progress
  const progress = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;
  const hasPrev = currentQuestionIndex > 0;
  const hasNext = currentQuestionIndex < questionCount - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] z-40 safe-area-inset-bottom">
      {/* Tab Bar */}
      <div
        ref={containerRef}
        className="flex relative select-none"
        onTouchStart={handleDragStart}
        onTouchMove={handleDrag}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Active indicator background */}
        <motion.div
          className="absolute top-0 bottom-0 bg-[var(--primary)]/5 rounded-t-xl"
          layoutId="mobileTabIndicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {/* Tabs */}
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-[var(--primary)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {/* Icon */}
            {tab.id === "passage" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}

            {/* Label */}
            <span className="font-semibold text-sm">{tab.label}</span>

            {/* Badge for questions tab */}
            {tab.id === "questions" && answeredCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                {answeredCount}
              </span>
            )}

            {/* Active underline */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="mobileTabUnderline"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--primary)] rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Question Navigator (shows when on questions tab) */}
      <AnimatePresence>
        {activeTab === "questions" && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="px-4 py-3 bg-[var(--background)]"
          >
            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Question {currentQuestionIndex + 1} of {questionCount}
              </span>
              <span className="text-xs font-medium text-[var(--primary)]">
                {Math.round(progress)}% complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-[var(--primary)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onNavigateQuestion?.("prev")}
                disabled={!hasPrev}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  hasPrev
                    ? "bg-white border-[3px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    : "bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                onClick={() => onNavigateQuestion?.("next")}
                disabled={!hasNext}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  hasNext
                    ? "bg-[var(--primary)] text-white shadow-[0_4px_0_var(--primary-dark)] active:shadow-none active:translate-y-[2px]"
                    : "bg-[var(--primary)]/50 text-white/80 cursor-not-allowed"
                }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileTabBar;
