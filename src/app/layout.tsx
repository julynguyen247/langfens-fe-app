import { Nunito } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";
import { Suspense } from "react";
import LoadingLayer from "@/components/LoadingLayer";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`antialiased ${nunito.variable} font-nunito text-gray-900`}
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
