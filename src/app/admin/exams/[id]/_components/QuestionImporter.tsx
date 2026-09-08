"use client";

import { useState, useMemo } from "react";
import { AdminQuestionUpsert } from "@/app/admin/_lib/types";
import { QUESTION_TYPE_REGISTRY } from "@/app/admin/_lib/questionTypeRegistry";
import { createQuestion } from "@/app/admin/_lib/adminApi";

interface QuestionImporterProps {
  sectionId: string;
  onImported?: (count: number) => void;
  onCancel: () => void;
}

interface ParsedQuestion {
  raw: Record<string, unknown>;
  index: number;
  type: string;
  isValid: boolean;
  errors: string[];
  upsert: AdminQuestionUpsert | null;
}

function validateAndCoerce(raw: unknown, index: number, sectionId: string): ParsedQuestion {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { raw: {}, index, type: "?", isValid: false, errors: ["Not a JSON object"], upsert: null };
  }
  const obj = raw as Record<string, unknown>;

  const type = String(obj.type || "").toUpperCase();
  if (!QUESTION_TYPE_REGISTRY[type]) {
    errors.push(`Unknown type: ${type}`);
  }

  const skill = String(obj.skill || "READING").toUpperCase();
  if (!["READING", "LISTENING", "SPEAKING", "WRITING"].includes(skill)) {
    errors.push(`Invalid skill: ${skill}`);
  }

  const difficulty = Number(obj.difficulty ?? 1);
  if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
    errors.push(`Difficulty must be 1-5, got ${difficulty}`);
  }

  const promptMd = typeof obj.promptMd === "string" ? obj.promptMd : "";
  if (!promptMd.trim()) errors.push("promptMd is required");

  let options: Array<{ contentMd: string; isCorrect?: boolean }> | undefined;
  if (Array.isArray(obj.options)) {
    options = obj.options.map((o: unknown) => {
      if (o && typeof o === "object") {
        const oo = o as Record<string, unknown>;
        return {
          contentMd: String(oo.contentMd || ""),
          isCorrect: Boolean(oo.isCorrect),
        };
      }
      return { contentMd: String(o || "") };
    });
  }

  let matchPairs: Record<string, string[] | null> | undefined;
  if (obj.matchPairs && typeof obj.matchPairs === "object") {
    matchPairs = {};
    for (const [k, v] of Object.entries(obj.matchPairs as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        matchPairs[k] = v.map((x: unknown) => String(x));
      } else if (v === null) {
        matchPairs[k] = null;
      } else {
        errors.push(`matchPairs.${k} must be array or null`);
      }
    }
  }

  let blankAcceptTexts: Record<string, string[] | null> | undefined;
  if (obj.blankAcceptTexts && typeof obj.blankAcceptTexts === "object") {
    blankAcceptTexts = {};
    for (const [k, v] of Object.entries(obj.blankAcceptTexts as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        blankAcceptTexts[k] = v.map((x: unknown) => String(x));
      } else {
        errors.push(`blankAcceptTexts.${k} must be array`);
      }
    }
  }

  let orderCorrects: string[] | undefined;
  if (Array.isArray(obj.orderCorrects)) {
    orderCorrects = obj.orderCorrects.map((x: unknown) => String(x));
  }

  let shortAnswerAcceptTexts: string[] | undefined;
  if (Array.isArray(obj.shortAnswerAcceptTexts)) {
    shortAnswerAcceptTexts = obj.shortAnswerAcceptTexts.map((x: unknown) => String(x));
  }

  let shortAnswerAcceptRegex: string[] | undefined;
  if (Array.isArray(obj.shortAnswerAcceptRegex)) {
    shortAnswerAcceptRegex = obj.shortAnswerAcceptRegex.map((x: unknown) => String(x));
    for (const r of shortAnswerAcceptRegex) {
      try {
        new RegExp(r);
      } catch {
        errors.push(`Invalid regex: ${r}`);
      }
    }
  }

  const upsert: AdminQuestionUpsert = {
    SectionId: sectionId,
    Type: type,
    Skill: skill,
    Difficulty: difficulty,
    PromptMd: promptMd,
    ExplanationMd: typeof obj.explanationMd === "string" ? obj.explanationMd : null,
    ImageUrl: typeof obj.imageUrl === "string" ? obj.imageUrl : null,
    BlankAcceptTexts: blankAcceptTexts,
    BlankAcceptRegex: obj.blankAcceptRegex as Record<string, string[] | null> | undefined,
    MatchPairs: matchPairs,
    OrderCorrects: orderCorrects,
    ShortAnswerAcceptTexts: shortAnswerAcceptTexts,
    ShortAnswerAcceptRegex: shortAnswerAcceptRegex,
  };

  return {
    raw: obj,
    index,
    type: type || "?",
    isValid: errors.length === 0,
    errors,
    upsert: errors.length === 0 ? upsert : null,
  };
}

