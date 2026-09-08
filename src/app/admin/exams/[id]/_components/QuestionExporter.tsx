"use client";

import { useState } from "react";
import { InternalDeliveryQuestion } from "@/app/admin/_lib/types";
import { getSchema } from "@/app/admin/_lib/questionSchemas";

interface QuestionExporterProps {
  question: InternalDeliveryQuestion;
  onCopied?: () => void;
}

function buildExportPayload(q: InternalDeliveryQuestion) {
  const payload: Record<string, unknown> = {
    type: q.type,
    skill: q.skill,
    difficulty: q.difficulty,
    promptMd: q.promptMd || "",
    explanationMd: q.explanationMd || null,
  };

  if (q.imageUrl) payload.imageUrl = q.imageUrl;
  if (q.options && q.options.length > 0) {
    payload.options = q.options.map((o) => {
      const out: Record<string, unknown> = { contentMd: o.contentMd };
      if (o.imageUrl) out.imageUrl = o.imageUrl;
      if (o.altText) out.altText = o.altText;
      if (q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "YES_NO_NOT_GIVEN") {
        out.isCorrect = Boolean(o.isCorrect);
      } else {
        out.isCorrect = Boolean(o.isCorrect);
      }
      return out;
    });
  }
  if (q.blankAcceptTexts) payload.blankAcceptTexts = q.blankAcceptTexts;
  if (q.blankAcceptRegex) payload.blankAcceptRegex = q.blankAcceptRegex;
  if (q.matchPairs) payload.matchPairs = q.matchPairs;
  if (q.orderCorrects) payload.orderCorrects = q.orderCorrects;
  if (q.shortAnswerAcceptTexts) payload.shortAnswerAcceptTexts = q.shortAnswerAcceptTexts;
  if (q.shortAnswerAcceptRegex) payload.shortAnswerAcceptRegex = q.shortAnswerAcceptRegex;

  return payload;
}

export function QuestionExporter({ question, onCopied }: QuestionExporterProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [includeSchema, setIncludeSchema] = useState(true);

  const payload = buildExportPayload(question);
  const schema = getSchema(question.type);

  const fullText = includeSchema
    ? `// Question type: ${schema.label}\n// Constraints: ${schema.constraints.join("; ")}\n\n${JSON.stringify(payload, null, 2)}`
    : JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition"
        title="Copy question as JSON"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Copy Question as JSON</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste into an LLM conversation as a few-shot example.
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-xl">
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={includeSchema}
              onChange={(e) => setIncludeSchema(e.target.checked)}
              className="rounded"
            />
            Include schema header (constraints + example) for LLM context
          </label>

          <pre className="p-3 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-96 overflow-y-auto font-mono">
            {fullText}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            {copied ? "✓ Copied" : "Copy to clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
