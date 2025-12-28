"use client";

import { getMe, logout } from "@/utils/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@/app/store/userStore";
import { NotificationBell } from "./NotificationBell";

// Unified Navigation items with icons
const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Practice", href: "/practice", icon: "edit_note" },
  { label: "Vocabulary", href: "/flashcards", icon: "style" },
  { label: "Analytics", href: "/analytics", icon: "bar_chart" },
  { label: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  { label: "Study Plan", href: "/study-plan", icon: "calendar_month" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

  // Cleanup timeout on unmount
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

  // Handle mouse enter - clear any pending close timeout and open immediately
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setUserOpen(true);
  };

  // Handle mouse leave - add delay before closing (300ms instead of instant)
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
          <div className="h-0.5 w-full bg-[#3B82F6] animate-pulse" />
        </div>
      )}

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Logo */}
            <Link
              href="/home"
              onClick={() => pathname !== "/home" && setRouteLoading(true)}
              className="flex items-center"
            >
              <span className="font-serif text-xl font-bold tracking-wide text-[#3B82F6]">
                LANGFENS
              </span>
            </Link>

            {/* Center: Unified Icon-Rich Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => !isActive && setRouteLoading(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#3B82F6]"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name={item.icon} className="text-xl" />
                    <span>{item.label}</span>
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
                <button className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover" alt="Avatar" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">
                      {initialsFromName(displayName)}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="p-4 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 truncate">{displayName}</p>
                      <p className="text-sm text-slate-500 truncate">{email}</p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Icon name="person" className="text-lg text-[#3B82F6]" />
                        My Profile
                      </button>
                      <Link
                        href="/achievements"
                        onClick={() => setUserOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Icon name="emoji_events" className="text-lg text-[#3B82F6]" />
                        Achievements
                      </Link>
                      <Link
                        href="/leaderboard"
                        onClick={() => setUserOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Icon name="leaderboard" className="text-lg text-[#3B82F6]" />
                        Leaderboard
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <Icon name="logout" className="text-lg" />
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
