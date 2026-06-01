"use client";

import { type ReactNode, useMemo, useState } from "react";

const mockErrors = [
  {
    id: "e1",
    error: "She go to library every weekend.",
    correct: "She goes to the library every weekend.",
    rule: "Third-person singular in present simple needs verb + s/es.",
    examples: [
      "He studies at night.",
      "My brother plays football every Sunday.",
      "The teacher explains the rule clearly.",
    ],
  },
  {
    id: "e2",
    error: "I am agree with this opinion.",
    correct: "I agree with this opinion.",
    rule: "'Agree' is a stative verb and does not take 'am' in this structure.",
    examples: [
      "I agree with your suggestion.",
      "They agree that public transport is essential.",
      "Do you agree with this conclusion?",
    ],
  },
  {
    id: "e3",
    error: "People should reduce use plastic bags.",
    correct: "People should reduce their use of plastic bags.",
    rule: "Use noun phrase 'use of' and include a determiner for clarity.",
    examples: [
      "We should reduce our use of fossil fuels.",
      "Schools can reduce their use of paper.",
      "Families should reduce their use of disposable products.",
    ],
  },
];

export default function GrammarExplainerPage() {
  const [selectedId, setSelectedId] = useState(mockErrors[0].id);
  const selected = useMemo(
    () => mockErrors.find((item) => item.id === selectedId) ?? mockErrors[0],
    [selectedId]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-black text-slate-900">Grammar Explainer</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Mockup for the Error -&gt; Theory -&gt; Examples learning flow.</p>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Detected Errors</p>
          <div className="mt-3 space-y-2">
            {mockErrors.map((item, index) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#3B82F6] bg-[#EFF6FF]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-slate-500">Error {index + 1}</p>
                  <p className="mt-1 text-sm text-slate-800">{item.error}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Explainer Card</h2>

          <Panel title="Error">{selected.error}</Panel>
          <Panel title="Correct Form">{selected.correct}</Panel>
          <Panel title="Theory">{selected.rule}</Panel>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Examples</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {selected.examples.map((example) => (
                <li key={example}>- {example}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-slate-800">{children}</p>
    </div>
  );
}
