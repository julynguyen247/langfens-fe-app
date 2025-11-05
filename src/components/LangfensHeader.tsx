"use client";

import { getMe, logout, resendEmail } from "@/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/app/store/userStore";

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
  const router = useRouter();

  const [hovered, setHovered] = useState<NavItem | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const fetchingRef = useRef(false);

  const { user, setUser } = useUserStore();
  useEffect(() => {
    if (user || fetchingRef.current) return;
    (async () => {
      try {
        fetchingRef.current = true;
        const res = await getMe();
        setUser(res.data?.data ?? null);
      } catch {
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [user, setUser]);

  const displayName = user?.email || "User";
  const avatarUrl = (user as any)?.avatarUrl || "";
  const email = user?.email || "";
  const emailConfirmed = (user as any)?.emailConfirmed === true;

  const handleProfile = () => {
    setUserOpen(false);
    if (!pathname.startsWith("/profile")) setRouteLoading(true);
    router.push("/profile");
  };

  const handleLogout = async () => {
    try {
      setRouteLoading(true);
      await logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
      }

      setUserOpen(false);
      router.replace("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      setRouteLoading(false);
    }
  };

  return (
    <>
      {routeLoading && (
        <div className="fixed inset-x-0 top-0 z-[60]">
          <div className="h-0.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 animate-pulse" />
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-50 font-nunito">
        {/* Brand bar */}
        <div className="w-full bg-white transition-all duration-300 ease-out shadow-sm">
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center justify-between">
              <Link
                href="/home"
                className="text-base sm:text-xl font-bold tracking-wide text-[#2563EB]"
                onClick={() => {
                  if (pathname !== "/home") setRouteLoading(true);
                }}
              >
                LANGFENS – Best Solution
              </Link>

              {/* User menu */}
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
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold w-8 h-8 text-xs">
                      {initialsFromName(displayName)}
                    </span>
                  )}
                </button>

                {userOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full p-2 w-72 rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
                  >
                    <div className="p-2 flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {displayName}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {email || "—"}
                        </div>
                      </div>

                      <span
                        className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          emailConfirmed
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                        title={
                          emailConfirmed
                            ? "Email đã xác thực"
                            : "Email chưa xác thực"
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            emailConfirmed ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {emailConfirmed ? "Verified" : "Unverified"}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div className="py-1">
                      {!emailConfirmed && !!email && (
                        <div className="px-3 py-2 text-xs text-amber-600 flex items-center justify-between">
                          <span>Chưa xác thực email</span>
                          <button
                            onClick={async () => {
                              try {
                                setRouteLoading(true);
                                await resendEmail(email);
                                router.replace(
                                  `/auth/verify?email=${encodeURIComponent(
                                    email
                                  )}`
                                );
                              } catch {
                                alert("Gửi lại email xác thực thất bại.");
                                setRouteLoading(false);
                              }
                            }}
                            className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Xác thực ngay
                          </button>
                        </div>
                      )}

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
                        <span className="text-xs">Trang cá nhân</span>
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
                        <span className="text-xs">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav bar */}
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
                      onClick={() => {
                        if (!pathname.startsWith(item.href))
                          setRouteLoading(true);
                      }}
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

      {/* spacer */}
      <div style={{ height: 96 }} />
    </>
  );
}

function initialsFromName(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
