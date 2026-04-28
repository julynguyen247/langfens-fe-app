"use client";

import { useState } from "react";
import { createBookmark, deleteBookmark } from "@/utils/api";

type BookmarkButtonProps = {
  questionId: string;
  attemptId?: string;
  isBookmarked?: boolean;
  questionContent?: string;
  skill?: string;
  questionType?: string;
  onToggle?: (newState: boolean) => void;
  className?: string;
};

export default function BookmarkButton({
  questionId,
  attemptId,
  isBookmarked = false,
  questionContent,
  skill,
  questionType,
  onToggle,
  className = "",
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;

    try {
      setLoading(true);
      if (bookmarked) {
        await deleteBookmark(questionId);
        setBookmarked(false);
        onToggle?.(false);
      } else {
        await createBookmark(questionId, {
          attemptId,
          questionContent,
          skill,
          questionType,
        });
        setBookmarked(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-colors ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      style={{
        color: bookmarked ? "#ca8a04" : "var(--text-muted)",
      }}
      title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
    >
      <span className="text-base font-bold">{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
