"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  id: string;
  stem: string;
  value: string;
  onChange: (value: string) => void;
};

export default function MatchingLetterCard({ stem, value, onChange }: Props) {
  const handleChange = (raw: string) => {
    const v = raw.trim().toUpperCase();
    if (!v) {
      onChange("");
      return;
    }
    if (!/^[A-F]$/.test(v)) return;
    onChange(v);
  };

  const text = stem.replace(/\\n/g, "\n");

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="text-slate-900 leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={1}
          placeholder="A–F"
          className="w-16 text-center rounded-md border border-slate-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
        />
        <span className="text-xs text-slate-500">
          Enter a single letter (A–F).
        </span>
      </div>
    </div>
  );
}
