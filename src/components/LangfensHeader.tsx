"use client";

import { getMe, logout } from "@/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/app/store/userStore";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "Practice", href: "/practice" },
  { label: "Vocabulary", href: "/flashcards" },
  { label: "Dictionary", href: "/dictionary" },
  { label: "Analytics", href: "/analytics" },
  { label: "Bookmarks", href: "/bookmarks" },
  { label: "Study Plan", href: "/study-plan" },
];

export default function LangfensHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [userOpen, setUserOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [user, setUser]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const displayName = user?.email || "User";
  const avatarUrl = (user as any)?.avatarUrl || "";
  const email = user?.email || "";

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setUserOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setUserOpen(false);
    }, 300);
  };

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

  return (
    <>
      {/* Loading bar */}
      {routeLoading && (
        <div className="fixed inset-x-0 top-0 z-[60]">
          <div className="h-1 w-full bg-[var(--primary)] animate-pulse rounded-b-full" />
        </div>
      )}

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white border-b-[3px] border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Logo */}
            <Link
              href="/home"
              onClick={() => pathname !== "/home" && setRouteLoading(true)}
              className="flex items-center"
            >
              <span
                className="text-xl font-bold tracking-wide text-[var(--primary)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                LANGFENS
              </span>
            </Link>

            {/* Center: Text-only Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => !isActive && setRouteLoading(true)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--primary)] text-white shadow-[0_3px_0_var(--primary-dark)]"
                        : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Notification Bell + User Avatar */}
            <div className="flex items-center gap-3">
              <NotificationBell />

              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[2px] border-[var(--border)] bg-[var(--primary-light)] hover:border-[var(--primary)] transition-all duration-150 shadow-[0_2px_0_var(--border)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
                  ) : (
                    <span
                      className="text-sm font-bold text-[var(--primary)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {initialsFromName(displayName)}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-60 rounded-[1.5rem] bg-white border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="p-4 border-b-[2px] border-[var(--border)]">
                      <p className="font-bold text-[var(--foreground)] truncate">{displayName}</p>
                      <p className="text-sm text-[var(--text-muted)] truncate">{email}</p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={handleProfile}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-[var(--text-body)] hover:bg-[var(--primary-light)] transition-colors"
                      >
                        My Profile
                      </button>
                      <Link
                        href="/achievements"
                        onClick={() => setUserOpen(false)}
                        className="block w-full text-left px-5 py-3 text-sm font-semibold text-[var(--text-body)] hover:bg-[var(--primary-light)] transition-colors"
                      >
                        Achievements
                      </Link>
                      <Link
                        href="/leaderboard"
                        onClick={() => setUserOpen(false)}
                        className="block w-full text-left px-5 py-3 text-sm font-semibold text-[var(--text-body)] hover:bg-[var(--primary-light)] transition-colors"
                      >
                        Leaderboard
                      </Link>
                      <Link
                        href="/notes"
                        onClick={() => setUserOpen(false)}
                        className="block w-full text-left px-5 py-3 text-sm font-semibold text-[var(--text-body)] hover:bg-[var(--primary-light)] transition-colors"
                      >
                        My Notes
                      </Link>
                    </div>

                    <div className="border-t-[2px] border-[var(--border)] py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-[var(--destructive)] hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header spacer */}
      <div style={{ height: 64 }} />
    </>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] + (parts[1]?.[0] || "")).toUpperCase();
}
