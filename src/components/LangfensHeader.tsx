"use client";

import { getMe, logout, resendEmail } from "@/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/app/store/userStore";
import SleepPenguinMini from "./SleepPenguinMini";

const NAV = [
  { label: "Trang chủ", href: "/home" },
  { label: "Luyện đề", href: "/practice" },
  { label: "Từ điển", href: "/dictionary" },
  { label: "Từ vựng", href: "/flashcards" },
];

export default function LangfensHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [userOpen, setUserOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const { user, setUser } = useUserStore();
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user || fetchingRef.current) return;
    (async () => {
      try {
        fetchingRef.current = true;
        const res = await getMe();
        setUser(res.data?.data ?? null);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [user]);

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
      localStorage.removeItem("access_token");
      router.replace("/auth/login");
    } catch {
      setRouteLoading(false);
    }
  };

  const handleVerifyEmail = () => {
    setUserOpen(false);
    if (!email) return;
    if (!pathname.startsWith("/auth/verify")) setRouteLoading(true);
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      {routeLoading && (
        <div className="fixed inset-x-0 top-0 z-[60]">
          <div className="h-0.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 animate-pulse" />
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="h-14 flex items-center justify-between">
              <Link
                href="/home"
                onClick={() => pathname !== "/home" && setRouteLoading(true)}
                className="flex items-center gap-2"
              >
                <span className="text-base sm:text-xl font-bold tracking-wide text-[#2563EB] ">
                  LANGFENS – Best Solution
                </span>
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setUserOpen(true)}
                onMouseLeave={() => setUserOpen(false)}
              >
                <button className="inline-flex items-center justify-center size-8 rounded-full border border-slate-300">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-xs bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center text-slate-700 font-bold">
                      {initialsFromName(displayName)}
                    </span>
                  )}
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full p-2 w-72 rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                    <div className="p-2 flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {displayName}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {email}
                        </div>
                      </div>

                      <span
                        className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                          emailConfirmed
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emailConfirmed ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {emailConfirmed ? "Verified" : "Unverified"}
                      </span>
                    </div>

                    {!emailConfirmed && (
                      <>
                        <div className="h-px bg-slate-200" />
                        <div className="py-1">
                          <button
                            onClick={handleVerifyEmail}
                            className="w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-3"
                          >
                            Xác thực email
                          </button>
                        </div>
                      </>
                    )}

                    <div className="h-px bg-slate-200" />

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-[#3B82F6] shadow-inner">
          <nav className="mx-auto max-w-7xl px-3 h-10 flex items-center gap-4">
            {NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    !pathname.startsWith(item.href) && setRouteLoading(true)
                  }
                  className={`px-3 h-10 flex items-center text-[13px] sm:text-sm font-bold rounded-t-3xl transition ${
                    isActive
                      ? "bg-white text-blue-600 shadow"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div style={{ height: 96 }} />
    </>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] + (parts[1]?.[0] || "")).toUpperCase();
}
