import Link from "next/link";
import { BookOpen, Search } from "lucide-react";

export default function PageHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="flex items-center justify-between gap-3">
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
        <Link
          href="#"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow hover:bg-indigo-50 hover:text-indigo-800"
        >
          <Search className="h-4 w-4" /> Khám phá
        </Link>
      </div>
    </div>
  );
}
