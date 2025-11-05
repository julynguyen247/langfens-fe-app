"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface QuestionNavProps {
  attemptId: string;
  total: number;
  current: number;
  skill?: "reading" | "listening" | "writing";
  onSelect?: (questionNumber: number) => void;
}

export default function QuestionNav({
  attemptId,
  total,
  current,
  skill,
  onSelect,
}: QuestionNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (n: number) => {
    if (onSelect) return onSelect(n);

    const params = new URLSearchParams(searchParams.toString());
    params.set("q", String(n));

    const basePath = `/do-test/${skill ?? "reading"}/${attemptId}`;
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => handleClick(n)}
          className={`w-8 h-8 rounded transition-colors duration-150 font-medium
            ${
              n === current
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
