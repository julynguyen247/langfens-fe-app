"use client";

const sentenceComparisons = [
  {
    original: "The government should make more strict law for pollution.",
    improved: "The government should enforce stricter regulations to reduce pollution levels.",
    explanation: "Use the comparative form 'stricter' and a more precise verb ('enforce').",
    category: "grammar",
  },
  {
    original: "People can get many benefit when they use public transport.",
    improved: "People can gain many benefits when they rely on public transport.",
    explanation: "Use plural noun 'benefits' and a stronger collocation ('rely on').",
    category: "vocabulary",
  },
  {
    original: "In conclusion, this trend has bad effect in city.",
    improved: "In conclusion, this trend has several negative effects on urban life.",
    explanation: "Improve specificity and apply correct preposition ('effects on').",
    category: "coherence",
  },
];

const references = [
  { band: 8.5, score: 0.89, snippet: "Urban policymakers should incentivize greener transit and redesign city centers..." },
  { band: 8.0, score: 0.84, snippet: "Public transportation remains the most scalable solution for reducing congestion..." },
];

function Chip({ label }: { label: string }) {
  const color: Record<string, string> = {
    grammar: "bg-amber-100 text-amber-800",
    vocabulary: "bg-emerald-100 text-emerald-800",
    coherence: "bg-sky-100 text-sky-800",
    structure: "bg-violet-100 text-violet-800",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${color[label] ?? "bg-slate-100 text-slate-700"}`}>{label}</span>;
}

export default function WritingComparativePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-black text-slate-900">Writing Comparative Results</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Mockup with placeholder data for side-by-side comparison, sentence-level upgrades, and reference essays.</p>

      <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
        <Metric label="Estimated Band" value="6.0 -> 7.0" />
        <Metric label="Priority Focus" value="Grammar Precision" />
        <Metric label="Reference Matches" value="2 Similar Essays" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <EssayPanel
          title="Your Draft"
          text="Many people think public transport is useful, but some people still use private cars because it is convenient. In my opinion government should make more strict law to reduce pollution."
        />
        <EssayPanel
          title="Improved Version"
          text="Although private cars remain convenient, public transport offers broader social and environmental benefits. Governments should enforce stricter regulations while improving transit quality to reduce congestion and pollution."
        />
      </section>

      <section className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-slate-900">Sentence-Level Comparison</h2>
        {sentenceComparisons.map((item) => (
          <article key={item.original} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <Chip label={item.category} />
            </div>
            <p className="text-sm text-slate-500">Original</p>
            <p className="text-slate-800">{item.original}</p>
            <p className="mt-3 text-sm text-slate-500">Improved</p>
            <p className="text-slate-900">{item.improved}</p>
            <p className="mt-3 text-sm text-slate-600">{item.explanation}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-serif text-2xl font-bold text-slate-900">Reference Essays</h2>
        <div className="mt-4 space-y-3">
          {references.map((ref) => (
            <article key={ref.snippet} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-700">Band {ref.band} · Similarity {(ref.score * 100).toFixed(0)}%</p>
              <p className="mt-2 text-sm text-slate-600">{ref.snippet}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EssayPanel({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-4 text-[15px] leading-7 text-slate-700">{text}</p>
    </article>
  );
}
