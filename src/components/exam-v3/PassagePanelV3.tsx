"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InternalDeliverySection } from "./types";
import {
  RESULT_BUTTON_GHOST,
  RESULT_BUTTON_PRIMARY,
  RESULT_BUTTON_SECONDARY,
} from "./resultButtonStyles";

interface PassagePanelV3Props {
  sections: InternalDeliverySection[];
  activeSectionIdx: number;
  onSelectSection: (idx: number) => void;
}

export function PassagePanelV3({
  sections,
  activeSectionIdx,
  onSelectSection,
}: PassagePanelV3Props) {
  const currentSection = sections[activeSectionIdx] || sections[0];
  const [fontSizeClass, setFontSizeClass] = useState<"sm" | "base" | "lg">("base");
  const [showTranscript, setShowTranscript] = useState(false);

  const fontClasses = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-loose",
    lg: "text-lg leading-loose",
  };

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
            className="relative my-6 pl-12 scroll-mt-20 transition-all rounded-2xl p-2 hover:bg-amber-50/50"
          >
            <span className="absolute left-1 top-2.5 font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] border border-[var(--skill-reading-border)] px-2 py-0.5 rounded-lg select-none">
              [{label}]
            </span>
            <p className="font-serif text-[var(--text-body)] text-justify leading-loose">
              {restContent}
            </p>
          </div>
        );
      }

      return (
        <p className="font-serif text-[var(--text-body)] my-4 text-justify leading-loose">
          {children}
        </p>
      );
    },
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-sans text-xl font-bold text-[var(--foreground)] mt-6 mb-3 border-b-2 border-[var(--border-light)] pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-sans text-lg font-bold text-[var(--foreground)] mt-4 mb-2">
        {children}
      </h3>
    ),
  };

  const audioUrl = currentSection?.audioUrl;
  let youTubeId = "";
  if (audioUrl) {
    const m1 = audioUrl.match(/youtu\.be\/([^?]+)/);
    const m2 = audioUrl.match(/youtube\.com\/embed\/([^?]+)/);
    if (m1?.[1]) youTubeId = m1[1];
    else if (m2?.[1]) youTubeId = m2[1];
    else {
      try {
        const u = new URL(audioUrl);
        const v = u.searchParams.get("v");
        if (v) youTubeId = v;
      } catch {}
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)] border-r-2 border-[var(--border)] font-sans select-text">
      {/* Top Bar: Section tabs & Font controls */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-between shrink-0">
        {/* Section Tabs */}
        <div className="flex items-center gap-2">
          {sections.map((sec: InternalDeliverySection, i: number) => {
            const partNum = (sec.idx ?? i) + 1;
            return (
              <button
                key={`${sec.id ?? "sec"}-${sec.idx ?? "idx"}-${i}`}
                type="button"
                onClick={() => onSelectSection(i)}
                aria-pressed={activeSectionIdx === i}
                className={`${activeSectionIdx === i ? RESULT_BUTTON_PRIMARY : RESULT_BUTTON_SECONDARY} h-8 px-4 text-xs`}
              >
                Part {partNum}
              </button>
            );
          })}
        </div>

        {/* Font size adjustment */}
        <div className="flex items-center gap-1 border-2 border-[var(--border)] border-b-[3px] rounded-full p-0.5 bg-[var(--background)]">
          <button
            type="button"
            onClick={() => setFontSizeClass("sm")}
            aria-pressed={fontSizeClass === "sm"}
            className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 ${
              fontSizeClass === "sm"
                ? "bg-[var(--primary)] text-white border-b-[2px] border-b-[var(--primary-dark)]"
                : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)]"
            }`}
            title="Small font"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSizeClass("base")}
            aria-pressed={fontSizeClass === "base"}
            className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 ${
              fontSizeClass === "base"
                ? "bg-[var(--primary)] text-white border-b-[2px] border-b-[var(--primary-dark)]"
                : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)]"
            }`}
            title="Normal font"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSizeClass("lg")}
            aria-pressed={fontSizeClass === "lg"}
            className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 ${
              fontSizeClass === "lg"
                ? "bg-[var(--primary)] text-white border-b-[2px] border-b-[var(--primary-dark)]"
                : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)]"
            }`}
            title="Large font"
          >
            A+
          </button>
        </div>
      </div>

      {/* Audio Player if Listening */}
      {audioUrl && (
        <div className="p-4 bg-[var(--primary-light)] border-b-2 border-[var(--skill-reading-border)]">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--primary)]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span>Section Audio Recording:</span>
          </div>
          {youTubeId ? (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)]">
              <iframe
                src={`https://www.youtube.com/embed/${youTubeId}?controls=1&rel=0`}
                title="Listening Audio"
                className="w-full h-14"
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : (
            <audio controls className="w-full rounded-lg" preload="metadata">
              <source src={audioUrl} />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      )}

      {/* Main Content scroll area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="border-b-2 border-[var(--border)] pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
            Reading Passage & Reference
          </span>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-1">
            {currentSection?.title || "Reading Passage"}
          </h2>
          {currentSection?.instructionsMd && (
            <p className="text-xs text-[var(--text-muted)] mt-2 font-medium leading-relaxed italic">
              {currentSection.instructionsMd}
            </p>
          )}
        </div>

        {currentSection?.passageMd ? (
          <div className={`prose prose-slate max-w-none ${fontClasses[fontSizeClass]}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {currentSection.passageMd}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border-2 border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] font-medium">
            No passage text available for this section.
          </div>
        )}

        {currentSection?.transcriptMd && (
          <div className="pt-6 border-t-2 border-[var(--border)]">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              aria-expanded={showTranscript}
              className={`${RESULT_BUTTON_GHOST} px-3 py-1.5 text-xs`}
            >
              <span>{showTranscript ? "Hide Transcript" : "View Audio Transcript"}</span>
              <svg
                className={`w-3.5 h-3.5 transform transition-transform ${showTranscript ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTranscript && (
              <div className="mt-4 p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 text-xs text-[var(--text-body)] leading-relaxed font-mono whitespace-pre-wrap shadow-2xs">
                {currentSection.transcriptMd}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
