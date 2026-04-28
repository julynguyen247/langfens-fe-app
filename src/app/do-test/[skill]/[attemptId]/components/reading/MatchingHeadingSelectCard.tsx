"use client";

type Option = {
  id: string; // i, ii, iii...
  text: string; // i, ii, iii...
};

export default function MatchingHeadingSelectCard({
  id,
  prompt,
  options,
  value,
  onChange,
}: {
  id: string;
  prompt: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
      <div className="flex-1 text-sm text-[var(--foreground)]">{prompt}</div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-[var(--border)] bg-white
        text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.text}
          </option>
        ))}
      </select>
    </div>
  );
}
