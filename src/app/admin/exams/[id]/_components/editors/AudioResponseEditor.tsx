"use client";

import { useState } from "react";

interface AudioResponseEditorProps {
  promptMd?: string | null;
  explanationMd?: string | null;
  onPromptChange?: (v: string) => void;
}

function parseCueCard(prompt: string | null | undefined): {
  mainQuestion: string;
  bullets: string[];
} {
  const text = (prompt || "").replace(/\\n/g, "\n").trim();
  const lines = text.split("\n");
  const mainQuestion = lines[0]?.trim() || "";
  const bullets = lines
    .slice(1)
    .map((l) => l.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
  return { mainQuestion, bullets };
}

function buildCueCard(mainQuestion: string, bullets: string[]): string {
  const lines = [mainQuestion.trim()];
  for (const b of bullets) {
    if (b.trim()) lines.push(`- ${b.trim()}`);
  }
  return lines.join("\n");
}

export function AudioResponseEditor({
  promptMd,
  explanationMd,
  onPromptChange,
}: AudioResponseEditorProps) {
  const parsed = parseCueCard(promptMd);
  const [mainQuestion, setMainQuestion] = useState(parsed.mainQuestion);
  const [bullets, setBullets] = useState<string[]>(
    parsed.bullets.length > 0 ? parsed.bullets : ["", "", "", ""]
  );
  const [prepTime, setPrepTime] = useState<number>(60);
  const [speakTime, setSpeakTime] = useState<number>(120);

  const persist = (nextMain: string, nextBullets: string[]) => {
    if (onPromptChange) onPromptChange(buildCueCard(nextMain, nextBullets));
  };

  const updateBullet = (idx: number, val: string) => {
    const next = bullets.map((b, i) => (i === idx ? val : b));
    setBullets(next);
    persist(mainQuestion, next);
  };

  const addBullet = () => {
    const next = [...bullets, ""];
    setBullets(next);
    persist(mainQuestion, next);
  };

  const removeBullet = (idx: number) => {
    const next = bullets.filter((_, i) => i !== idx);
    setBullets(next);
    persist(mainQuestion, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Speaking Task — Cue Card
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Main Question
        </label>
        <input
          type="text"
          value={mainQuestion}
          onChange={(e) => {
            setMainQuestion(e.target.value);
            persist(e.target.value, bullets);
          }}
          placeholder="e.g. Describe a memorable journey you have taken."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bullet Points
          </label>
          <button
            type="button"
            onClick={addBullet}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add bullet
          </button>
        </div>
        <div className="space-y-1.5">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-500 font-bold text-xs">•</span>
              <input
                type="text"
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                placeholder="What should the candidate talk about?"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => removeBullet(i)}
                className="p-1 text-slate-500 hover:text-rose-400 transition"
                title="Remove bullet"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Preparation (sec)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={prepTime}
            onChange={(e) => setPrepTime(Number(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Speaking (sec)
          </label>
          <input
            type="number"
            min={0}
            max={600}
            value={speakTime}
            onChange={(e) => setSpeakTime(Number(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
        <strong>How grading works:</strong> This task records the candidate&apos;s audio and is sent to the
        AI Speaking service for evaluation (fluency, pronunciation, lexical resource, grammatical
        range, coherence). Ensure the prompt above contains clear instructions for the candidate.
        Time settings are informational only — actual timers are enforced by the speaking UI.
        {explanationMd && (
          <details className="mt-2">
            <summary className="cursor-pointer text-indigo-300/80">
              Show stored explanation
            </summary>
            <p className="mt-1 text-slate-300">{explanationMd}</p>
          </details>
        )}
      </div>
    </div>
  );
}
