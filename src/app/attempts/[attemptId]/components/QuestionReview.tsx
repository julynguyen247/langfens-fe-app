"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import BookmarkButton from "@/components/BookmarkButton";
import type { AttemptQuestionResult } from "../types";
import { formatQuestionType } from "../types";
import { normalizeDetail, fmtMinSec } from "../utils";
import type { NormalizedDetail } from "../utils";
import { SkillBadge } from "@/components/ui/SkillBadge";

export function QuestionReview({ details }: { details: AttemptQuestionResult[] }) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "none">(
    "all"
  );

  const normalized = useMemo(
    () =>
      (details ?? [])
        .map(normalizeDetail)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
    [details]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return normalized;
    if (filter === "correct")
      return normalized.filter((d) => d.isCorrect === true);
    if (filter === "wrong")
      return normalized.filter((d) => d.isCorrect === false);
    return normalized.filter((d) => d.state === "none");
  }, [normalized, filter]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h3
          className="font-bold text-[var(--foreground)] text-lg"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Detailed Review
        </h3>
        <div className="flex gap-2 flex-wrap">
          <FilterBtn
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({normalized.length})
          </FilterBtn>
          <FilterBtn
            active={filter === "correct"}
            onClick={() => setFilter("correct")}
          >
            Correct ({normalized.filter((d) => d.isCorrect === true).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "wrong"}
            onClick={() => setFilter("wrong")}
          >
            Wrong ({normalized.filter((d) => d.isCorrect === false).length})
          </FilterBtn>
          <FilterBtn
            active={filter === "none"}
            onClick={() => setFilter("none")}
          >
            Skipped ({normalized.filter((d) => d.state === "none").length})
          </FilterBtn>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center text-[var(--text-muted)] border-[3px] border-[var(--border)] rounded-[2rem] bg-[var(--background)]">
          No question details available for this filter.
        </div>
      ) : (
        <div
          className="space-y-3"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          {filtered.slice(0, 10).map((d, idx) => (
            <motion.div
              key={d.questionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(idx * 0.05, 0.5),
                ease: "easeOut",
              }}
            >
              <ReviewItem
                data={d}
                isExpanded={expandedIds.has(d.questionId)}
                onToggleExpand={() => toggleExpand(d.questionId)}
              />
            </motion.div>
          ))}
          {filtered.length > 10 && (
            <LoadMoreReviewItems
              items={filtered.slice(10)}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LoadMoreReviewItems({
  items,
  expandedIds,
  onToggleExpand,
}: {
  items: NormalizedDetail[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 5, items.length));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, items.length]);

  return (
    <>
      {items.slice(0, visibleCount).map((d) => (
        <ReviewItem
          key={d.questionId}
          data={d}
          isExpanded={expandedIds.has(d.questionId)}
          onToggleExpand={() => onToggleExpand(d.questionId)}
        />
      ))}
      {visibleCount < items.length && (
        <div className="p-4 text-center text-[var(--text-muted)]">
          Loading more questions... ({visibleCount}/{items.length})
        </div>
      )}
    </>
  );
}

function ReviewItem({
  data,
  isExpanded,
  onToggleExpand,
}: {
  data: NormalizedDetail;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isExpanded !== undefined ? isExpanded : internalOpen;
  const toggleOpen = onToggleExpand || (() => setInternalOpen((v) => !v));

  const isCorrect = data.isCorrect === true;
  const isWrong = data.isCorrect === false;
  const isSkipped = data.state === "none";

  const borderColor = isCorrect
    ? "var(--skill-speaking)"
    : isWrong
    ? "var(--destructive)"
    : "var(--border)";

  const statusLabel = isSkipped ? (
    <span className="text-[var(--text-muted)] text-sm font-bold">--</span>
  ) : isCorrect ? (
    <span className="px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] text-xs font-bold">
      Correct
    </span>
  ) : (
    <span className="px-3 py-1 rounded-full border-[2px] border-red-300 bg-red-50 text-red-600 text-xs font-bold">
      Wrong
    </span>
  );

  const numberBadge = (
    <span className="w-8 h-8 rounded-full bg-[var(--primary-light)] border-[2px] border-[var(--primary)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
      {data.index ?? "?"}
    </span>
  );

  return (
    <div
      className="rounded-[2rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white mb-4 overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      style={{ borderColor, borderLeftWidth: "4px" }}
      onClick={toggleOpen}
    >
      {/* Collapsed Header */}
      <div className="px-5 py-4 flex items-center gap-3">
        {numberBadge}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          {data.skill && data.skill !== "UNKNOWN" && (
            <SkillBadge skill={data.skill} size="sm" />
          )}
          {data.questionType && data.questionType !== "UNKNOWN" && (
            <span className="px-3 py-0.5 rounded-full border-[2px] border-[var(--skill-writing-border)] text-xs font-bold bg-[var(--skill-writing-light)] text-[var(--skill-writing)]">
              {formatQuestionType(data.questionType)}
            </span>
          )}
          {typeof data.timeSpentSec === "number" && (
            <span
              className="px-3 py-0.5 rounded-full border-[2px] border-[var(--border)] text-xs font-bold bg-white text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {fmtMinSec(data.timeSpentSec)}
            </span>
          )}
        </div>
        {statusLabel}
        <BookmarkButton
          questionId={data.questionId}
          questionContent={data.prompt}
          skill={data.skill}
          questionType={data.questionType}
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Question text */}
            <div className="px-5 pb-4 border-t-[2px] border-[var(--border)] pt-4">
              <div className="prose prose-sm max-w-none text-[var(--foreground)]">
                <ReactMarkdown>{data.prompt}</ReactMarkdown>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
              {/* Your Answer */}
              <div className="p-5 bg-white">
                <p className="text-xs font-bold text-[var(--text-muted)] mb-2">
                  Your Answer
                </p>
                <div
                  className={`text-base font-medium flex items-center gap-2 ${
                    isSkipped
                      ? "text-[var(--text-muted)] italic"
                      : isCorrect
                      ? "text-[var(--skill-speaking)]"
                      : "text-[var(--destructive)]"
                  }`}
                >
                  <span
                    className={
                      !isCorrect && !isSkipped
                        ? "line-through decoration-2 decoration-red-200"
                        : ""
                    }
                  >
                    {data.selectedText || "-- No Answer --"}
                  </span>
                </div>
              </div>

              {/* Correct Answer */}
              <div className="p-5 bg-[var(--primary-light)] min-h-[72px]">
                <p className="text-xs font-bold text-[var(--text-muted)] mb-2">
                  Correct Key
                </p>
                <div
                  className={`text-base font-bold ${
                    data.correctText
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)] italic font-normal text-sm"
                  }`}
                >
                  {data.correctText || "(Answer key not available)"}
                </div>
              </div>
            </div>

            {/* Explanation */}
            {data.explanation && (
              <div className="px-5 py-4 bg-[var(--primary-light)] border-t-[2px] border-[var(--primary)]">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--primary-dark)] mb-1">
                      Why is this correct?
                    </p>
                    <div className="prose prose-sm max-w-none text-[var(--text-body)]">
                      <ReactMarkdown>{data.explanation}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-bold border-[2px] transition-all duration-150 ${
        active
          ? "bg-[var(--primary)] text-white border-[var(--primary-dark)] border-b-[4px] shadow-[0_2px_0_rgba(0,0,0,0.1)]"
          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
      }`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {children}
    </button>
  );
}
