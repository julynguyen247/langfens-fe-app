// components/writing/WritingGradeResult.tsx
"use client";

type BandDetail = {
  band: number;
  comment: string;
};

export type WritingGradeRes = {
  submissionId: string;
  taskText: string;
  essayRaw: string;
  essayNormalized: string;
  wordCount: number;
  overallBand: number;
  taskResponse: BandDetail;
  coherenceAndCohesion: BandDetail;
  lexicalResource: BandDetail;
  grammaticalRangeAndAccuracy: BandDetail;
  suggestions: string[];
  improvedParagraph: string;
  model: string;
  modelProvider: string;
  gradedAt: string;
};

export function WritingGradeResult({ data }: { data: WritingGradeRes }) {
  const gradedAt = new Date(data.gradedAt);

  return (
    <div className="mt-8 max-w-5xl mx-auto space-y-6">
      {/* Header tổng quan */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Writing result
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Overall band score
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Submission ID:{" "}
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                {data.submissionId}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Graded at:{" "}
              {gradedAt.toLocaleString("vi-VN", {
                hour12: false,
              })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Overall Band</div>
              <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                {data.overallBand.toFixed(1)}
              </div>
            </div>

            <div className="text-xs text-right text-slate-500 space-y-1">
              <p>
                Model:{" "}
                <span className="font-medium text-slate-700">{data.model}</span>
              </p>
              <p>
                Provider:{" "}
                <span className="font-medium text-slate-700">
                  {data.modelProvider}
                </span>
              </p>
              <p>
                Word count:{" "}
                <span className="font-semibold text-slate-800">
                  {data.wordCount}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Task text + bài làm gốc */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Task prompt
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {data.taskText}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Your original essay
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {data.essayRaw}
          </p>
        </div>
      </section>

      {/* Band từng tiêu chí */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Band scores by criteria
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <CriterionCard title="Task Response" detail={data.taskResponse} />
          <CriterionCard
            title="Coherence & Cohesion"
            detail={data.coherenceAndCohesion}
          />
          <CriterionCard
            title="Lexical Resource"
            detail={data.lexicalResource}
          />
          <CriterionCard
            title="Grammatical Range & Accuracy"
            detail={data.grammaticalRangeAndAccuracy}
          />
        </div>
      </section>

      {/* Đoạn cải thiện + gợi ý */}
      <section className="grid md:grid-cols-[3fr,2fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            Example improved paragraph
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {data.improvedParagraph}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">
            Suggestions for improvement
          </h3>
          {data.suggestions?.length ? (
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1.5">
              {data.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              No suggestions returned from the model.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function CriterionCard({
  title,
  detail,
}: {
  title: string;
  detail: BandDetail;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
          {title}
        </h4>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
          Band {detail.band.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{detail.comment}</p>
    </div>
  );
}
