"use client";

import { logout } from "@/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  { label: "Trang chủ", href: "/home" },
  { label: "Khóa học", href: "/courses" },
  { label: "Luyện đề", href: "/practice", children: [] },
  { label: "Từ điển", href: "/dictionary", children: [] },
  { label: "Từ vựng", href: "/flashcards", children: [] },
];

export default function LangfensHeader() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<NavItem | null>(null);
  const router = useRouter();
  const [hideBrand, setHideBrand] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const [userOpen, setUserOpen] = useState(false);

  const user = {
    name: "Langfens User",
    email: "user@langfens.com",
    active: true,
    avatarUrl: "",
  };

  const spacerHeight = hideBrand ? 40 : 96;

  const handleProfile = () => {
    console.log("Go profile");
    setUserOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }
      setUserOpen(false);
      router.replace("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 font-nunito">
        <div
          className={[
            "w-full bg-white  transition-all duration-300 ease-out",
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

              <div
                className="relative"
                onMouseEnter={() => setUserOpen(true)}
                onMouseLeave={() => setUserOpen(false)}
              >
                <button
                  aria-label="Account"
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                  className="inline-flex size-8 items-center justify-center rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  onFocus={() => setUserOpen(true)}
                  onBlur={(e) => {
                    if (
                      !e.currentTarget.parentElement?.contains(
                        e.relatedTarget as Node
                      )
                    ) {
                      setUserOpen(false);
                    }
                  }}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold w-8 h-8 text-xs">
                      {initialsFromName(user.name)}
                    </span>
                  )}
                </button>

                {userOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full p-2 w-72 rounded-2xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
                  >
                    <div className="p-3 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold w-11 h-11">
                        {initialsFromName(user.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {user.name}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {user.email}
                        </div>
                      </div>
                      <span
                        className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          user.active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                        title={
                          user.active ? "Đang hoạt động" : "Không hoạt động"
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.active ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="py-1">
                      <button
                        role="menuitem"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleProfile}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 fill-current"
                        >
                          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.686-8 6v2h16v-2c0-3.314-3.582-6-8-6Z" />
                        </svg>
                        <span>Trang cá nhân</span>
                      </button>

                      <button
                        role="menuitem"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-rose-700 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 fill-current"
                        >
                          <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                        </svg>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
        </div>
      </header>
      <div style={{ height: spacerHeight }} />
    </>
  );
}

function initialsFromName(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
