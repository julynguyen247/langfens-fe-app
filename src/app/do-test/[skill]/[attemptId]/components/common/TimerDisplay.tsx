"use client";
import { useEffect, useState, useRef, useCallback } from "react";

interface TimerDisplayProps {
  startedAt?: string | Date;
  durationSec?: number;
  onTimeUp?: () => void;
}

export default function TimerDisplay({
  startedAt,
  durationSec = 40 * 60,
  onTimeUp,
}: TimerDisplayProps) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);

  const calculateTimeLeft = useCallback(() => {
    if (!startedAt) return durationSec;
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    return Math.max(0, durationSec - elapsed);
  }, [startedAt, durationSec]);

  useEffect(() => {
    // Initial calculation
    setSeconds(calculateTimeLeft());

    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setSeconds(remaining);

      if (remaining <= 0 && !hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        clearInterval(intervalRef.current!);
        onTimeUp?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculateTimeLeft, onTimeUp]);

  if (seconds === null) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Color thresholds
  const isWarning = seconds <= 5 * 60; // < 5 min = orange
  const isCritical = seconds <= 60; // < 1 min = red + pulse

  let colorClass = "border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)]";
  if (isCritical) {
    colorClass = "border-red-300 bg-red-50 text-red-600 animate-pulse";
  } else if (isWarning) {
    colorClass = "border-orange-300 bg-orange-50 text-orange-600";
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${colorClass} transition-colors duration-500`}
    >
      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Time</span>
      <span className="font-semibold tabular-nums">
        {mm}:{ss}
      </span>
    </div>
  );
}
