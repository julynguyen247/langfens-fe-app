"use client";

import React, { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import ReadingToolbar, { ToolMode } from "@/components/ReadingToolbar";
import VocabularyExtractor from "@/components/VocabularyExtractor";

// Custom title components - Clean sans style
const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2 className="font-sans text-2xl font-bold text-[var(--foreground)] leading-tight" {...props} />
  ),
};

// Custom content components - Clean sans typography
const contentComponents = {
  p: ({ node, children, ...props }: any) => {
    // Check if the paragraph starts with a paragraph label like [A], [B], etc.
    const text = String(children);
    const labelMatch = text.match(/^\s*\[([A-Z])\]\s*/);

    if (labelMatch) {
      const label = labelMatch[1];
      const restContent = text.replace(/^\s*\[([A-Z])\]\s*/, '');
      return (
        <div className="relative my-6" {...props}>
          {/* Marginal paragraph label */}
          <span className="absolute -left-10 top-0 font-sans text-sm font-bold text-[var(--text-muted)] select-none">
            [{label}]
          </span>
          <p className="font-sans text-lg leading-loose text-[var(--foreground)] text-justify">
            {restContent}
          </p>
        </div>
      );
    }

    return (
      <p className="font-sans text-lg leading-loose text-[var(--foreground)] my-4 text-justify" {...props}>
        {children}
      </p>
    );
  },
  img: ({ node, src, alt, ...props }: any) => (
    <figure className="my-8">
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full h-auto rounded-[1.5rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] mx-auto block"
        style={{ maxHeight: "400px" }}
        {...props}
      />
      {alt && (
        <figcaption className="text-center text-sm text-[var(--text-muted)] mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="font-sans text-xl font-bold text-[var(--foreground)] mt-8 mb-4 border-b border-[var(--border)] pb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="font-sans text-lg font-semibold text-[var(--foreground)] mt-6 mb-3" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-[var(--foreground)]" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-[var(--text-body)]" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-8 border-[var(--border)]" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-6 my-4 space-y-2 font-sans text-lg leading-relaxed" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-6 my-4 space-y-2 font-sans text-lg leading-relaxed" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-[var(--foreground)]" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-[var(--primary-light)] pl-4 my-6 italic text-[var(--text-body)]" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border border-[var(--border)] rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th className="bg-[var(--background)] px-4 py-3 text-left text-sm font-semibold text-[var(--text-body)] border-b border-[var(--border)]" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-[var(--text-body)] border-b border-[var(--border-light)]" {...props} />
  ),
};

interface PassageViewProps {
  passage: { title: string; content: string };
  imageUrl?: string;
  attemptId?: string;
  sectionId?: string;
}

const PassageView = memo(function PassageView({
  passage,
  imageUrl,
  attemptId,
  sectionId,
}: PassageViewProps) {
  const [activeMode, setActiveMode] = useState<ToolMode>(null);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  const title = useMemo(
    () => passage.title.replace(/\\n/g, "\n"),
    [passage.title]
  );
  const content = useMemo(
    () => passage.content.replace(/\\n/g, "\n"),
    [passage.content]
  );

  const fontSizeClass = {
    normal: "text-lg",
    large: "text-xl",
    xlarge: "text-2xl",
  }[fontSize];

  const unHighlight = (element: HTMLElement) => {
    const parent = element.parentNode;
    if (parent) {
      const textNode = document.createTextNode(element.textContent || "");
      parent.replaceChild(textNode, element);
      parent.normalize();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only highlight when highlight mode is active
    if (activeMode !== "highlight") {
      // Just handle click on existing highlights to remove them
      const target = e.target as HTMLElement;
      if (target.tagName === "MARK") {
        unHighlight(target);
      }
      return;
    }

    const selection = window.getSelection();

    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      try {
        const mark = document.createElement("mark");
        mark.style.backgroundColor = "#FEF08A"; // Yellow-200
        mark.style.borderRadius = "2px";
        mark.style.padding = "0 2px";
        mark.style.cursor = "pointer";
        mark.title = "Click to remove highlight";

        range.surroundContents(mark);
        selection.removeAllRanges();
      } catch (error) {
        console.warn("Cannot highlight across block boundaries");
      }
      return;
    }

    const target = e.target as HTMLElement;
    if (target.tagName === "MARK") {
      unHighlight(target);
    }
  };

  const handleAddToFlashcard = (word: string, definition: string) => {
    // TODO: Implement flashcard addition
  };

  const handleAddExtractedWords = (words: any[]) => {
    // TODO: Implement extracted words addition
  };

  const handleZoomIn = () => {
    if (fontSize === "normal") setFontSize("large");
    else if (fontSize === "large") setFontSize("xlarge");
  };

  const handleZoomOut = () => {
    if (fontSize === "xlarge") setFontSize("large");
    else if (fontSize === "large") setFontSize("normal");
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Reading Toolbar - Left sidebar */}
      <ReadingToolbar
        onAddToFlashcard={handleAddToFlashcard}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        attemptId={attemptId}
        sectionId={sectionId}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Toolbar - Focus Mode Tools */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[var(--border-light)] px-6 py-3 flex items-center justify-between">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="font-sans text-xl font-bold text-[var(--foreground)] truncate">
              <ReactMarkdown components={titleComponents}>{title}</ReactMarkdown>
            </div>
          </div>

          {/* Toolbar Actions */}
          <div className="flex items-center gap-1 ml-4">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={fontSize === "normal"}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-body)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Decrease font size"
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>A-</span>
            </button>
            <button
              onClick={handleZoomIn}
              disabled={fontSize === "xlarge"}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-body)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Increase font size"
            >
              <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>A+</span>
            </button>

            <div className="w-px h-6 bg-[var(--border)] mx-2" />

            {/* Vocabulary Extractor */}
            <VocabularyExtractor
              passageText={content}
              onAddWords={handleAddExtractedWords}
            />
          </div>
        </div>

        {/* Passage Content */}
        <div
          className={`flex-1 w-full overflow-auto overscroll-contain scroll-smooth
            [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
            [&::-webkit-scrollbar-thumb]:rounded-full
            ${activeMode === "highlight" ? "cursor-text select-text" : ""}
          `}
        >
          {/* Content container with proper margins */}
          <div className={`max-w-3xl mx-auto px-8 py-8 pl-16 ${fontSizeClass}`}>
            {/* Main Image */}
            {imageUrl && (
              <figure className="mb-8">
                <img
                  src={imageUrl}
                  alt={passage.title}
                  className="max-w-full h-auto rounded-[1.5rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] object-contain mx-auto"
                  style={{ maxHeight: "500px" }}
                />
              </figure>
            )}

            {/* Passage Text */}
            <article
              className="prose-passage"
              onMouseUp={handleMouseUp}
            >
              <ReactMarkdown components={contentComponents}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PassageView;
