"use client";

import ReactMarkdown from "react-markdown";

type HeadingOption = {
  id?: string;
  idx?: number;
  contentMd: string;
};

type Props = {
  id: string;
  stem: string; // e.g., "Paragraph A"
  options: HeadingOption[]; // List of headings with roman numerals
  value: string;
  onChange: (value: string) => void;
};

/**
 * Dropdown component for MATCHING_HEADING questions.
 * Shows a select with roman numeral options (i, ii, iii... x).
 */
export default function HeadingDropdown({
  stem,
  options,
  value,
  onChange,
}: Props) {
  const text = stem.replace(/\\n/g, "\n");

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="text-slate-900 leading-relaxed font-bold">
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
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     text-black bg-white"
        >
          <option value="">Select a heading...</option>
          {options.map((opt, idx) => (
            <option key={opt.id || idx} value={opt.contentMd.split(".")[0].trim()}>
              {opt.contentMd}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          Choose the matching heading.
        </span>
      </div>
    </div>
  );
}
