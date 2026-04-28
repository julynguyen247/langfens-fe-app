// components/writing/WritingGradeResult.tsx
"use client";

import { useState } from "react";
import { ScoreHeader } from "../common/ScoreHeader";

type BandDetail = {
  band: number;
  comment: string;
};

export type WritingGradeRes = {
  submissionId: string;
  taskText: string;
  essayRaw: string;
  essayNormalized: string;
  wordCount: number;
  overallBand: number;
  taskResponse: BandDetail;
  coherenceAndCohesion: BandDetail;
  lexicalResource: BandDetail;
  grammaticalRangeAndAccuracy: BandDetail;
  suggestions: string[];
  improvedParagraph: string;
  model: string;
  modelProvider: string;
  gradedAt: string;
  timeSpentSeconds?: number;
};

export function WritingGradeResult({ data }: { data: WritingGradeRes }) {
  const [showModel, setShowModel] = useState(false);

  const criteria = [
    { name: "Task Response", score: data.taskResponse.band },
    { name: "Coherence", score: data.coherenceAndCohesion.band },
    { name: "Lexical", score: data.lexicalResource.band },
    { name: "Grammar", score: data.grammaticalRangeAndAccuracy.band },
  ];

  const timeMinutes = data.timeSpentSeconds
    ? Math.floor(data.timeSpentSeconds / 60)
    : null;

  // Build critique content
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (data.taskResponse.band >= 6)
    strengths.push(`Task Response: ${data.taskResponse.comment}`);
  else weaknesses.push(`Task Response: ${data.taskResponse.comment}`);

  if (data.coherenceAndCohesion.band >= 6)
    strengths.push(`Coherence: ${data.coherenceAndCohesion.comment}`);
  else weaknesses.push(`Coherence: ${data.coherenceAndCohesion.comment}`);

  if (data.lexicalResource.band >= 6)
    strengths.push(`Vocabulary: ${data.lexicalResource.comment}`);
  else weaknesses.push(`Vocabulary: ${data.lexicalResource.comment}`);

  if (data.grammaticalRangeAndAccuracy.band >= 6)
    strengths.push(`Grammar: ${data.grammaticalRangeAndAccuracy.comment}`);
  else weaknesses.push(`Grammar: ${data.grammaticalRangeAndAccuracy.comment}`);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Score Header */}
      <div className="rounded-[1.5rem] overflow-hidden shadow-[0_4px_0_rgba(0,0,0,0.08)] border-[3px] border-[var(--border)]">
        <ScoreHeader band={data.overallBand} criteria={criteria} skill="writing" />
      </div>

      {/* Task Prompt (Subtle) */}
      <div className="bg-[var(--background)] border-[3px] border-[var(--border)] rounded-[1.5rem] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Task Prompt
          </h3>
        </div>
        <p className="text-sm text-[var(--text-body)] leading-relaxed">{data.taskText}</p>
      </div>

      {/* Feedback Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: The Essay (Paper View) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8">
            <h3 className="text-sm font-bold text-[var(--text-muted)] tracking-wider mb-4">
              Your Submission
            </h3>
            <div className="prose prose-neutral font-sans text-lg leading-loose text-[var(--foreground)] whitespace-pre-line">
              {data.essayRaw}
            </div>
            <div className="mt-6 pt-6 border-t border-[var(--border-light)] flex justify-between text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                {data.wordCount} words
              </span>
              {timeMinutes && (
                <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  {timeMinutes}m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Examiner's Notes (Sidebar) */}
        <div className="space-y-6">
          {/* Examiner's Critique */}
          <div className="bg-[var(--primary-light)] border-[3px] border-[var(--border)] rounded-[1.5rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
            <h3 className="font-bold mb-4" style={{ color: 'var(--primary-dark)' }}>
              Examiner's Critique
            </h3>
            <div className="space-y-4 text-sm text-[var(--text-body)] leading-relaxed">
              {strengths.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--skill-speaking)] mb-1 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--skill-speaking)] text-white text-[10px] font-bold flex-shrink-0">+</span>
                    Strengths
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-body)]">
                    {strengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-xs">{s.split(":")[0]}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--skill-writing)] mb-1 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--skill-writing)] text-white text-[10px] font-bold flex-shrink-0">!</span>
                    Areas to Improve
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-body)]">
                    {weaknesses.slice(0, 2).map((w, i) => (
                      <li key={i} className="text-xs">{w.split(":")[0]}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {data.suggestions?.length > 0 && (
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
              <h3 className="font-bold text-[var(--foreground)] mb-3">
                Tips
              </h3>
              <ul className="text-xs text-[var(--text-body)] space-y-2">
                {data.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--text-muted)]">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Answer Toggle */}
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
            <h3 className="font-bold text-[var(--foreground)] mb-2">Better Version?</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              See how an improved version would look.
            </p>
            <button
              onClick={() => setShowModel(!showModel)}
              className="w-full bg-[var(--foreground)] text-white py-2.5 rounded-full font-medium text-sm hover:bg-black transition-colors border-b-[4px] border-black active:translate-y-[2px] active:border-b-[2px] flex items-center justify-center gap-2"
            >
              {showModel ? "Hide Model Answer" : "View Model Answer"}
            </button>
          </div>
        </div>
      </div>

      {/* Model Answer (Expandable) */}
      {showModel && data.improvedParagraph && (
        <div className="bg-[var(--foreground)] text-white rounded-[1.5rem] p-8 shadow-[0_4px_0_rgba(0,0,0,0.08)] border-[3px] border-black">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold">Improved Version</h3>
          </div>
          <p className="font-sans text-lg leading-loose opacity-90 whitespace-pre-line">
            {data.improvedParagraph}
          </p>
        </div>
      )}

      {/* Footer Meta */}
      <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border-light)]">
        <p>
          Graded on {new Date(data.gradedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          - Model: {data.model} ({data.modelProvider})
        </p>
      </div>
    </div>
  );
}
