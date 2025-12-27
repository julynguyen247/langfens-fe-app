"use client";

import React, { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import ReadingToolbar, { ToolMode } from "@/components/ReadingToolbar";
import VocabularyExtractor from "@/components/VocabularyExtractor";

const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2 className="text-2xl font-semibold text-gray-800" {...props} />
  ),
};

const contentComponents = {
  p: ({ node, ...props }: any) => (
    <p
      className="whitespace-pre-wrap leading-relaxed text-[15px] text-slate-800"
      {...props}
    />
  ),
  img: ({ node, src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt || ""}
      className="max-w-full h-auto rounded-lg shadow-md my-4 mx-auto block"
      style={{ maxHeight: "400px" }}
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-gray-300" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-[15px] text-slate-800" {...props} />
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
  
  const title = useMemo(
    () => passage.title.replace(/\\n/g, "\n"),
    [passage.title]
  );
  const content = useMemo(
    () => passage.content.replace(/\\n/g, "\n"),
    [passage.content]
  );

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
        mark.style.backgroundColor = "#fde68a";
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
    // TODO: Integrate with vocabulary service to add word to flashcard
    console.log("Add to flashcard:", word, definition);
  };

  const handleAddExtractedWords = (words: any[]) => {
    // TODO: Integrate with vocabulary service to add words to flashcard
    console.log("Add extracted words:", words);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Reading Toolbar - Left sidebar, takes layout space */}
      <ReadingToolbar 
        onAddToFlashcard={handleAddToFlashcard}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        attemptId={attemptId}
        sectionId={sectionId}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-3 border-b flex items-center justify-between shrink-0">
          <div className="font-semibold text-gray-800 flex-1">
            <ReactMarkdown components={titleComponents}>{title}</ReactMarkdown>
          </div>
          <VocabularyExtractor 
            passageText={content} 
            onAddWords={handleAddExtractedWords} 
          />
        </div>

        <div 
          className={`flex-1 w-full overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] text-black space-y-2 ${
            activeMode === "highlight" ? "cursor-text select-text" : ""
          }`}
        >
          {imageUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={imageUrl}
                alt={passage.title}
                className="max-w-full h-auto rounded-lg shadow-md object-contain"
                style={{ maxHeight: "640px" }}
              />
            </div>
          )}

          <div onMouseUp={handleMouseUp}>
            <ReactMarkdown components={contentComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PassageView;
