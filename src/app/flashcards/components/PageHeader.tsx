import Link from "next/link";
import { BookOpen, Search, Plus } from "lucide-react";

export default function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Title + Icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-indigo-900">
              Langfens Flashcards
            </h1>
            <p className="text-sm text-indigo-700">
              Khám phá bộ thẻ từ vựng được nhiều người học yêu thích.
            </p>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/flashcards/create"
            className="inline-flex items-center gap-2 rounded-xl border  bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Tạo deck
          </Link>

          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow hover:bg-indigo-50 hover:text-indigo-800"
          >
            <Search className="h-4 w-4" /> Khám phá
          </Link>
        </div>
      </div>
    </div>
  );
}
