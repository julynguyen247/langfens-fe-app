"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import LangfensHeader from "@/components/LangfensHeader";
import ChatbotWidget from "@/components/ChatbotWidget";
import AuthWrapper from "@/components/AuthWrapper";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLanding = pathname === "/";

  // Load Material Symbols font only on non-landing routes (saves ~100KB on landing page)
  useEffect(() => {
    if (isLanding) return;
    const id = "material-symbols-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0";
    document.head.appendChild(link);
  }, [isLanding]);

  const hideHeader =
    isLanding ||
    pathname.startsWith("/do-test") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/placement");

  const requireAuth =
    pathname.startsWith("/attempts") ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/dictionary") ||
    pathname.startsWith("/do-test") ||
    pathname.startsWith("/flashcards") ||
    pathname.startsWith("/placement") ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/study-plan");

  const content = requireAuth ? (
    <AuthWrapper>{children}</AuthWrapper>
  ) : (
    children
  );

  return (
    <>
      {!hideHeader && <LangfensHeader />}
      <main className={cn("min-h-screen", !isLanding && "bg-gray-50")}>
        {content}
        {requireAuth && <ChatbotWidget />}
      </main>
    </>
  );
}
