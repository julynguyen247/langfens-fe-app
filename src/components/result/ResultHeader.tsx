"use client";

import React from 'react';

// Helper to get friendly names from abbreviations
const getLabel = (code: string): string => {
  const map: Record<string, string> = {
    // Writing criteria
    'TR': 'Task Response',
    'CC': 'Coherence',
    'LR': 'Vocabulary',
    'GRA': 'Grammar',
    // Speaking criteria
    'FC': 'Fluency',
    'P': 'Pronunciation',
    // Reading/Listening stats
    'Correct': 'Correct',
    'Skipped': 'Skipped',
    'Time': 'Time Taken',
    'Accuracy': 'Accuracy',
  };
  return map[code] || code;
};

export interface MetricItem {
  label: string;
  value: string | number;
}

interface ResultHeaderProps {
  skill: string;
  overallScore: number | string;
  date: string;
  metrics: MetricItem[];
}

export function ResultHeader({ skill, overallScore, date, metrics }: ResultHeaderProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-10 items-stretch">
      
      {/* LEFT: OVERALL SCORE */}
      <div className="md:w-[40%] flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4">
          {skill} Assessment
        </h3>
        <div className="text-[6rem] leading-none font-bold text-[#3B82F6] font-sans tracking-tighter">
          {typeof overallScore === "number" ? overallScore.toFixed(1) : overallScore}
        </div>
        <div className="mt-6 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
          <span className="material-symbols-rounded text-sm">verified</span>
          Official Result
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">{date}</p>
      </div>

      {/* RIGHT: 2x2 METRICS GRID */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {metrics.slice(0, 4).map((m, idx) => (
          <div 
            key={`${m.label}-${idx}`} 
            className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors group"
          >
            {/* VALUE */}
            <span className="text-3xl font-bold text-slate-800 group-hover:text-[#3B82F6] mb-1 transition-colors">
              {m.value}
            </span>
            {/* LABEL (Full Text) */}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              {getLabel(m.label)}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default ResultHeader;
