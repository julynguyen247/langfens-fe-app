// components/LangfensHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Khóa học",
    href: "/khoa-hoc",
    children: [
      { label: "Writing IELTS 7.0+", href: "/khoa-hoc/writing-ielts-7" },
      { label: "Reading Mastery", href: "/khoa-hoc/reading" },
    ],
  },
  { label: "Luyện đề", href: "/luyen-de", children: [] },
  { label: "Từ điển", href: "/tu-dien", children: [] },
  { label: "Từ vựng", href: "/tu-vung", children: [] },
];

export default function LangfensHeader() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<NavItem | null>(null);

  return (
    <header className="w-full bg-white font-nunito">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-wide text-[#2563EB]"
          >
            LANGFENS – Master Reading, Master IELTS
          </Link>

          <button
            aria-label="Account"
            className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black">
              <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.686-8 6v2h16v-2c0-3.314-3.582-6-8-6z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full" onMouseLeave={() => setHovered(null)}>
        <nav className="w-full bg-[#3B82F6]">
          <div className="mx-auto max-w-7xl px-3 h-10 flex items-center gap-4">
            {NAV.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setHovered(item)}
                >
                  <Link
                    href={item.href}
                    className={
                      "px-3 h-10 flex items-center text-[13px] sm:text-sm font-bold text-white/95 hover:text-white transition " +
                      (isActive
                        ? "bg-white text-slate-900 rounded-full shadow px-3 py-[6px]"
                        : "")
                    }
                  >
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>
        {hovered && hovered.children && hovered.children.length > 0 && (
          <div className="w-full bg-white border-t">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="flex gap-6">
                {hovered.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="text-sm text-slate-700 hover:text-[#2563EB]"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
