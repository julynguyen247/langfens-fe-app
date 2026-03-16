"use client";

import { usePathname } from "next/navigation";
import LangfensHeader from "@/components/LangfensHeader";
import ChatbotWidget from "@/components/ChatbotWidget";
import AuthWrapper from "@/components/AuthWrapper";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLanding = pathname === "/";

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
