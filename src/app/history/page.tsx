"use client";

// Redesigned Test History page.
// Sections (top → bottom):
//   1. Header band with predicted-band ruler
//   2. Stats strip (4 cards)
//   3. Score trend mini-chart
//   4. Filter bar (skill / time / exam / sort + clear)
//   5. Test list
//   6. Empty state
//   7. Loading / error states handled inline
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAttempt } from "@/services/attempts";
import { getWritingHistory } from "@/services/writing";
import { getSpeakingHistory } from "@/services/speaking";
import { getAnalyticsSummary, getScoreTrend, getPredictedBand } from "@/services/analytics";
import { AttemptCard } from "./_components/AttemptCard";
import { BandRuler } from "./_components/BandRuler";
import { EmptyState } from "./_components/EmptyState";
import {
  FilterBar,
  type ExamTypeFilter,
  type SkillTabKey,
  type SortKey,
  type TimeRangeKey,
} from "./_components/FilterBar";
import { ScoreTrendChart, type TrendSeries } from "./_components/ScoreTrendChart";
import { SkeletonList } from "./_components/SkeletonList";
import { StatCard } from "./_components/StatCard";
import { effectiveBand, formatBand, type AttemptRecord } from "./_lib/utils";

import {
  parseReading,
  parseWriting,
  parseSpeaking,
  parseTrend,
  parseSummary,
  parsePredicted,
} from "./_lib/parsers";
import {
  timeRangeCutoff,
  ts,
  isAcademic,
  isGeneral,
  bandValue,
  bandDescriptorShort,
} from "./_lib/filters";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  // Loaded datasets
  const [readingAttempts, setReadingAttempts] = useState<AttemptRecord[]>([]);
  const [writingAttempts, setWritingAttempts] = useState<AttemptRecord[]>([]);
  const [speakingAttempts, setSpeakingAttempts] = useState<AttemptRecord[]>([]);
  const [trend, setTrend] = useState<TrendSeries[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<{
    totalAttempts: number | null;
    avgScore: number | null;
  } | null>(null);
  const [predictedBand, setPredictedBand] = useState<number | null>(null);

  // UI state
  const [activeSkill, setActiveSkill] = useState<SkillTabKey>("reading");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [examType, setExamType] = useState<ExamTypeFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  // Lifecycle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [readingRes, writingRes, speakingRes, trendRes, summaryRes, predictedRes] =
          await Promise.all([
            getAttempt(1, 50).catch(() => null),
            getWritingHistory().catch(() => null),
            getSpeakingHistory().catch(() => null),
            getScoreTrend(30).catch(() => null),
            getAnalyticsSummary().catch(() => null),
            getPredictedBand().catch(() => null),
          ]);

        if (cancelled) return;

        setReadingAttempts(parseReading(readingRes));
        setWritingAttempts(parseWriting(writingRes));
        setSpeakingAttempts(parseSpeaking(speakingRes));
        setTrend(parseTrend(trendRes));
        setSummaryCounts(parseSummary(summaryRes));
        setPredictedBand(parsePredicted(predictedRes));
      } catch (e) {
        if (!cancelled) {
          const msg =
            e && typeof e === "object" && "message" in e
              ? String(e.message ?? "Failed to load history")
              : "Failed to load history";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  // -------------------------------------------------------------------------
  // Derived: filtered + sorted list for current tab
  // -------------------------------------------------------------------------
  const allForCurrentTab: AttemptRecord[] = useMemo(() => {
    if (activeSkill === "reading") return readingAttempts;
    if (activeSkill === "writing") return writingAttempts;
    return speakingAttempts;
  }, [activeSkill, readingAttempts, writingAttempts, speakingAttempts]);

  const filtered = useMemo(() => {
    const cutoff = timeRangeCutoff(timeRange);
    let list = allForCurrentTab.filter((item) => {
      if (cutoff != null) {
        const ts = item.finishedAt ? new Date(item.finishedAt).getTime() : 0;
        if (!ts || ts < cutoff) return false;
      }
      if (examType !== "all") {
        const tag = item.examType;
        if (examType === "academic" && !isAcademic(tag)) return false;
        if (examType === "general" && !isGeneral(tag)) return false;
      }
      return true;
    });

    if (sort === "highest") {
      list = [...list].sort((a, b) => bandValue(b) - bandValue(a));
    } else if (sort === "lowest") {
      list = [...list].sort((a, b) => bandValue(a) - bandValue(b));
    } else {
      list = [...list].sort((a, b) => ts(b) - ts(a));
    }
    return list;
  }, [allForCurrentTab, timeRange, examType, sort]);

  // -------------------------------------------------------------------------
  // Derived: stats across ALL skills (for the top strip)
  // -------------------------------------------------------------------------
  const stats = useMemo(() => {
    const all = [...readingAttempts, ...writingAttempts, ...speakingAttempts];
    const totalAttempts =
      summaryCounts?.totalAttempts != null
        ? summaryCounts.totalAttempts
        : all.length;
    const scoresWithBand = all
      .map((a) => effectiveBand(a))
      .filter((v): v is number => v != null && !Number.isNaN(v));
    const avgBand =
      scoresWithBand.length > 0
        ? scoresWithBand.reduce((s, v) => s + v, 0) / scoresWithBand.length
        : null;
    const bestBand = scoresWithBand.length > 0 ? Math.max(...scoresWithBand) : null;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const testsThisWeek = all.filter((a) => {
      if (!a.finishedAt) return false;
      const t = new Date(a.finishedAt).getTime();
      return !Number.isNaN(t) && t >= oneWeekAgo;
    }).length;

    return { totalAttempts, avgBand, bestBand, testsThisWeek };
  }, [readingAttempts, writingAttempts, speakingAttempts, summaryCounts]);

  // Tab counts (unfiltered) drive the badges in the filter bar.
  const counts = useMemo(
    () => ({
      reading: readingAttempts.length,
      writing: writingAttempts.length,
      speaking: speakingAttempts.length,
    }),
    [readingAttempts, writingAttempts, speakingAttempts]
  );

  const hasActiveFilters = timeRange !== "all" || examType !== "all" || sort !== "newest";

  function clearFilters() {
    setTimeRange("all");
    setExamType("all");
    setSort("newest");
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const headerSkill = activeSkill; // for AttemptCard `source` prop

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 1. HEADER BAND */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="lg:flex-1">
              <h1
                className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Test History
              </h1>
              <p
                className="text-sm text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Review every IELTS attempt you've taken — band scores, accuracy, dates and trends.
              </p>
            </div>

            {/* Predicted band ruler block */}
            <div className="lg:w-[460px] flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[11px] font-bold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Predicted band (IELTS 1.0–9.0)
                </p>
                <p
                  className="text-sm text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-code)" }}
                >
                  {predictedBand != null
                    ? `Predicted band: ${formatBand(predictedBand)}`
                    : "No prediction yet"}
                </p>
              </div>
              {loading ? (
                <div className="h-10 w-full rounded-full bg-[var(--border)] animate-pulse" />
              ) : (
                <BandRuler predictedBand={predictedBand} />
              )}
            </div>
          </div>
        </motion.section>

        {/* 2. STATS STRIP */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total attempts"
            value={stats.totalAttempts}
            numeric
            loading={loading}
            subLabel={
              !loading && summaryCounts?.totalAttempts != null
                ? `Across all skills`
                : undefined
            }
          />
          <StatCard
            label="Average band"
            value={stats.avgBand != null ? formatBand(stats.avgBand) : "—"}
            numeric
            loading={loading}
            subLabel={!loading && stats.avgBand != null ? bandDescriptorShort(stats.avgBand) : undefined}
          />
          <StatCard
            label="Best band"
            value={stats.bestBand != null ? formatBand(stats.bestBand) : "—"}
            numeric
            loading={loading}
            subLabel={!loading && stats.bestBand != null ? bandDescriptorShort(stats.bestBand) : undefined}
          />
          <StatCard
            label="Tests this week"
            value={stats.testsThisWeek}
            numeric
            loading={loading}
            subLabel={!loading ? "Past 7 days" : undefined}
          />
        </section>

        {/* 3. SCORE TREND */}
        <section className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="text-xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Score trend — last 30 days
            </h2>
          </div>
          {loading ? (
            <div className="h-[160px] w-full rounded-2xl bg-[var(--border)] animate-pulse" />
          ) : (
            <ScoreTrendChart series={trend} />
          )}
        </section>

        {/* 4. FILTER BAR */}
        <section className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6">
          <FilterBar
            activeSkill={activeSkill}
            counts={counts}
            onSkillChange={setActiveSkill}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            examType={examType}
            onExamTypeChange={setExamType}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </section>

        {/* 5. TEST LIST */}
        <section className="space-y-4">
          {error && !loading && (
            <div className="bg-red-50 border-[3px] border-red-200 rounded-[2rem] p-6 text-center">
              <p
                className="text-sm font-bold text-[var(--destructive)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <SkeletonList />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={allForCurrentTab.length === 0 ? "no-data" : "no-matches"}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item, idx) => (
                <AttemptCard
                  key={item.id}
                  attempt={item}
                  source={headerSkill}
                  index={idx}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
