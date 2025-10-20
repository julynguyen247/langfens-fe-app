"use client";

import { usePathname } from "next/navigation";
import LangfensHeader from "@/components/LangfensHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader =
    pathname === "/" ||
    pathname.startsWith("/do-test") ||
    pathname.startsWith("/auth");

  return (
    <>
      {!hideHeader && <LangfensHeader />}
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  );
}
