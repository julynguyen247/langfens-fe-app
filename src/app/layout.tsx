import { Nunito } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${nunito.variable} font-nunito text-gray-900 overflow-hidden`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
