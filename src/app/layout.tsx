import { Nunito } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";
import { Suspense } from "react";

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
        <Suspense>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
