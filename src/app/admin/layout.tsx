"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRequireAdmin, clearStoredAdminUser } from "./_lib/adminAuth";
import { removeTokenCookie } from "@/utils/cookie";
import { apisAuth } from "@/utils/api.customize";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const { user, isLoading, isAuthorized } = useRequireAdmin("/admin/login", !isLoginPage);

  if (isLoginPage) {
    return <>{children}</>;
  }
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium tracking-wide text-slate-400">
          Verifying administrator credentials...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await apisAuth.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearStoredAdminUser();
      removeTokenCookie();
      router.push("/admin/login");
    }
  };

  const navItems = [
    {
      name: "Exams",
      href: "/admin/exams",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      name: "Question Bank",
      href: "/admin/questions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-950 text-slate-100 font-sans antialiased select-text">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              LF
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white">Langfens</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                Exam Admin
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin/exams"
                  ? pathname.startsWith("/admin/exams")
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className={isActive ? "text-indigo-400" : "text-slate-500"}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & exit area */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div className="px-3 py-2 mb-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="text-xs font-medium text-slate-300 truncate" title={user?.email}>
              {user?.email || "Admin"}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Admin
              </span>
              <span className="text-[10px] text-slate-500">Verified</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/home"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Exit to Learner App
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition text-left w-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
