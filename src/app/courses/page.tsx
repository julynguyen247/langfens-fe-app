"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiSearch, FiStar } from "react-icons/fi";

type Course = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  thumbnail: string;
  category: "IELTS" | "TOEIC" | "Giao tiếp" | "Frontend";
  rating: number; // 0..5
  ratingCount: number;
  learners: number;
  price: number; // VND
  salePrice?: number; // VND
  duration: string; // "8h 30m"
  lessons: number;
};

const COURSES: Course[] = [
  {
    id: "wrt-ielts-8",
    slug: "writing-ielts-8",
    title: "IELTS Writing Mastery 8.0",
    tagline: "Từ nền tảng đến band 8.0 với checklist & sửa bài chi tiết",
    thumbnail:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80&auto=format&fit=crop",
    category: "IELTS",
    rating: 4.9,
    ratingCount: 712,
    learners: 830,
    price: 1299000,
    salePrice: 699000,
    duration: "12h 40m",
    lessons: 68,
  },
  {
    id: "ielts-rd",
    slug: "reading-ielts-7",
    title: "IELTS Reading 7.0+ Roadmap",
    tagline: "Skimming/Scanning, cách phân tích đoạn & bẫy thường gặp",
    thumbnail:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80&auto=format&fit=crop",
    category: "IELTS",
    rating: 4.8,
    ratingCount: 402,
    learners: 1290,
    price: 999000,
    salePrice: 599000,
    duration: "9h 15m",
    lessons: 52,
  },
  {
    id: "toeic-rc",
    slug: "toeic-reading-750",
    title: "TOEIC Reading 750+",
    tagline: "Tập trung Part 5–7 với ngân hàng câu hỏi thực chiến",
    thumbnail:
      "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=1200&q=80&auto=format&fit=crop",
    category: "TOEIC",
    rating: 4.7,
    ratingCount: 310,
    learners: 2210,
    price: 899000,
    salePrice: 549000,
    duration: "7h 20m",
    lessons: 44,
  },
  {
    id: "comm-int",
    slug: "giao-tiep-trung-cap",
    title: "Giao Tiếp Tiếng Anh – Trung Cấp",
    tagline: "Phản xạ tình huống & mẫu câu thường dùng nơi công sở",
    thumbnail:
      "https://images.unsplash.com/photo-1529078155058-5d716f45d604?w=1200&q=80&auto=format&fit=crop",
    category: "Giao tiếp",
    rating: 4.6,
    ratingCount: 198,
    learners: 980,
    price: 599000,
    salePrice: 499000,
    duration: "6h 05m",
    lessons: 36,
  },
  {
    id: "fe-react",
    slug: "frontend-react-foundation",
    title: "Frontend React Foundation",
    tagline: "Tư duy thực chiến, debug & API, mini projects",
    thumbnail:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80&auto=format&fit=crop",
    category: "Frontend",
    rating: 4.8,
    ratingCount: 520,
    learners: 1640,
    price: 1299000,
    salePrice: 799000,
    duration: "14h 10m",
    lessons: 72,
  },
];

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

function StarRating({ value = 5 }: { value?: number }) {
  // hiển thị 5 icon sao, làm tròn .5
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill =
          i < full
            ? "text-yellow-500"
            : i === full && half
            ? "text-yellow-500"
            : "text-slate-300";
        return <FiStar key={i} className={`h-4 w-4 ${fill}`} />;
      })}
    </div>
  );
}

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | Course["category"]>("ALL");
  const [sort, setSort] = useState<
    "popular" | "new" | "rating" | "price_asc" | "price_desc"
  >("popular");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const categories: ("ALL" | Course["category"])[] = [
    "ALL",
    "IELTS",
    "TOEIC",
    "Giao tiếp",
    "Frontend",
  ];

  const filtered = useMemo(() => {
    let list = COURSES.filter((c) => {
      const okCat = category === "ALL" ? true : c.category === category;
      const q = query.trim().toLowerCase();
      const okQ =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      return okCat && okQ;
    });

    switch (sort) {
      case "rating":
        list = list.sort((a, b) => b.rating - a.rating);
        break;
      case "price_asc":
        list = list.sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
        );
        break;
      case "price_desc":
        list = list.sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
        );
        break;
      case "new":
        // demo: tạm giữ thứ tự hiện tại (nếu có createdAt thì sort desc)
        break;
      default:
        // popular: sort theo learners desc
        list = list.sort((a, b) => b.learners - a.learners);
    }

    return list;
  }, [query, category, sort]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, maxPage);
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const go = (p: number) => setPage(Math.min(Math.max(1, p), maxPage));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-blue-100 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B82F6]">Khóa học</h1>
            <p className="text-sm text-[#3B82F6]">
              Xem qua các khóa học nổi bật và phù hợp mục tiêu của bạn.
            </p>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black" />
              <input
                value={query}
                onChange={(e) => {
                  setPage(1);
                  setQuery(e.target.value);
                }}
                placeholder="Tìm khóa học, chủ đề..."
                className="w-72 rounded-xl border border-indigo-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#3B82F6] text-black"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#3B82F6] text-black"
            >
              <option value="popular">Phổ biến</option>
              <option value="new">Mới nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-sm ${
                  active
                    ? "bg-[#3B82F6] text-white"
                    : "border border-indigo-200 bg-white text-[#3B82F6] hover:bg-indigo-50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageItems.map((c) => (
          <article
            key={c.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <Link href={`/courses/${c.slug}`} className="block">
              <div className="relative h-36 w-full overflow-hidden">
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {c.category}
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {c.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  {c.tagline}
                </p>

                <div className="mt-2 flex items-center gap-2 text-[12px]">
                  <StarRating value={c.rating} />
                  <span className="font-medium text-slate-800">
                    {c.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    ({c.ratingCount.toLocaleString()})
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span>{c.duration}</span>
                  <span>•</span>
                  <span>{c.lessons} bài học</span>
                  <span>•</span>
                  <span>{c.learners.toLocaleString()} học viên</span>
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <div className="text-sm font-bold text-slate-900">
                    {formatVND(c.salePrice ?? c.price)}
                  </div>
                  {c.salePrice && (
                    <div className="text-xs text-slate-400 line-through">
                      {formatVND(c.price)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>

      {/* Empty state */}
      {total === 0 && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          Không tìm thấy khóa học phù hợp.
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 1}
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            ‹
          </button>
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-900 px-2 text-white">
            {current}
          </span>
          <span className="text-slate-500">/ {maxPage}</span>
          <button
            onClick={() => go(current + 1)}
            disabled={current === maxPage}
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
