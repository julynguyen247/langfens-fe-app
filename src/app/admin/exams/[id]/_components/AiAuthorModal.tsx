"use client";

import { useState } from "react";
import { AdminQuestionUpsert } from "@/app/admin/_lib/types";
import { QUESTION_TYPE_REGISTRY, listByCategory } from "@/app/admin/_lib/questionTypeRegistry";
import { getLlmPrompt } from "@/app/admin/_lib/llmPrompts";
import { getSchema } from "@/app/admin/_lib/questionSchemas";
import { AiConfig, DEFAULT_AI_CONFIG, callAi, tryParseLlmJson, isAiConfigured } from "@/app/admin/_lib/aiConfig";
import { createQuestion, createOption } from "@/app/admin/_lib/adminApi";
import { validateQuestionPayload } from "@/app/admin/_lib/validation";

interface AiAuthorModalProps {
  sectionId: string;
  onGenerated?: (count: number) => void;
  onCancel: () => void;
}

interface ParsedAuthorOption {
  idx: number;
  contentMd: string;
  isCorrect: boolean;
}

interface ParsedAuthorQuestion {
  upsert: AdminQuestionUpsert;
  options?: ParsedAuthorOption[];
}

export function AiAuthorModal({ sectionId, onGenerated, onCancel }: AiAuthorModalProps) {
  const [type, setType] = useState<string>("CLASSIFICATION");
  const [count, setCount] = useState<number>(1);
  const [passage, setPassage] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [config] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [generating, setGenerating] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedAuthorQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const configured = isAiConfigured(config);
  const prompt = getLlmPrompt(type);
  const schema = getSchema(type);
  const typeMeta = QUESTION_TYPE_REGISTRY[type];

  const handleGenerate = async () => {
    if (!configured) {
      setError(
        config.provider === "server-proxy"
          ? "AI endpoint not configured. Set NEXT_PUBLIC_AI_SERVICE_URL or NEXT_PUBLIC_GATEWAY_URL."
          : "AI not configured. Set NEXT_PUBLIC_AI_API_KEY in .env.local"
      );
      return;
    }
    if (!prompt) {
      setError(`No LLM prompt template for type ${type}. Add one in llmPrompts.ts.`);
      return;
    }
    if (!passage.trim()) {
      setError("Source passage is required.");
      return;
    }

    setError(null);
    setResultText(null);
    setParsedQuestions(null);
    setSavedCount(0);
    setGenerating(true);

    try {
      const userPrompt = prompt.userTemplate(passage, count, {
        difficulty: String(typeMeta.defaultDifficulty),
        extra: extraContext,
      });
      const text = await callAi(config, prompt.system, userPrompt, {
        type,
        skill: "READING",
        count,
        difficulty: Math.max(1, Math.min(5, Number(typeMeta.defaultDifficulty) || 3)),
        passage: passage.trim(),
        extraContext: extraContext.trim(),
      });
      setResultText(text);
      const parsed = tryParseLlmJson(text);
      if (!parsed) {
        setError("LLM output could not be parsed as JSON. See response below.");
      } else {
        const enriched: ParsedAuthorQuestion[] = parsed.map((q) => {
          const obj = (q as Record<string, unknown>) || {};
          const rawOptions = Array.isArray(obj.options) ? obj.options : [];
          const mappedOptions: ParsedAuthorOption[] = rawOptions.map((o: Record<string, unknown>, idx: number) => ({
            idx: typeof o.idx === "number" ? o.idx : idx + 1,
            contentMd: String(o.contentMd || o.text || ""),
            isCorrect: Boolean(o.isCorrect),
          }));

          const upsert: AdminQuestionUpsert = {
            SectionId: sectionId,
            Type: String(obj.type || type).toUpperCase(),
            Skill: String(obj.skill || "READING").toUpperCase(),
            Difficulty: Math.max(1, Math.min(5, Number(obj.difficulty ?? typeMeta.defaultDifficulty))),
            PromptMd: String(obj.promptMd || ""),
            ExplanationMd: typeof obj.explanationMd === "string" ? obj.explanationMd : null,
            ImageUrl: typeof obj.imageUrl === "string" ? obj.imageUrl : null,
            MatchPairs: obj.matchPairs as AdminQuestionUpsert["MatchPairs"],
            BlankAcceptTexts: obj.blankAcceptTexts as AdminQuestionUpsert["BlankAcceptTexts"],
            BlankAcceptRegex: obj.blankAcceptRegex as AdminQuestionUpsert["BlankAcceptRegex"],
            OrderCorrects: obj.orderCorrects as AdminQuestionUpsert["OrderCorrects"],
            ShortAnswerAcceptTexts: obj.shortAnswerAcceptTexts as AdminQuestionUpsert["ShortAnswerAcceptTexts"],
            ShortAnswerAcceptRegex: obj.shortAnswerAcceptRegex as AdminQuestionUpsert["ShortAnswerAcceptRegex"],
          };

          return {
            upsert,
            options: mappedOptions.length > 0 ? mappedOptions : undefined,
          };
        });

        const validationErrors: string[] = [];
        for (let i = 0; i < enriched.length; i++) {
          const { upsert: eq, options: optList } = enriched[i];
          const issues = validateQuestionPayload({
            type: eq.Type,
            skill: eq.Skill,
            difficulty: eq.Difficulty,
            promptMd: eq.PromptMd,
            explanationMd: eq.ExplanationMd,
            imageUrl: eq.ImageUrl,
            options: optList,
            blankAcceptTexts: eq.BlankAcceptTexts,
            blankAcceptRegex: eq.BlankAcceptRegex,
            matchPairs: eq.MatchPairs,
            orderCorrects: eq.OrderCorrects,
            shortAnswerAcceptTexts: eq.ShortAnswerAcceptTexts,
            shortAnswerAcceptRegex: eq.ShortAnswerAcceptRegex,
          });
          for (const iss of issues) {
            if (iss.level === "error") {
              validationErrors.push(`Q#${i + 1} [${iss.field}]: ${iss.message}`);
            }
          }
        }
        if (validationErrors.length > 0) {
          setError(`Generated question(s) failed validation:\n${validationErrors.join("\n")}`);
        }
        setParsedQuestions(enriched);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI call failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!parsedQuestions || parsedQuestions.length === 0) return;
    setSaving(true);
    let saved = 0;
    try {
      for (const item of parsedQuestions) {
        const created = await createQuestion(item.upsert);
        if (created?.id && item.options && item.options.length > 0) {
          for (const opt of item.options) {
            await createOption({
              QuestionId: created.id,
              Idx: opt.idx,
              ContentMd: opt.contentMd,
              IsCorrect: opt.isCorrect,
            });
          }
        }
        saved++;
        setSavedCount(saved);
      }
      onGenerated?.(saved);
      onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>✨</span> AI Author Question
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate question content using a large language model.
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 text-xl">
            ✕
          </button>
        </div>

        {!configured && (
          <div className="mx-6 mt-4 p-3 rounded-md bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200">
            ⚠ AI is not configured.{" "}
            {config.provider === "server-proxy" ? (
              <>
                Set <code className="px-1 bg-slate-800 rounded">NEXT_PUBLIC_GATEWAY_URL</code> or{" "}
                <code className="px-1 bg-slate-800 rounded">NEXT_PUBLIC_AI_SERVICE_URL</code> to enable generation.
              </>
            ) : (
              <>
                Set <code className="px-1 bg-slate-800 rounded">NEXT_PUBLIC_AI_API_KEY</code> in{" "}
                <code className="px-1 bg-slate-800 rounded">.env.local</code> to enable generation.
              </>
            )}
            {" "}The schema reference below is still available for manual authoring.
          </div>
        )}

        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Question Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {listByCategory("mcq")
                  .concat(listByCategory("completion"))
                  .concat(listByCategory("matching"))
                  .concat(listByCategory("ordering"))
                  .concat(listByCategory("speaking"))
                  .map((m) => (
                    <option key={m.type} value={m.type}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Number of questions
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(5, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Source passage / content *
            </label>
            <textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              rows={5}
              placeholder="Paste the reading passage, listening transcript, or speaking topic…"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Extra instructions (optional)
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              rows={2}
              placeholder="e.g. 'focus on paragraph 2' or 'use 3 categories only'"
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <details className="text-[11px] text-slate-400">
            <summary className="cursor-pointer hover:text-slate-200">
              View {schema.label} schema
            </summary>
            <pre className="mt-2 p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto font-mono">
              {schema.jsonShape}
            </pre>
            {schema.constraints.length > 0 && (
              <ul className="mt-2 ml-3 space-y-0.5 text-amber-300/80">
                {schema.constraints.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            )}
          </details>

          {error && (
            <div className="p-3 rounded-md bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 whitespace-pre-wrap">
              {error}
            </div>
          )}

          {resultText && (
            <details className="text-[11px]">
              <summary className="cursor-pointer text-slate-300">
                Raw LLM response
              </summary>
              <pre className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                {resultText}
              </pre>
            </details>
          )}

          {parsedQuestions && parsedQuestions.length > 0 && (
            <div className="p-3 rounded-md bg-emerald-950/20 border border-emerald-900/40">
              <div className="text-xs font-bold text-emerald-200 mb-2">
                ✓ Parsed {parsedQuestions.length} question(s) — review then save
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {parsedQuestions.map((item, i) => (
                  <div key={i} className="text-[11px] text-emerald-200/80 flex items-center gap-2">
                    <span className="font-mono">#{i + 1}</span>
                    <span className="font-bold">{item.upsert.Type}</span>
                    <span className="truncate flex-1">{(item.upsert.PromptMd || "").slice(0, 80)}…</span>
                    {item.options && (
                      <span className="text-slate-400 text-[10px]">({item.options.length} options)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedCount > 0 && (
            <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-200">
              ✓ Saved {savedCount} question(s) to the section.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          {parsedQuestions ? (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : `Save ${parsedQuestions.length} to section`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!configured || generating}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
