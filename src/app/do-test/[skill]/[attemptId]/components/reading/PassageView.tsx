"use client";

import React, { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import ReadingToolbar, { ToolMode } from "@/components/ReadingToolbar";
import VocabularyExtractor from "@/components/VocabularyExtractor";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

// Custom title components - Serif "Newspaper" style
const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2 className="font-serif text-2xl font-bold text-slate-900 leading-tight" {...props} />
  ),
};

// Custom content components - "Newspaper" typography with Serif font
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
          <span className="absolute -left-10 top-0 font-sans text-sm font-bold text-slate-400 select-none">
            [{label}]
          </span>
          <p className="font-serif text-lg leading-loose text-slate-800 text-justify">
            {restContent}
          </p>
        </div>
      );
    }
    
    return (
      <p className="font-serif text-lg leading-loose text-slate-800 my-4 text-justify" {...props}>
        {children}
      </p>
    );
  },
  img: ({ node, src, alt, ...props }: any) => (
    <figure className="my-8">
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full h-auto rounded-xl border border-slate-100 shadow-sm mx-auto block"
        style={{ maxHeight: "400px" }}
        {...props}
      />
      {alt && (
        <figcaption className="text-center text-sm text-slate-500 mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="font-serif text-lg font-semibold text-slate-800 mt-6 mb-3" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-slate-900" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-slate-700" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-8 border-slate-200" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-6 my-4 space-y-2 font-serif text-lg leading-relaxed" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-6 my-4 space-y-2 font-serif text-lg leading-relaxed" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-slate-800" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-200 pl-4 my-6 italic text-slate-600" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th className="bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100" {...props} />
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
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="font-serif text-xl font-bold text-slate-900 truncate">
              <ReactMarkdown components={titleComponents}>{title}</ReactMarkdown>
            </div>
          </div>
          
          {/* Toolbar Actions */}
          <div className="flex items-center gap-1 ml-4">
            {/* Zoom Controls */}
            <button 
              onClick={handleZoomOut}
              disabled={fontSize === "normal"}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Decrease font size"
            >
              <Icon name="zoom_out" className="text-xl" />
            </button>
            <button 
              onClick={handleZoomIn}
              disabled={fontSize === "xlarge"}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Increase font size"
            >
              <Icon name="zoom_in" className="text-xl" />
            </button>
            
            <div className="w-px h-6 bg-slate-200 mx-2" />
            
            {/* Vocabulary Extractor */}
            <VocabularyExtractor 
              passageText={content} 
              onAddWords={handleAddExtractedWords} 
            />
          </div>
        </div>

        {/* Passage Content - "Paper" feel */}
        <div 
          className={`flex-1 w-full overflow-auto overscroll-contain scroll-smooth
            [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent]
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-300
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
                  className="max-w-full h-auto rounded-xl border border-slate-100 shadow-sm object-contain mx-auto"
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