export function QuestionImporter({
  sectionId,
  onImported,
  onCancel,
}: QuestionImporterProps) {
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ index: number; ok: boolean; message: string }[]>(
    []
  );

  const parsed: ParsedQuestion[] = useMemo(() => {
    if (!text.trim()) return [];
    try {
      const json = JSON.parse(text);
      const arr = Array.isArray(json) ? json : [json];
      return arr.map((q, i) => validateAndCoerce(q, i, sectionId));
    } catch (e) {
      setParseError((e as Error).message);
      return [];
    }
  }, [text, sectionId]);

  const validCount = parsed.filter((p) => p.isValid).length;
  const invalidCount = parsed.length - validCount;

  const handleImport = async () => {
    if (validCount === 0) return;
    setImporting(true);
    setImportResults([]);
    const results: { index: number; ok: boolean; message: string }[] = [];
    for (const p of parsed) {
      if (!p.isValid || !p.upsert) continue;
      try {
        await createQuestion(p.upsert);
        results.push({ index: p.index, ok: true, message: "Created" });
      } catch (e) {
        results.push({
          index: p.index,
          ok: false,
          message: e instanceof Error ? e.message : "Failed",
        });
      }
    }
    setImportResults(results);
    setImporting(false);
    const okCount = results.filter((r) => r.ok).length;
    if (okCount > 0 && onImported) onImported(okCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Bulk Import Questions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste a JSON array of question payloads. Each must follow the Langfens schema.
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 text-xl">
            ✕
          </button>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setParseError(null);
              setImportResults([]);
            }}
            rows={10}
            placeholder={`[
  { "type": "CLASSIFICATION", "skill": "READING", "difficulty": 3, "promptMd": "...", "matchPairs": { "0": ["A"] } },
  { "type": "MULTIPLE_CHOICE_SINGLE", "skill": "READING", "difficulty": 2, "promptMd": "...", "options": [...] }
]`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />

          {parseError && (
            <div className="p-2 rounded-md bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300">
              JSON parse error: {parseError}
            </div>
          )}

          {parsed.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Parsed <strong className="text-slate-200">{parsed.length}</strong> question(s)
                </span>
                {validCount > 0 && (
                  <span className="text-emerald-400">
                    ✓ {validCount} valid
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="text-rose-400">
                    ✗ {invalidCount} invalid
                  </span>
                )}
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {parsed.map((p) => (
                  <div
                    key={p.index}
                    className={`p-2 rounded-md text-[11px] border ${
                      p.isValid
                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200"
                        : "bg-rose-950/20 border-rose-900/40 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono">#{p.index + 1}</span>
                      <span className="font-bold">{p.type}</span>
                      {p.upsert && (
                        <span className="text-slate-400">
                          {p.upsert.Skill} · Diff {p.upsert.Difficulty}
                        </span>
                      )}
                    </div>
                    {p.errors.length > 0 && (
                      <ul className="mt-1 ml-2 space-y-0.5 text-rose-300/80">
                        {p.errors.map((e, i) => (
                          <li key={i}>· {e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResults.length > 0 && (
            <div className="p-3 rounded-md bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-1">Import Results</div>
              <ul className="text-[11px] space-y-0.5">
                {importResults.map((r, i) => (
                  <li
                    key={i}
                    className={r.ok ? "text-emerald-300" : "text-rose-300"}
                  >
                    #{r.index + 1}: {r.ok ? "✓" : "✗"} {r.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <a
            href="https://github.com/your-org/langfens/blob/main/docs/question-schemas.md"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300"
          >
            View schema reference →
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {importing
                ? "Importing…"
                : `Import ${validCount} question${validCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
