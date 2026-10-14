"use client";

import Link from "next/link";
import PenguinLottie from "@/components/PenguinLottie";

// ====================================
// EMPTY STATE WITH PENGUIN
// ====================================
export function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      {/* Penguin Mascot */}
      <div className="w-32 h-32 mb-6">
        <PenguinLottie />
      </div>

      <p
        className="text-lg font-bold text-[var(--foreground)] mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </p>
      <p className="text-sm text-[var(--text-muted)] mb-6">{subtitle}</p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
