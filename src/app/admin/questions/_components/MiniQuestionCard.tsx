"use client";

import React from "react";
import { QuestionBankItem } from "./types";
import { QuestionType } from "@/app/admin/_lib/types";
import { getMeta } from "@/app/admin/_lib/questionTypeRegistry";

interface MiniQuestionCardProps {
  item: QuestionBankItem;
}

function MiniMcq({ item }: { item: QuestionBankItem }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
      {(item.options || []).map((opt) => (
        <div
          key={opt.id || opt.idx}
          className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-2 ${
            opt.isCorrect
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-semibold"
              : "bg-slate-950/40 border-slate-800 text-slate-400"
          }`}
        >
          <span className="font-mono text-[10px] text-slate-500 shrink-0">#{opt.idx}</span>
          <span className="truncate">{opt.text}</span>
          {opt.isCorrect && (
            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold ml-auto shrink-0">
              Correct
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniMatching({ item }: { item: QuestionBankItem }) {
  const pairs = (item as unknown as { matchPairs?: Record<string, string[] | null> }).matchPairs || {};
  const opts = item.options || [];
  const pairKeys = Object.keys(pairs).sort();

  if (pairKeys.length === 0 && opts.length === 0) {
    return (
      <div className="text-[11px] text-amber-400/80 italic">
        No match data configured
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      {pairKeys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {pairKeys.map((k) => {
            const v = pairs[k];
            const answer = Array.isArray(v) ? v[0] : null;
            const display = Array.isArray(v) ? v[1] : null;
            return (
              <div
                key={k}
                className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/50 border border-slate-800 rounded px-2 py-1"
              >
                <span className="font-mono font-bold text-indigo-300 shrink-0">[{k}]</span>
                <span className="text-slate-500">→</span>
                <span className="font-mono font-bold text-emerald-300 shrink-0">[{answer}]</span>
                {display && (
                  <span className="text-slate-500 truncate flex-1" title={display}>
                    {display}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {opts.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider w-full mb-0.5">
            Choice Pool ({opts.length})
          </span>
          {opts.map((o) => (
            <span
              key={o.id || o.idx}
              className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
            >
              {o.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniCompletion({ item }: { item: QuestionBankItem }) {
  const blanks = (item as unknown as { blankAcceptTexts?: Record<string, string[]> }).blankAcceptTexts || {};
  const entries = Object.entries(blanks);

  if (entries.length === 0) {
    return (
      <div className="text-[11px] text-amber-400/80 italic">
        No accepted answers configured
      </div>
    );
  }
  return (
    <div className="space-y-1 pt-1">
      {entries.map(([key, vals]) => (
        <div
          key={key}
          className="flex items-center gap-2 text-[11px] text-slate-300"
        >
          <span className="font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            [{key}]
          </span>
          <span className="text-slate-400">→</span>
          <span className="font-mono">{Array.isArray(vals) ? vals.join(" / ") : String(vals)}</span>
        </div>
      ))}
    </div>
  );
}

function MiniFlowChart({ item }: { item: QuestionBankItem }) {
  const order = (item as unknown as { orderCorrects?: string[] }).orderCorrects || [];
  if (order.length === 0) {
    return <div className="text-[11px] text-amber-400/80 italic">No steps configured</div>;
  }
  return (
    <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-1">
      {order.map((step, i) => (
        <React.Fragment key={i}>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="font-mono text-indigo-400">{i + 1}</span>
            <span className="capitalize">{step.replace(/-/g, " ")}</span>
          </span>
          {i < order.length - 1 && (
            <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function MiniShortAnswer({ item }: { item: QuestionBankItem }) {
  const texts = (item as unknown as { shortAnswerAcceptTexts?: string[] }).shortAnswerAcceptTexts || [];
  if (texts.length === 0) {
    return <div className="text-[11px] text-amber-400/80 italic">No accepted answers</div>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {texts.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function MiniQuestionCard({ item }: MiniQuestionCardProps) {
  const meta = getMeta(item.type);
  const renderBody = () => {
    const t = item.type;
    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage ||
      t === QuestionType.MultipleChoiceMultiple ||
      t === QuestionType.TrueFalseNotGiven ||
      t === QuestionType.YesNoNotGiven
    ) {
      return <MiniMcq item={item} />;
    }
    if (
      t === QuestionType.MatchingHeading ||
      t === QuestionType.MatchingInformation ||
      t === QuestionType.MatchingFeatures ||
      t === QuestionType.MatchingEndings ||
      t === QuestionType.Classification
    ) {
      return <MiniMatching item={item} />;
    }
    if (
      t === QuestionType.SummaryCompletion ||
      t === QuestionType.TableCompletion ||
      t === QuestionType.NoteCompletion ||
      t === QuestionType.FormCompletion ||
      t === QuestionType.SentenceCompletion ||
      t === QuestionType.DiagramLabel ||
      t === QuestionType.MapLabel
    ) {
      return <MiniCompletion item={item} />;
    }
    if (t === QuestionType.FlowChart) {
      return <MiniFlowChart item={item} />;
    }
    if (t === QuestionType.ShortAnswer) {
      return <MiniShortAnswer item={item} />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {meta.shortLabel}
        </span>
        {(item.options || []).length > 0 && (
          <span className="text-[10px] text-slate-600">
            {(item.options || []).length} options
          </span>
        )}
      </div>
      {renderBody()}
    </div>
  );
}
