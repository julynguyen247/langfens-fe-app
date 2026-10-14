"use client";

import React, { useEffect, useId, useState } from "react";
import {
  FEEDBACK_REASONS,
  FeedbackReasonId,
  evaluateSmallEditPolicy,
} from "@/app/admin/_lib/feedbackTaxonomy";

const EMPTY_REASONS: string[] = [];

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  mode?: "review" | "reject" | "accept" | "edit" | "general";
  targetDescription?: string;
  beforeText?: string;
  afterText?: string;
  initialReasons?: string[];
  initialComment?: string;
  onSubmit: (reasons: string[], comment: string, idempotencyKey?: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function FeedbackModal({
  isOpen,
  onClose,
  title = "Curator Feedback & Taxonomy",
  mode = "general",
  targetDescription,
  beforeText,
  afterText,
  initialReasons = EMPTY_REASONS,
  initialComment = "",
  onSubmit,
  isSubmitting = false,
}: FeedbackModalProps) {
  const titleId = useId();
  const descId = useId();

  const [selectedReasons, setSelectedReasons] = useState<string[]>(initialReasons);
  const [comment, setComment] = useState(initialComment);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionIdempotencyKey, setActionIdempotencyKey] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons(initialReasons);
      setComment(initialComment);
      setValidationError(null);
      // Generate a fresh stable idempotency key for this session attempt
      const newKey = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setActionIdempotencyKey(newKey);
    }
  }, [isOpen, initialReasons, initialComment]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasDiff = beforeText !== undefined && afterText !== undefined;
  const policy = hasDiff ? evaluateSmallEditPolicy(beforeText!, afterText!) : null;

  const toggleReason = (id: string) => {
    setValidationError(null);
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If rejecting a paper, at least one reason or comment is required
    if (mode === "reject" && selectedReasons.length === 0 && !comment.trim()) {
      setValidationError("Please select at least one reason tag or provide an explanation comment for rejection.");
      return;
    }

    try {
      // Pass the stable actionIdempotencyKey across retries
      await onSubmit(selectedReasons, comment.trim(), actionIdempotencyKey);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit feedback";
      setValidationError(msg);
      // Notice: actionIdempotencyKey is intentionally retained on failure so that retrying sends the same key!
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={targetDescription ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-white tracking-tight">
              {title}
            </h2>
            {targetDescription && (
              <p id={descId} className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-indigo-300 font-medium">{targetDescription}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Small Edit Policy Banner if diff is present */}
        {policy && (
          <div
            className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
              policy.isSmallEdit
                ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                : "border-amber-800/60 bg-amber-950/30 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  policy.isSmallEdit ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>{policy.isSmallEdit ? "Small-Edit Policy: Met (Reasons Optional)" : "Substantive Edit: Reasons Recommended"}</span>
              <span className="ml-auto font-mono text-[11px] opacity-80">
                Δ {policy.characterDiff} chars {policy.formattingOnly && "(formatting only)"}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">{policy.explanation}</p>
          </div>
        )}

        {/* Diff Preview if present */}
        {hasDiff && (beforeText !== afterText) && (
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
              Content Diff Preview
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-2.5 font-mono overflow-x-auto max-h-32 text-rose-200">
                <div className="text-[10px] text-rose-400 font-semibold mb-1 uppercase">Before</div>
                <div className="whitespace-pre-wrap">{beforeText || "(empty)"}</div>
              </div>
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-2.5 font-mono overflow-x-auto max-h-32 text-emerald-200">
                <div className="text-[10px] text-emerald-400 font-semibold mb-1 uppercase">After</div>
                <div className="whitespace-pre-wrap">{afterText || "(empty)"}</div>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div role="alert" className="rounded-lg border border-rose-700 bg-rose-950/40 p-3 text-xs text-rose-200">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reason Taxonomy Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Reason Taxonomy Tags
              </label>
              <span className="text-[11px] text-slate-500">
                {selectedReasons.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {FEEDBACK_REASONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason.id);
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => toggleReason(reason.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/60 text-white shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-indigo-400" : "bg-slate-600"
                          }`}
                        />
                        {reason.label}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {reason.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {reason.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Curator Notes / Justification
            </label>
            <textarea
              rows={3}
              aria-label="Curator notes or justification"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add detailed editorial rationale, evidence references, or curator notes..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                mode === "reject"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  : mode === "accept"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
            >
              {isSubmitting
                ? "Submitting..."
                : mode === "reject"
                ? "Confirm Rejection"
                : mode === "accept"
                ? "Confirm Acceptance"
                : "Save & Apply Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
