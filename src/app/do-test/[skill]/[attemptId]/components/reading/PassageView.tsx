"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

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
}

const PassageView = memo(function PassageView({
  passage,
  imageUrl,
}: PassageViewProps) {
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

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <div className="font-semibold text-gray-800">
          <ReactMarkdown components={titleComponents}>{title}</ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] text-black space-y-2">
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
  );
});

export default PassageView;
