"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InternalDeliverySection } from "../_lib/types";

interface PassagePanelProps {
  sections: InternalDeliverySection[];
  activeSectionIdx: number;
  onSelectSection: (idx: number) => void;
}

export function PassagePanel({
  sections,
  activeSectionIdx,
  onSelectSection,
}: PassagePanelProps) {
  const currentSection = sections[activeSectionIdx] || sections[0];
  const [fontSizeClass, setFontSizeClass] = useState<"sm" | "base" | "lg">("base");
  const [showTranscript, setShowTranscript] = useState(false);

  const fontClasses = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-loose",
    lg: "text-lg leading-loose",
  };

  // Custom markdown renderer with marginal paragraph labels [A], [B], etc.
  const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      const labelMatch = text.match(/^\s*\[([A-Z])\]\s*/);

      if (labelMatch) {
        const label = labelMatch[1];
        const restContent = text.replace(/^\s*\[([A-Z])\]\s*/, "");
        return (
          <div
            id={`para-${label}`}
            className="relative my-6 pl-12 scroll-mt-20 transition-colors rounded-2xl p-2 hover:bg-amber-50/50"
          >
            <span className="absolute left-1 top-2.5 font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg select-none">
              [{label}]
            </span>
            <p className="font-serif text-slate-800 text-justify leading-loose">
              {restContent}
            </p>
          </div>
        );
      }

      return (
        <p className="font-serif text-slate-800 my-4 text-justify leading-loose">
          {children}
        </p>
      );
    },
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-sans text-xl font-bold text-slate-900 mt-6 mb-3 border-b-2 border-slate-100 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-sans text-lg font-bold text-slate-900 mt-4 mb-2">
        {children}
      </h3>
    ),
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] border-r-2 border-slate-200 font-sans select-text">
      {/* Top Bar: Section tabs & Font controls */}
      <div className="h-14 border-b-2 border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Section Tabs */}
        <div className="flex items-center gap-2">
          {sections.map((sec, i) => (
            <button
              key={`${sec.id ?? "no-id"}-${sec.idx ?? "no-idx"}-${i}`}
              type="button"
              onClick={() => onSelectSection(i)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSectionIdx === i
                  ? "bg-[#2563EB] text-white border-b-[3px] border-[#1E40AF] shadow-xs"
                  : "bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              Part {sec.idx + 1}
            </button>
          ))}
        </div>

        {/* Font size adjustment */}
        <div className="flex items-center gap-1 border-2 border-slate-200 rounded-xl p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => setFontSizeClass("sm")}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
              fontSizeClass === "sm"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Small font"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSizeClass("base")}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
              fontSizeClass === "base"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Default font"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSizeClass("lg")}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
              fontSizeClass === "lg"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Large font"
          >
            A+
          </button>
        </div>
      </div>

      {/* Audio Player Card if Listening */}
      {currentSection?.audioUrl && (
        <div className="mx-6 mt-6 p-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Audio Recording
            </span>
          </div>
          <audio
            controls
            src={currentSection.audioUrl}
            className="h-8 max-w-sm rounded-lg"
          />
        </div>
      )}

      {/* Main Passage Paper Card */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
          {/* Section Heading & Instructions */}
          <div>
            <h2 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
              {currentSection?.title || `Section ${activeSectionIdx + 1}`}
            </h2>
            {currentSection?.instructionsMd && (
              <div className="mt-3 p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-200 text-xs font-medium text-slate-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentSection.instructionsMd}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Passage Markdown text */}
          {currentSection?.passageMd ? (
            <div
              className={`prose prose-slate max-w-none text-slate-800 font-serif ${fontClasses[fontSizeClass]} space-y-4`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {currentSection.passageMd}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 italic border-2 border-dashed border-slate-200 rounded-2xl">
              No passage text attached to this section. Refer to the questions on the right.
            </div>
          )}

          {/* Optional Transcript toggle */}
          {currentSection?.transcriptMd && (
            <div className="pt-4 border-t-2 border-slate-100">
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1.5 transition"
              >
                <span>{showTranscript ? "Hide Transcript" : "Show Transcript"}</span>
                <svg
                  className={`w-3.5 h-3.5 transform transition-transform ${
                    showTranscript ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showTranscript && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {currentSection.transcriptMd}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
