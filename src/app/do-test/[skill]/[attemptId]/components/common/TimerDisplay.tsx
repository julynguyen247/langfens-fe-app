"use client";
import { useEffect, useState, useRef } from "react";
import { FiClock } from "react-icons/fi";

interface TimerDisplayProps {
  initialSeconds?: number; // tổng thời gian (giây)
  onTimeUp?: () => void; // callback khi hết giờ
}

export default function TimerDisplay({
  initialSeconds = 40 * 60, // mặc định 40 phút
  onTimeUp,
}: TimerDisplayProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (seconds <= 0) {
      clearInterval(intervalRef.current!);
      if (onTimeUp) onTimeUp();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [seconds, onTimeUp]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const warning = seconds <= 5 * 60;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-lg border 
      ${
        warning
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }
      transition-colors duration-500`}
    >
      <FiClock className="text-base" />
      <span className="font-semibold tabular-nums">
        {mm}:{ss}
      </span>
    </div>
  );
}
