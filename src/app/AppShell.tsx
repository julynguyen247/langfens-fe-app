"use client";

import { usePathname } from "next/navigation";
import LangfensHeader from "@/components/LangfensHeader";
import ChatbotWidget from "@/components/ChatbotWidget";
import AuthWrapper from "@/components/AuthWrapper";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeader =
    pathname === "/" ||
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
    pathname.startsWith("/practice");

  const content = requireAuth ? (
    <AuthWrapper>{children}</AuthWrapper>
  ) : (
    children
  );

  return (
    <>
      {!hideHeader && <LangfensHeader />}
      <main className="min-h-screen bg-gray-50">
        {content}
        {requireAuth && <ChatbotWidget />}
      </main>
    </>
  );
}
