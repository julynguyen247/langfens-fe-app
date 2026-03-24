"use client";

import { motion } from "framer-motion";
import { useCountUp } from "../hooks/useCountUp";
import type { StatsRowProps } from "../types";

interface StatCardProps {
  label: string;
  value: number | string;
  delay: number;
  highlight?: boolean;
}

function StatCard({ label, value, delay, highlight = false }: StatCardProps) {
  const numericValue = typeof value === "number" ? value : parseInt(value) || 0;
  const { value: displayValue } = useCountUp(numericValue, {
    duration: 1000,
    delay,
  });

  return (
    <motion.div
      className={`relative bg-white border-[3px] border-slate-100 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] ${
        highlight ? "border-blue-200" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay, duration: 0.4 }}
    >
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <p
        className={`text-3xl font-bold ${highlight ? "text-blue-600" : "text-slate-800"}`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {displayValue}
        {typeof value === "string" && value.includes("%") && "%"}
      </p>
    </motion.div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function StatsRow({
  totalAttempts,
  avgScore,
  totalStudyTimeMin,
  streak,
}: StatsRowProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Tests taken"
        value={totalAttempts}
        delay={0}
      />
      <StatCard
        label="Average"
        value={`${avgScore.toFixed(0)}%`}
        delay={0.1}
        highlight
      />
      <StatCard
        label="Study time"
        value={formatTime(totalStudyTimeMin)}
        delay={0.2}
      />
      <StatCard
        label="Day streak"
        value={`${streak}`}
        delay={0.3}
      />
    </section>
  );
}
