import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";
import { Suspense } from "react";
import LoadingLayer from "@/components/LoadingLayer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body
        className={`antialiased ${inter.variable} ${merriweather.variable} font-sans text-gray-900 bg-[#F8FAFC]`}
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
