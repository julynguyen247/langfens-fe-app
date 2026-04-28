import Link from "next/link";

export default function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--primary-light)] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white shadow-[0_2px_0_rgba(0,0,0,0.08)] border-[2px] border-[var(--border)]">
            <span
              className="text-lg font-bold text-[var(--primary-dark)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              F
            </span>
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--primary-dark)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Langfens Flashcards
            </h1>
            <p className="text-sm text-[var(--primary-dark)]">
              Khám phá bộ thẻ từ vựng được nhiều người học yêu thích.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/flashcards/create"
            className="inline-flex items-center gap-2 rounded-full border-b-[4px] border-[var(--primary-dark)] bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
          >
            + Tạo deck
          </Link>

          <Link
            href="/flashcards/explore"
            className="inline-flex items-center gap-2 rounded-full border-[3px] border-[var(--border)] border-b-[5px] bg-white px-4 py-2 text-sm font-bold text-[var(--primary-dark)] shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:border-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
          >
            Khám phá
          </Link>
        </div>
      </div>
    </div>
  );
}
