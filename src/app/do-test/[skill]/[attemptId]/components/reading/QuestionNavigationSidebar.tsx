"use client";

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionNavigationSidebarProps {
  totalQuestions: number;
  answers: Record<string, string>;
  flaggedQuestions: Set<string>;
  currentQuestionId: string;
  questions: { id: string; idx: number }[];
  onNavigate: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
}

type FilterTab = "all" | "flagged" | "unanswered";

/**
 * Desktop sidebar for navigating between questions with status indicators.
 * Shows question grid with color-coded states and filter tabs.
 */
const QuestionNavigationSidebar = memo(function QuestionNavigationSidebar({
  totalQuestions,
  answers,
  flaggedQuestions,
  currentQuestionId,
  questions,
  onNavigate,
  onToggleFlag,
}: QuestionNavigationSidebarProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter questions based on active tab
  const filteredQuestions = React.useMemo(() => {
    switch (activeFilter) {
      case "flagged":
        return questions.filter((q) => flaggedQuestions.has(q.id));
      case "unanswered":
        return questions.filter((q) => !answers[q.id]);
      default:
        return questions;
    }
  }, [questions, activeFilter, flaggedQuestions, answers]);

  // Get status of a specific question
  const getQuestionStatus = useCallback(
    (questionId: string) => {
      const isFlagged = flaggedQuestions.has(questionId);
      const isAnswered = !!answers[questionId];
      const isCurrent = questionId === currentQuestionId;

      return { isFlagged, isAnswered, isCurrent };
    },
    [flaggedQuestions, answers, currentQuestionId]
  );

  // Get button className based on status
  const getButtonClass = useCallback(
    (questionId: string) => {
      const { isFlagged, isAnswered, isCurrent } = getQuestionStatus(questionId);

      const baseClasses =
        "relative w-10 h-10 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center";

      let stateClasses = "";
      if (isCurrent) {
        stateClasses = isAnswered
          ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20"
          : "bg-white border-2 border-[var(--primary)] text-[var(--primary)] ring-4 ring-[var(--primary)]/20";
      } else if (isAnswered) {
        stateClasses =
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]";
      } else {
        stateClasses =
          "bg-white border-2 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]";
      }

      return `${baseClasses} ${stateClasses}`;
    },
    [getQuestionStatus]
  );

  // Count stats
  const stats = React.useMemo(() => {
    const answered = questions.filter((q) => answers[q.id]).length;
    const flagged = questions.filter((q) => flaggedQuestions.has(q.id)).length;
    return { answered, flagged, total: questions.length };
  }, [questions, answers, flaggedQuestions]);

  // Handle double-click to flag
  const handleClick = useCallback(
    (questionId: string) => {
      onNavigate(questionId);
    },
    [onNavigate]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, questionId: string) => {
      e.preventDefault();
      onToggleFlag(questionId);
    },
    [onToggleFlag]
  );

  return (
    <aside className="w-48 bg-white border-r border-[var(--border)] flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="flex gap-1 bg-[var(--background)] rounded-xl p-1">
          {(["all", "flagged", "unanswered"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                activeFilter === tab
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-body)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 flex gap-3 text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
        <span>
          <span className="font-semibold text-[var(--primary)]">{stats.answered}</span>
          <span className="mx-0.5">/</span>
          <span>{stats.total}</span> answered
        </span>
        {stats.flagged > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {stats.flagged} flagged
          </span>
        )}
      </div>

      {/* Question Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-4 gap-2"
          >
            {filteredQuestions.map((question) => {
              const { isFlagged } = getQuestionStatus(question.id);
              const displayNumber = question.idx + 1;

              return (
                <button
                  key={question.id}
                  onClick={() => handleClick(question.id)}
                  onDoubleClick={(e) => handleDoubleClick(e, question.id)}
                  className={getButtonClass(question.id)}
                  title={`Question ${displayNumber}${isFlagged ? " (Flagged)" : ""}`}
                  aria-label={`Question ${displayNumber}${isFlagged ? ", flagged for review" : ""}${
                    answers[question.id] ? ", answered" : ", not answered"
                  }`}
                >
                  {displayNumber}

                  {/* Flagged indicator dot */}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            {activeFilter === "flagged" && "No flagged questions"}
            {activeFilter === "unanswered" && "All questions answered!"}
          </div>
        )}
      </div>

      {/* Review All Button */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => setActiveFilter("all")}
          className="w-full py-2 px-4 rounded-xl border-2 border-[var(--border)] text-sm font-medium text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-200"
        >
          Review All
        </button>
      </div>
    </aside>
  );
});

export default QuestionNavigationSidebar;
