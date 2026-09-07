"use client";

interface AudioResponseEditorProps {
  promptMd?: string | null;
  explanationMd?: string | null;
}

export function AudioResponseEditor({
  promptMd,
  explanationMd,
}: AudioResponseEditorProps) {
  return (
    <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Speaking Task / Audio Response
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        This question records spoken audio from the candidate and evaluates fluency, pronunciation,
        and lexical resource via the Speaking AI service. Ensure the prompt above includes clear
        instructions (e.g. IELTS Speaking Part 1 questions or Part 2 cue card with bullet points).
      </p>
    </div>
  );
}
