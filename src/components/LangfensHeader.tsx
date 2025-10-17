"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { label: "Trang chủ", href: "/home" },
  {
    label: "Khóa học",
    href: "/courses",
    children: [
      { label: "Writing IELTS 7.0+", href: "/khoa-hoc/writing-ielts-7" },
      { label: "Reading Mastery", href: "/khoa-hoc/reading" },
    ],
  },
  { label: "Luyện đề", href: "/practice", children: [] },
  { label: "Từ điển", href: "/dictionary", children: [] },
  { label: "Từ vựng", href: "/flashcards", children: [] },
];

export default function LangfensHeader() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<NavItem | null>(null);

  const [hideBrand, setHideBrand] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const goingDown = y > lastY.current;
          setHideBrand(goingDown && y > 24); // cuộn xuống thì ẩn brand
          setScrolled(y > 0); // thêm bóng nhẹ khi có scroll
          lastY.current = y;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const spacerHeight = hideBrand ? 40 : 96; // 40 = h-10 (nav), 96 = 56 (brand) + 40 (nav)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 font-nunito">
        {/* Brand bar: THU GỌN CHIỀU CAO thay vì translate */}
        <div
          className={[
            "w-full bg-white overflow-hidden transition-all duration-300 ease-out",
            hideBrand ? "max-h-0 opacity-0" : "max-h-14 opacity-100",
            scrolled ? "shadow-sm" : "",
          ].join(" ")}
          aria-hidden={hideBrand}
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center justify-between">
              <Link
                href="/"
                className="text-base sm:text-xl font-bold tracking-wide text-[#2563EB]"
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
        </div>

        {/* Nav xanh */}
        <div
          className="w-full bg-[#3B82F6] transition-shadow duration-300 ease-out"
          onMouseLeave={() => setHovered(null)}
        >
          <nav className="w-full">
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
                      className={`px-3 h-10 flex items-center text-[13px] sm:text-sm font-bold rounded-t-3xl transition
                        ${
                          isActive
                            ? "bg-white text-[#2563EB] shadow"
                            : "text-white/95 hover:text-white"
                        }`}
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
      <div style={{ height: spacerHeight }} />
    </>
  );
}
