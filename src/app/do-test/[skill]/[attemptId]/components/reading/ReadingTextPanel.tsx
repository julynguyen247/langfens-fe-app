'use client';

import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReadingTextPanelProps {
  title: string;
  content: string;
  paragraphs?: { id: string; label: string; text: string }[];
  fontSize?: 'normal' | 'large' | 'xlarge';
  className?: string;
}

// Custom title components
const titleComponents = {
  p: ({ node, ...props }: any) => (
    <h2 className="font-sans text-2xl font-bold text-[var(--foreground)] leading-tight" {...props} />
  ),
};

// Custom content components for reading text
const contentComponents = {
  p: ({ node, children, ...props }: any) => {
    const text = String(children);
    const labelMatch = text.match(/^\s*\[([A-Z])\]\s*/);

    if (labelMatch) {
      const label = labelMatch[1];
      const restContent = text.replace(/^\s*\[([A-Z])\]\s*/, '');
      return (
        <div className="relative my-6" {...props}>
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

const fontSizeClass = {
  normal: 'text-lg',
  large: 'text-xl',
  xlarge: 'text-2xl',
};

const ReadingTextPanel = memo(function ReadingTextPanel({
  title,
  content,
  paragraphs,
  fontSize = 'normal',
  className = '',
}: ReadingTextPanelProps) {
  const processedTitle = useMemo(
    () => title.replace(/\\n/g, '\n'),
    [title]
  );
  const processedContent = useMemo(
    () => content.replace(/\\n/g, '\n'),
    [content]
  );

  return (
    <div className={`flex flex-col h-full bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-[var(--border-light)]">
        <div className="font-sans text-xl font-bold text-[var(--foreground)]">
          <ReactMarkdown components={titleComponents}>
            {processedTitle}
          </ReactMarkdown>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-auto overscroll-contain scroll-smooth
          [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
          [&::-webkit-scrollbar-thumb]:rounded-full
          ${fontSizeClass[fontSize]}
        `}
      >
        <div className="max-w-3xl mx-auto px-8 py-8">
          <article className="prose-passage">
            <ReactMarkdown
              components={contentComponents}
              remarkPlugins={[remarkGfm]}
            >
              {processedContent}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
});

export default ReadingTextPanel;
