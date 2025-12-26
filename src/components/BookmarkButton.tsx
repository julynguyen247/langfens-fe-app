"use client";

import { useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { createBookmark, deleteBookmark } from "@/utils/api";

type BookmarkButtonProps = {
  questionId: string;
  isBookmarked?: boolean;
  questionContent?: string;
  skill?: string;
  questionType?: string;
  onToggle?: (newState: boolean) => void;
  className?: string;
};

export default function BookmarkButton({
  questionId,
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
      className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
        bookmarked
          ? "text-yellow-600 hover:text-yellow-700"
          : "text-slate-400 hover:text-slate-600"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
    >
      <FiBookmark
        className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
      />
    </button>
  );
}
