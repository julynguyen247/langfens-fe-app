"use client";
import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";

export default function TimerDisplay() {
  const [seconds, setSeconds] = useState(33 * 60 + 33);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-gray-700">
      <FiClock />
      <span className="font-semibold">
        {mm}:{ss}
      </span>
    </div>
  );
}
