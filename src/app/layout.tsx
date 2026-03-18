import { Fredoka, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";
import { Suspense } from "react";
import LoadingLayer from "@/components/LoadingLayer";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Langfens",
  icons: {
    icon: "/langfens.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fredoka.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body
        className="antialiased font-sans text-gray-900 bg-[#F8FAFC]"
        suppressHydrationWarning
      >
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-white text-gray-500">
              Loading Langfens...
            </div>
          }
        >
          <AppShell>{children}</AppShell>
        </Suspense>
        <LoadingLayer />
      </body>
    </html>
  );
}
