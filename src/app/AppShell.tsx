"use client";

import { usePathname } from "next/navigation";
import LangfensHeader from "@/components/LangfensHeader";
import { useEffect } from "react";
import { useUserStore } from "./store/userStore";
import { getMe } from "@/utils/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader =
    pathname === "/" ||
    pathname.startsWith("/do-test") ||
    pathname.startsWith("/auth");
  const { setUser } = useUserStore();
  useEffect(() => {
    const fetchUser = async () => {
      const res = await getMe();
      setUser(res.data.data);
    };
    fetchUser();
  }, []);

  return (
    <>
      {!hideHeader && <LangfensHeader />}
      <main className="min-h-screen bg-gray-50">{children}</main>
    </>
  );
}
