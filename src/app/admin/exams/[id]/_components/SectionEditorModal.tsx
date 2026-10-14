import React, { useState, useEffect } from "react";
import { evaluateSmallEditPolicy, FEEDBACK_REASONS } from "@/app/admin/_lib/feedbackTaxonomy";
import type { InternalDeliverySection } from "@/app/admin/_lib/types";

export interface SectionEditorModalProps {
  section: InternalDeliverySection;
  originalSection?: InternalDeliverySection;
  isOpen: boolean;
  isSubmitting?: boolean;
  errorBanner?: string | null;
  onClose: () => void;
  onSave: (
    updatedSection: { title: string; passageMd: string; instructionsMd: string; audioUrl?: string | null },
    feedbackMeta?: { reasons: string[]; comment: string; idempotencyKey?: string }
  ) => Promise<void> | void;
}

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  section,
  originalSection,
  isOpen,
  isSubmitting = false,
  errorBanner = null,
  onClose,
  onSave,
}) => {
  const orig = originalSection || section;
  const [title, setTitle] = useState(section.title || "");
  const [audioUrl, setAudioUrl] = useState(section.audioUrl || "");
  const [passageMd, setPassageMd] = useState(section.passageMd || "");
  const [instructionsMd, setInstructionsMd] = useState(section.instructionsMd || "");

  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [curatorComment, setCuratorComment] = useState("");
  const [currentActionKey, setCurrentActionKey] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sec-action-${Date.now()}`
  );
  const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(section.title || "");
    setAudioUrl(section.audioUrl || "");
    setPassageMd(section.passageMd || "");
    setInstructionsMd(section.instructionsMd || "");
    setSelectedReasons([]);
    setCuratorComment("");
    setCurrentActionKey(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sec-action-${Date.now()}`);
    setIsReviewConfirmOpen(false);
    setLocalError(null);
  }, [section]);

  if (!isOpen) return null;

  const origTitle = orig.title || "";
  const origPassage = orig.passageMd || "";
  const origWords = origPassage.trim() ? origPassage.trim().split(/\s+/).length : 0;
  const newWords = passageMd.trim() ? passageMd.trim().split(/\s+/).length : 0;

  const origCombined = `Title: ${origTitle}\nPassage: ${origPassage}`;
  const newCombined = `Title: ${title}\nPassage: ${passageMd}`;
  const policy = evaluateSmallEditPolicy(origCombined, newCombined);

  const isTitleChanged = origTitle !== title;
  const isPassageChanged = origPassage !== passageMd;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsReviewConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setLocalError(null);
    try {
      await onSave(
        {
          title,
          passageMd,
          instructionsMd,
          audioUrl: audioUrl || null,
        },
        {
          reasons: selectedReasons,
          comment: curatorComment,
          idempotencyKey: currentActionKey,
        }
      );
    } catch (err) {
      setLocalError((err as Error).message || "Failed to update section");
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Section Modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      >
        <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Edit Section</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleInitialSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Section Title *
              </label>
              <input
                type="text"
                required
                aria-label="Section Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Passage (Markdown)
              </label>
              <textarea
                rows={6}
                aria-label="Passage Markdown"
                value={passageMd}
                onChange={(e) => setPassageMd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Inline Diff & Small-Edit Policy Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      policy.isSmallEdit ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span className="font-semibold text-slate-200">
                    {policy.isSmallEdit
                      ? "Small Edit Policy Met (Reasons Optional)"
                      : "Substantive Edit (Reasons Recommended)"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Δ {policy.characterDiff} chars (Words: {origWords} → {newWords})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
              >
                Review & Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirm-Before-Save Section Review Modal */}
      {isReviewConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review Substantive Section Edit"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Review Section Edit Confirmation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: <span className="text-indigo-300 font-medium">{origTitle || "Section"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {(localError || errorBanner) && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{localError || errorBanner}</span>
              </div>
            )}

            {/* Title Diff */}
            {isTitleChanged && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Section Title Diff:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-200">
                    <div className="text-[9px] uppercase font-semibold text-rose-400 mb-0.5">Original Title</div>
                    <div>{origTitle || "(empty)"}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-200">
                    <div className="text-[9px] uppercase font-semibold text-emerald-400 mb-0.5">Edited Title</div>
                    <div>{title || "(empty)"}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Passage Diff */}
            {isPassageChanged && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400">
                  <span>Passage Text Diff</span>
                  <span className="font-mono text-amber-400">Words: {origWords} → {newWords}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-200 font-mono overflow-x-auto max-h-36">
                    <div className="text-[9px] uppercase font-semibold text-rose-400 mb-1">Original Passage ({origWords} words)</div>
                    <div className="whitespace-pre-wrap">{origPassage || "(empty)"}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 font-mono overflow-x-auto max-h-36">
                    <div className="text-[9px] uppercase font-semibold text-emerald-400 mb-1">Edited Passage ({newWords} words)</div>
                    <div className="whitespace-pre-wrap">{passageMd || "(empty)"}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Taxonomy Reasons */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Select Reason Taxonomy Tags:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FEEDBACK_REASONS.map((r) => {
                  const isChecked = selectedReasons.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setSelectedReasons((prev) =>
                            prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          )
                        }
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200 text-xs">{r.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{r.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Curator Comments */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Curator Justification / Comment (Optional):
              </label>
              <textarea
                rows={2}
                value={curatorComment}
                onChange={(e) => setCuratorComment(e.target.value)}
                placeholder="Describe reason for passage/title revision..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsReviewConfirmOpen(false)}
                className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSave}
                className="px-5 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? "Saving..." : "Confirm & Save Section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
