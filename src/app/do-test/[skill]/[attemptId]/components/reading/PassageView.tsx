"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

// Memoized markdown components for title
const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2
      className="text-2xl font-semibold text-gray-800"
      {...props}
    />
  ),
};

// Memoized markdown components for content with image support
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
    <h2
      className="text-xl font-bold text-gray-800 mt-6 mb-3"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-lg font-semibold text-gray-700 mt-4 mb-2"
      {...props}
    />
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

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <div className="prose prose-xl font-semibold text-gray-800 max-w-none">
          <ReactMarkdown components={titleComponents}>
            {title}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable] text-black space-y-6">
        {/* Header image if provided - centered with max size */}
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
        
        <ReactMarkdown components={contentComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default PassageView;
