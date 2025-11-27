"use client";

export type SpeakingBandDetail = {
  band: number;
  comment: string;
};

export type SpeakingGradeRes = {
  submissionId: string;
  taskText: string;
  transcriptRaw: string;
  transcriptNormalized: string;
  wordCount: number;
  overallBand: number;
  fluencyAndCoherence: SpeakingBandDetail;
  lexicalResource: SpeakingBandDetail;
  grammaticalRangeAndAccuracy: SpeakingBandDetail;
  pronunciation: SpeakingBandDetail;
  suggestions: string[];
  improvedAnswer: string;
  model: string;
  modelProvider: string;
  gradedAt: string;
  rawLlmJson?: any;
};

export function SpeakingGradeResult({ data }: { data: SpeakingGradeRes }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Overall band
          </p>
          <p className="text-3xl font-semibold text-slate-900">
            {data.overallBand.toFixed(1)}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Words: {data.wordCount}</p>
          <p className="mt-1">
            Graded at:{" "}
            <span className="font-mono">
              {new Date(data.gradedAt).toLocaleString()}
            </span>
          </p>
          <p className="mt-1">
            Model: {data.model} ({data.modelProvider})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CriterionCard
          title="Fluency & Coherence"
          detail={data.fluencyAndCoherence}
        />
        <CriterionCard title="Lexical Resource" detail={data.lexicalResource} />
        <CriterionCard
          title="Grammatical Range & Accuracy"
          detail={data.grammaticalRangeAndAccuracy}
        />
        <CriterionCard title="Pronunciation" detail={data.pronunciation} />
      </div>

      {data.suggestions?.length > 0 && (
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-emerald-800 mb-2">
            Gợi ý cải thiện
          </h4>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {data.suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {data.improvedAnswer && (
        <div className="bg-slate-900 text-slate-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold mb-2">
            Ví dụ câu trả lời tốt hơn
          </h4>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {data.improvedAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

function CriterionCard({
  title,
  detail,
}: {
  title: string;
  detail: SpeakingBandDetail;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-50">
          Band {detail.band}
        </span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{detail.comment}</p>
    </div>
  );
}
