"use client";
export { formatTestTime as formatTime } from "@/lib/time";

// Material Icon Component
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

export type QA = Record<string, string>;
