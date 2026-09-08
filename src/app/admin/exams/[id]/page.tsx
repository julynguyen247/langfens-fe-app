"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getFullExamForEditor,
  updateExam,
  createSection,
  updateSection,
  deleteSection,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
} from "@/app/admin/_lib/adminApi";
import {
  AdminExamUpdate,
  AdminQuestionUpdate,
  AdminQuestionUpsert,
  AdminSectionUpdate,
  AdminSectionUpsert,
  ExamCategory,
  ExamLevel,
  ExamStatus,
  InternalDeliveryExam,
  InternalDeliveryOption,
  InternalDeliveryQuestion,
  InternalDeliverySection,
  QuestionSkill,
  QuestionType,
} from "@/app/admin/_lib/types";
import { QuestionEditor } from "./_components/QuestionEditor";

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    if ("response" in err && err.response && typeof err.response === "object") {
      const resp = err.response;
      if ("data" in resp && resp.data && typeof resp.data === "object") {
        const data = resp.data;
        if ("message" in data && typeof data.message === "string") {
          return data.message;
        }
      }
    } else if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "An unexpected error occurred";
}

export default function AdminExamEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  const [exam, setExam] = useState<InternalDeliveryExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meta edit form state
  const [metaDraft, setMetaDraft] = useState<AdminExamUpdate>({
    Title: "",
    DescriptionMd: "",
    Category: ExamCategory.IELTS,
    Level: ExamLevel.B2,
    DurationMin: 60,
    Status: ExamStatus.Draft,
    ImageUrl: "",
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSuccess, setMetaSuccess] = useState(false);

  // Add Section Modal State
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<AdminSectionUpsert>({
    ExamId: examId,
    Title: "",
    InstructionsMd: "",
    PassageMd: "",
    AudioUrl: "",
    TranscriptMd: "",
  });
  const [savingSection, setSavingSection] = useState(false);

  // Edit Section Modal State
  const [editingSection, setEditingSection] = useState<InternalDeliverySection | null>(null);
  const [updatingSection, setUpdatingSection] = useState(false);

  // Add Question Modal State
  const [targetSectionForNewQuestion, setTargetSectionForNewQuestion] = useState<string | null>(null);
  const [newQuestionType, setNewQuestionType] = useState<string>(QuestionType.MultipleChoiceSingle);
  const [newQuestionSkill, setNewQuestionSkill] = useState<string>(QuestionSkill.Reading);
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const loadExam = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFullExamForEditor(examId);
      setExam(data);
      setMetaDraft({
        Title: data.title || "",
        DescriptionMd: data.descriptionMd || "",
        Category: data.category || ExamCategory.IELTS,
        Level: data.level || ExamLevel.B2,
        DurationMin: data.durationMin || 60,
        Status: ExamStatus.Draft,
        ImageUrl: data.imageUrl || "",
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExam();
  }, [examId]);

  // ── Exam Meta Save ─────────────────────────────────────────────────────────
  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMeta(true);
      await updateExam(examId, metaDraft);
      setMetaSuccess(true);
      setTimeout(() => setMetaSuccess(false), 3000);
      if (exam) {
        setExam({
          ...exam,
          title: metaDraft.Title,
          descriptionMd: metaDraft.DescriptionMd,
          category: metaDraft.Category,
          level: metaDraft.Level,
          durationMin: metaDraft.DurationMin,
          imageUrl: metaDraft.ImageUrl,
        });
      }
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    } finally {
      setSavingMeta(false);
    }
  };

  // ── Section Actions ────────────────────────────────────────────────────────
  const handleCreateSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionDraft.Title.trim()) {
      alert("Section title is required");
      return;
    }

    try {
      setSavingSection(true);
      const newSec = await createSection({
        ...sectionDraft,
        ExamId: examId,
        InstructionsMd: sectionDraft.InstructionsMd?.trim() || null,
        PassageMd: sectionDraft.PassageMd?.trim() || null,
        AudioUrl: sectionDraft.AudioUrl?.trim() || null,
        TranscriptMd: sectionDraft.TranscriptMd?.trim() || null,
      });

      setIsAddSectionOpen(false);
      setSectionDraft({
        ExamId: examId,
        Title: "",
        InstructionsMd: "",
        PassageMd: "",
        AudioUrl: "",
        TranscriptMd: "",
      });

      await loadExam();
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    } finally {
      setSavingSection(false);
    }
  };

  const handleUpdateSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editingSection.id) return;

    try {
      setUpdatingSection(true);
      const updateDto: AdminSectionUpdate = {
        ExamId: examId,
        Idx: editingSection.idx,
        Title: editingSection.title,
        InstructionsMd: editingSection.instructionsMd || null,
        PassageMd: editingSection.passageMd || null,
        AudioUrl: editingSection.audioUrl || null,
        TranscriptMd: editingSection.transcriptMd || null,
      };

      await updateSection(editingSection.id, updateDto);
      setEditingSection(null);
      await loadExam();
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    } finally {
      setUpdatingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId?: string, title?: string) => {
    if (!sectionId) {
      alert("Cannot delete section without a database ID. Please refresh.");
      return;
    }

    if (!window.confirm(`Delete section "${title || "Section"}" and all its questions?`)) {
      return;
    }

    try {
      await deleteSection(sectionId);
      await loadExam();
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    }
  };

  // ── Question Actions ───────────────────────────────────────────────────────
  const handleAddQuestionToSection = async (sectionId: string) => {
    try {
      setCreatingQuestion(true);
      const targetSec = exam?.sections.find((s) => s.id === sectionId);
      const nextIdx =
        targetSec && targetSec.questions.length > 0
          ? Math.max(...targetSec.questions.map((q) => q.idx)) + 1
          : 1;

      const upsertDto: AdminQuestionUpsert = {
        SectionId: sectionId,
        Idx: nextIdx,
        Type: newQuestionType,
        Skill: newQuestionSkill,
        Difficulty: 1,
        PromptMd: `Question ${nextIdx} prompt`,
        ExplanationMd: null,
      };

      const created = await createQuestion(upsertDto);
      setTargetSectionForNewQuestion(null);
      await loadExam();
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleSaveQuestion = async (
    sectionId: string,
    updatedQ: InternalDeliveryQuestion
  ) => {
    if (!updatedQ.id) {
      throw new Error("Question lacks database UUID. Refresh exam paper.");
    }

    const updateDto: AdminQuestionUpdate = {
      SectionId: sectionId,
      Idx: updatedQ.idx,
      Type: updatedQ.type,
      Skill: updatedQ.skill,
      Difficulty: updatedQ.difficulty,
      PromptMd: updatedQ.promptMd || null,
      ExplanationMd: updatedQ.explanationMd || null,
      BlankAcceptTexts: updatedQ.blankAcceptTexts || null,
      BlankAcceptRegex: updatedQ.blankAcceptRegex || null,
      MatchPairs: updatedQ.matchPairs || null,
      OrderCorrects: updatedQ.orderCorrects || null,
      ShortAnswerAcceptTexts: updatedQ.shortAnswerAcceptTexts || null,
      ShortAnswerAcceptRegex: updatedQ.shortAnswerAcceptRegex || null,
    };

    await updateQuestion(updatedQ.id, updateDto);

    // If question has options (MCQ / Heading choices), persist option rows
    if (updatedQ.options && updatedQ.options.length > 0) {
      for (const opt of updatedQ.options) {
        if (opt.id && !opt.id.startsWith("temp-") && !opt.id.startsWith("preset-")) {
          // update existing
          try {
            await updateOption(opt.id, {
              QuestionId: updatedQ.id,
              Idx: opt.idx,
              ContentMd: opt.contentMd,
              IsCorrect: Boolean(opt.isCorrect),
            });
          } catch {
            // ignore individual option update errors
          }
        } else {
          // create new
          try {
            await createOption({
              QuestionId: updatedQ.id,
              Idx: opt.idx,
              ContentMd: opt.contentMd,
              IsCorrect: Boolean(opt.isCorrect),
            });
          } catch {
            // ignore
          }
        }
      }
    }
  };

  const handleDeleteQuestion = async (questionId?: string, idx?: number) => {
    if (!questionId) {
      alert("Question missing database UUID. Refresh exam paper.");
      return;
    }

    if (!window.confirm(`Delete Question #${idx || ""}?`)) return;

    try {
      await deleteQuestion(questionId);
      await loadExam();
    } catch (err: unknown) {
      alert(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading full exam paper...</span>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/50">
          <h2 className="text-lg font-bold text-rose-400">Unable to load exam</h2>
          <p className="mt-2 text-sm text-slate-400">{error || "Exam not found"}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={loadExam}
              className="px-4 py-2 text-xs font-semibold bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 rounded-lg transition"
            >
              Retry
            </button>
            <Link
              href="/admin/exams"
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Back to Exams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{exam.title}</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                {exam.slug}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {exam.category} • Level {exam.level} • {exam.durationMin} mins • {exam.sections.length} sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Section
          </button>
        </div>
      </div>

      {/* Exam Metadata Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <form onSubmit={handleSaveMeta} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Exam Configuration
            </h2>
            <div className="flex items-center gap-3">
              {metaSuccess && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800">
                  Settings saved
                </span>
              )}
              <button
                type="submit"
                disabled={savingMeta}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              >
                {savingMeta ? "Saving..." : "Save Exam Info"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                required
                value={metaDraft.Title}
                onChange={(e) => setMetaDraft({ ...metaDraft, Title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Status
              </label>
              <select
                value={metaDraft.Status}
                onChange={(e) => setMetaDraft({ ...metaDraft, Status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(ExamStatus).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={metaDraft.Category}
                onChange={(e) => setMetaDraft({ ...metaDraft, Category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(ExamCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Level
              </label>
              <select
                value={metaDraft.Level}
                onChange={(e) => setMetaDraft({ ...metaDraft, Level: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(ExamLevel).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Duration (Min)
              </label>
              <input
                type="number"
                min={1}
                max={360}
                value={metaDraft.DurationMin}
                onChange={(e) =>
                  setMetaDraft({ ...metaDraft, DurationMin: Number(e.target.value) || 60 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Sections and Questions Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Sections & Question Items ({exam.sections.length})
          </h2>
        </div>

        {exam.sections.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
            <p className="text-sm text-slate-400">This exam currently has no sections.</p>
            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Add First Section
            </button>
          </div>
        ) : (
          exam.sections.map((section) => (
            <div
              key={section.id || section.idx}
              className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden space-y-4 p-6"
            >
              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                    S{section.idx}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{section.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      {section.audioUrl ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Audio attached
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No audio recording</span>
                      )}
                      {section.passageMd && (
                        <span>Reading passage: {section.passageMd.length} chars</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(section)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                  >
                    Edit Section Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!section.id) {
                        alert("Section lacks database ID. Please reload.");
                        return;
                      }
                      setTargetSectionForNewQuestion(section.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Question
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(section.id, section.title)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Delete section"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Passage preview if available */}
              {section.passageMd && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                    Passage Excerpt:
                  </span>
                  <p className="line-clamp-3 leading-relaxed font-serif text-slate-400">
                    {section.passageMd}
                  </p>
                </div>
              )}

              {/* Question groups instructions if any */}
              {section.questionGroups &&
                section.questionGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-300"
                  >
                    <span className="font-bold">
                      Group {grp.idx} (Q{grp.startIdx} - Q{grp.endIdx}):
                    </span>{" "}
                    {grp.instructionMd}
                  </div>
                ))}

              {/* Questions list */}
              <div className="space-y-4 pt-2">
                {section.questions.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                    No questions in this section yet. Click &ldquo;Add Question&rdquo; above.
                  </div>
                ) : (
                  section.questions.map((question) => (
                    <QuestionEditor
                      key={question.id ? `${section.id}-${question.id}-${question.idx}` : `q-${section.id}-${question.idx}`}
                      question={question}
                      sectionId={section.id || ""}
                      sectionAudioUrl={section.audioUrl}
                      onSave={(updated) => handleSaveQuestion(section.id || "", updated)}
                      onDelete={handleDeleteQuestion}
                    />
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Section */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add Exam Section</h2>
              <button
                onClick={() => setIsAddSectionOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSectionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passage 1: The Secret Life of Plants"
                  value={sectionDraft.Title}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, Title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Audio URL (Required for Listening sections)
                </label>
                <input
                  type="url"
                  placeholder="https://.../listening-part1.mp3"
                  value={sectionDraft.AudioUrl || ""}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, AudioUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Reading Passage (Markdown)
                </label>
                <textarea
                  rows={6}
                  placeholder="Full reading passage text..."
                  value={sectionDraft.PassageMd || ""}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, PassageMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Instructions (Markdown)
                </label>
                <textarea
                  rows={2}
                  placeholder="Section-level instructions..."
                  value={sectionDraft.InstructionsMd || ""}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, InstructionsMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {savingSection ? "Creating..." : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Section */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Edit Section</h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSectionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Audio URL (Required for Listening)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingSection.audioUrl || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, audioUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Passage (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={editingSection.passageMd || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, passageMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Instructions (Markdown)
                </label>
                <textarea
                  rows={2}
                  value={editingSection.instructionsMd || ""}
                  onChange={(e) => setEditingSection({ ...editingSection, instructionsMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSection}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {updatingSection ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Question Type Selector */}
      {targetSectionForNewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Add Question</h2>
              <button
                onClick={() => setTargetSectionForNewQuestion(null)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Question Type
                </label>
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {Object.values(QuestionType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Skill
                </label>
                <select
                  value={newQuestionSkill}
                  onChange={(e) => setNewQuestionSkill(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {Object.values(QuestionSkill).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetSectionForNewQuestion(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingQuestion}
                  onClick={() => handleAddQuestionToSection(targetSectionForNewQuestion)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {creatingQuestion ? "Creating..." : "Create Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
