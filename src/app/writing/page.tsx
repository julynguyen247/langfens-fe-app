import Link from "next/link";

const modules = [
  {
    title: "Writing Comparative",
    href: "/writing/comparative",
    description: "Compare your essay with high-band references and sentence-level rewrites.",
    icon: "compare_arrows",
  },
  {
    title: "Grammar Explainer",
    href: "/grammar/explainer",
    description: "Understand mistakes through Error -> Theory -> Examples cards.",
    icon: "menu_book",
  },
];

export default function WritingHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F8FAFC] via-white to-[#EEF6FF] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Phase 2</p>
        <h1 className="mt-3 font-serif text-3xl font-black text-slate-900 sm:text-4xl">Writing Intelligence Studio</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Explore the new AI-supported writing experiences for comparative feedback and focused grammar learning.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="material-symbols-rounded text-3xl text-[#3B82F6]">{module.icon}</span>
            <h2 className="mt-4 font-serif text-2xl font-bold text-slate-900">{module.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
              Open module <span className="material-symbols-rounded text-base">arrow_forward</span>
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
