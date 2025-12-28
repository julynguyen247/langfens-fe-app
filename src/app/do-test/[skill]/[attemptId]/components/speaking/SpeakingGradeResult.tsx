"use client";

import { useState } from "react";
import { ScoreHeader } from "../common/ScoreHeader";

export type SpeakingBandDetail = {
  band: number;
  comment: string;
};

export type SpeakingGradeRes = {
  submissionId: string;
  taskText: string;
  transcriptRaw: string;
  transcriptNormalized: string;
  wordCount: number;
  overallBand: number;
  fluencyAndCoherence: SpeakingBandDetail;
  lexicalResource: SpeakingBandDetail;
  grammaticalRangeAndAccuracy: SpeakingBandDetail;
  pronunciation: SpeakingBandDetail;
  suggestions: string[];
  improvedAnswer: string;
  model: string;
  modelProvider: string;
  gradedAt: string;
  timeSpentSeconds?: number;
  rawLlmJson?: any;
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

export function SpeakingGradeResult({ data }: { data: SpeakingGradeRes }) {
  const [showModel, setShowModel] = useState(false);

  const criteria = [
    { name: "Fluency", score: data.fluencyAndCoherence.band },
    { name: "Lexical", score: data.lexicalResource.band },
    { name: "Grammar", score: data.grammaticalRangeAndAccuracy.band },
    { name: "Pronunciation", score: data.pronunciation.band },
  ];

  const timeMinutes = data.timeSpentSeconds
    ? Math.floor(data.timeSpentSeconds / 60)
    : null;

  // Build critique content
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (data.fluencyAndCoherence.band >= 6)
    strengths.push(`Fluency: ${data.fluencyAndCoherence.comment}`);
  else weaknesses.push(`Fluency: ${data.fluencyAndCoherence.comment}`);

  if (data.lexicalResource.band >= 6)
    strengths.push(`Vocabulary: ${data.lexicalResource.comment}`);
  else weaknesses.push(`Vocabulary: ${data.lexicalResource.comment}`);

  if (data.grammaticalRangeAndAccuracy.band >= 6)
    strengths.push(`Grammar: ${data.grammaticalRangeAndAccuracy.comment}`);
  else weaknesses.push(`Grammar: ${data.grammaticalRangeAndAccuracy.comment}`);

  if (data.pronunciation.band >= 6)
    strengths.push(`Pronunciation: ${data.pronunciation.comment}`);
  else weaknesses.push(`Pronunciation: ${data.pronunciation.comment}`);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Score Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <ScoreHeader band={data.overallBand} criteria={criteria} skill="speaking" />
      </div>

      {/* Task Prompt (Subtle) */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="record_voice_over" className="text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Speaking Prompt
          </h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{data.taskText}</p>
      </div>

      {/* Feedback Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: The Transcript (Paper View) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Your Response
            </h3>
            <div className="prose prose-slate font-serif text-lg leading-loose text-slate-800 whitespace-pre-line">
              {data.transcriptRaw || data.transcriptNormalized || "No transcript available"}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Icon name="notes" className="text-base" />
                {data.wordCount} words
              </span>
              {timeMinutes && (
                <span className="flex items-center gap-1">
                  <Icon name="schedule" className="text-base" />
                  {timeMinutes}m
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Examiner's Notes (Sidebar) */}
        <div className="space-y-6">
          {/* Examiner's Critique */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-blue-700 mb-4">
              <Icon name="psychology" className="text-xl" />
              Examiner's Critique
            </h3>
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              {strengths.length > 0 && (
                <div>
                  <p className="font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                    <Icon name="check_circle" className="text-base" />
                    Strengths
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {strengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-xs">{s.split(":")[0]}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <p className="font-semibold text-amber-700 mb-1 flex items-center gap-1">
                    <Icon name="error" className="text-base" />
                    Areas to Improve
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                <Icon name="lightbulb" className="text-amber-500" />
                Tips
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                {data.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-slate-400">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Answer Toggle */}
          {data.improvedAnswer && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-800 mb-2">Better Version?</h3>
              <p className="text-xs text-slate-500 mb-4">
                See how an improved answer would sound.
              </p>
              <button
                onClick={() => setShowModel(!showModel)}
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Icon name={showModel ? "visibility_off" : "visibility"} className="text-base" />
                {showModel ? "Hide Model Answer" : "View Model Answer"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model Answer (Expandable) */}
      {showModel && data.improvedAnswer && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="auto_awesome" className="text-amber-400" />
            <h3 className="font-bold">Improved Response</h3>
          </div>
          <p className="font-serif text-lg leading-loose opacity-90 whitespace-pre-line">
            {data.improvedAnswer}
          </p>
        </div>
      )}

      {/* Footer Meta */}
      <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
        <p>
          Graded on {new Date(data.gradedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          • Model: {data.model} ({data.modelProvider})
        </p>
      </div>
    </div>
  );
}
