"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

// Memoized markdown components for title
const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2
      className="text-2xl font-semibold text-gray-800"
      {...props}
    />
  ),
};

// Memoized markdown components for content
const contentComponents = {
  p: ({ node, ...props }: any) => (
    <p
      className="whitespace-pre-wrap leading-relaxed text-[15px] text-slate-800"
      {...props}
    />
  ),
};

const PassageView = memo(function PassageView({
  passage,
}: {
  passage: { title: string; content: string };
}) {
  const title = useMemo(
    () => passage.title.replace(/\\n/g, "\n"),
    [passage.title]
  );
  const content = useMemo(
    () => passage.content.replace(/\\n/g, "\n"),
    [passage.content]
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <div className="prose prose-xl font-semibold text-gray-800 max-w-none">
          <ReactMarkdown components={titleComponents}>
            {title}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] text-black space-y-6">
        <ReactMarkdown components={contentComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default PassageView;
