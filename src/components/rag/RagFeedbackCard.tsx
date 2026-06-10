import type { RagFeedbackEnvelope } from "@/types/rag";

function formatBand(b: number | null | undefined): string {
  if (b == null) return "—";
  return b.toFixed(1);
}

function CriterionRow({
  criterion,
}: {
  criterion: RagFeedbackEnvelope["criteria"][number];
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold text-slate-700"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {criterion.name.replace(/_/g, " ")}
        </span>
        <span
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Band {formatBand(criterion.band)}
        </span>
      </div>
      <p
        className="text-sm text-slate-600"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {criterion.comment}
      </p>
      {criterion.evidence_ids && criterion.evidence_ids.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {criterion.evidence_ids.map((id) => (
            <span
              key={id}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
            >
              {id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RagFeedbackCard({
  envelope,
}: {
  envelope: RagFeedbackEnvelope;
}) {
  return (
    <div
      className="rounded-[2rem] border-[3px] border-slate-200 bg-white p-2 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Feedback ({envelope.domain})
          </h2>
          {envelope.overall_band != null && (
            <span className="inline-flex items-center rounded-full border-b-[2px] border-blue-700 bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Overall {formatBand(envelope.overall_band)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">item: {envelope.item_id}</p>
      </div>
      <div className="flex flex-col gap-4 p-6 pt-0">
        <div>
          <h3 className="mb-1 text-sm font-bold tracking-wide text-slate-700">
            Criteria
          </h3>
          {envelope.criteria.map((c) => (
            <CriterionRow key={c.name} criterion={c} />
          ))}
        </div>

        {envelope.evidence.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-700">
              Evidence
            </h3>
            <ul className="flex flex-col gap-2">
              {envelope.evidence.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{e.id}</span>
                    <span>{e.source}</span>
                  </div>
                  <p>{e.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {envelope.suggestions.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-700">
              Suggestions
            </h3>
            <ul className="flex flex-col gap-1">
              {envelope.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-slate-700"
                >
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
