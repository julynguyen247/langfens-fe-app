"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function PracticeTopBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const tab = (sp.get("tab") ?? "todo") as "todo" | "done";
  const q = sp.get("q") ?? "";

  const setQuery = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-1 flex items-center gap-2 text-black">
      <button
        onClick={() => setQuery("tab", "todo")}
        className={`rounded px-3 py-1 text-sm ${
          tab === "todo" ? "bg-slate-900 text-white" : "bg-slate-100"
        }`}
      >
        To do
      </button>
      <button
        onClick={() => setQuery("tab", "done")}
        className={`rounded px-3 py-1 text-sm ${
          tab === "done" ? "bg-slate-900 text-white" : "bg-slate-100"
        }`}
      >
        Done
      </button>
      <input
        defaultValue={q}
        onChange={(e) => setQuery("q", e.target.value)}
        placeholder="Search…"
        className="ml-auto w-64 rounded border border-slate-300 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}
