"use client";

import React from "react";

interface AdminPreviewFrameProps {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  variant?: "light" | "dark";
}

export function AdminPreviewFrame({
  title = "PREVIEW — As learner sees it",
  hint,
  children,
  variant = "light",
}: AdminPreviewFrameProps) {
  const isLight = variant === "light";
  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-500/40 bg-slate-900/40 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
            {title}
          </span>
        </div>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div
        className={
          isLight
            ? "p-4 bg-white text-slate-900 rounded-b-2xl"
            : "p-4 bg-slate-950 text-slate-100 rounded-b-2xl"
        }
      >
        {children}
      </div>
    </div>
  );
}
